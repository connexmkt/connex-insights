import { InstagramIntegrationStatus, InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  buildPostPayload,
  getTotalInteractions,
  pickLatestSnapshotsForMedia,
} from "@/lib/instagram/reports/post-metrics-builder";
import {
  formatDateUtc,
  getPreviousWeekRange,
} from "@/lib/instagram/reports/report-date-utils";
import type {
  WeeklyReportIngestRequest,
  WeekRange,
} from "@/lib/instagram/reports/report-types";

/**
 * Gera o relatório semanal de um tenant específico para o intervalo dado.
 * Retorna null se a integração não for encontrada ou não estiver CONNECTED.
 */
export async function generateWeeklyReportForTenant(
  tenantId: string,
  range: WeekRange,
): Promise<WeeklyReportIngestRequest | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
    select: {
      id: true,
      tenantId: true,
      status: true,
    },
  });

  if (!integration || integration.status !== InstagramIntegrationStatus.CONNECTED) {
    return null;
  }

  const { weekStart, weekEnd, year, month, week } = range;

  const sourceReportId = `weekly-${tenantId}-${year}-${month}-${week}`;

  const mediaItems = await prisma.instagramMedia.findMany({
    where: {
      integrationId: integration.id,
      isRemoved: false,
      publishedAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    select: {
      id: true,
      externalMediaId: true,
      permalink: true,
      thumbnailUrl: true,
      mediaType: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  if (mediaItems.length === 0) {
    return {
      sourceReportId,
      clienteId: tenantId,
      referenceYear: year,
      referenceMonth: month,
      referenceWeek: week,
      periodStart: formatDateUtc(weekStart),
      periodEnd: formatDateUtc(weekEnd),
      generatedAt: new Date().toISOString(),
      status: "PARTIAL",
      bestPost: null,
      worstPost: null,
    };
  }

  const externalIds = mediaItems.map((m) => m.externalMediaId);

  const allSnapshots = await prisma.instagramMetricSnapshot.findMany({
    where: {
      integrationId: integration.id,
      scope: InstagramMetricScope.MEDIA,
      entityId: { in: externalIds },
    },
    select: {
      entityId: true,
      metricName: true,
      value: true,
      collectedAt: true,
    },
    orderBy: { collectedAt: "desc" },
  });

  const mediaWithMetrics = mediaItems.map((media) => {
    const snapshots = pickLatestSnapshotsForMedia(
      media.externalMediaId,
      allSnapshots,
    );
    const totalInteractions = getTotalInteractions(snapshots);

    return { media, snapshots, totalInteractions };
  });

  const withMetrics = mediaWithMetrics.filter(
    (m) => m.totalInteractions !== null,
  );

  if (withMetrics.length === 0) {
    return {
      sourceReportId,
      clienteId: tenantId,
      referenceYear: year,
      referenceMonth: month,
      referenceWeek: week,
      periodStart: formatDateUtc(weekStart),
      periodEnd: formatDateUtc(weekEnd),
      generatedAt: new Date().toISOString(),
      status: "PARTIAL",
      bestPost: null,
      worstPost: null,
    };
  }

  withMetrics.sort(
    (a, b) => (b.totalInteractions ?? 0) - (a.totalInteractions ?? 0),
  );

  const best = withMetrics[0]!;
  const worst = withMetrics[withMetrics.length - 1]!;

  return {
    sourceReportId,
    clienteId: tenantId,
    referenceYear: year,
    referenceMonth: month,
    referenceWeek: week,
    periodStart: formatDateUtc(weekStart),
    periodEnd: formatDateUtc(weekEnd),
    generatedAt: new Date().toISOString(),
    status: "AVAILABLE",
    bestPost: buildPostPayload(best.media, best.snapshots),
    worstPost:
      best.media.externalMediaId !== worst.media.externalMediaId
        ? buildPostPayload(worst.media, worst.snapshots)
        : null,
  };
}

/**
 * Gera relatórios semanais para todos os tenants com integração CONNECTED,
 * usando a semana anterior à data fornecida (padrão: agora).
 *
 * Retorna os relatórios gerados, ignorando tenants sem integração ativa.
 */
export async function generateWeeklyReportsForAllTenants(
  now: Date = new Date(),
): Promise<{ tenantId: string; report: WeeklyReportIngestRequest | null }[]> {
  const range = getPreviousWeekRange(now);

  const integrations = await prisma.instagramIntegration.findMany({
    where: { status: InstagramIntegrationStatus.CONNECTED },
    select: { tenantId: true },
  });

  const results: { tenantId: string; report: WeeklyReportIngestRequest | null }[] = [];

  for (const { tenantId } of integrations) {
    const report = await generateWeeklyReportForTenant(tenantId, range);
    results.push({ tenantId, report });
  }

  return results;
}
