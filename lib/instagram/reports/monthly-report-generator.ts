import { prisma } from "@/lib/db/prisma";

import {
  InstagramIntegrationStatus,
  InstagramMetricScope,
} from "@/lib/generated/prisma";

import {
  buildPostPayload,
  getTotalInteractions,
  pickLatestSnapshotsForMedia,
} from "@/lib/instagram/reports/post-metrics-builder";

import {
  formatDateUtc,
  getPreviousMonthRange,
} from "@/lib/instagram/reports/report-date-utils";

import type {
  MonthlyReportIngestRequest,
  MonthRange,
  PostPayload,
} from "@/lib/instagram/reports/report-types";

const TOP_POSTS_LIMIT = 3;

type FollowerStats = {
  followersStart: number | null;
  followersEnd: number | null;
  followersGained: number | null;
  followersGrowthPct: number | null;
};

type AccountReachStats = {
  accountsReached: number | null;
};

async function computeFollowerStats(
  integrationId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<FollowerStats> {
  const snapshots = await prisma.instagramMetricSnapshot.findMany({
    where: {
      integrationId,
      scope: InstagramMetricScope.ACCOUNT,
      metricName: "follower_count",
      collectedAt: { gte: monthStart, lte: monthEnd },
      value: { not: null },
    },
    select: { value: true, collectedAt: true },
    orderBy: { collectedAt: "asc" },
  });

  if (snapshots.length === 0) {
    return {
      followersStart: null,
      followersEnd: null,
      followersGained: null,
      followersGrowthPct: null,
    };
  }

  const followersStart = Number(snapshots[0]!.value);
  const followersEnd = Number(snapshots[snapshots.length - 1]!.value);
  const followersGained = followersEnd - followersStart;
  const followersGrowthPct =
    followersStart > 0
      ? Math.round((followersGained / followersStart) * 10000) / 100
      : null;

  return { followersStart, followersEnd, followersGained, followersGrowthPct };
}

async function computeAccountReach(
  integrationId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<AccountReachStats> {
  const result = await prisma.instagramMetricSnapshot.aggregate({
    where: {
      integrationId,
      scope: InstagramMetricScope.ACCOUNT,
      metricName: "reach",
      collectedAt: { gte: monthStart, lte: monthEnd },
      value: { not: null },
    },
    _sum: { value: true },
  });

  const sum = result._sum.value;
  return { accountsReached: sum !== null ? Math.round(Number(sum)) : null };
}

/**
 * Gera o relatório mensal de um tenant específico para o intervalo dado.
 * Retorna null se a integração não for encontrada ou não estiver CONNECTED.
 */
export async function generateMonthlyReportForTenant(
  tenantId: string,
  range: MonthRange,
): Promise<MonthlyReportIngestRequest | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
    select: { id: true, tenantId: true, status: true },
  });

  const isNotConnected = !integration || integration.status !== InstagramIntegrationStatus.CONNECTED;

  if (isNotConnected) {
    return null;
  }

  const { monthStart, monthEnd, year, month } = range;

  const sourceReportId = `monthly-${tenantId}-${year}-${month}`;

  const [followerStats, reachStats] = await Promise.all([
    computeFollowerStats(integration.id, monthStart, monthEnd),
    computeAccountReach(integration.id, monthStart, monthEnd),
  ]);

  const mediaItems = await prisma.instagramMedia.findMany({
    where: {
      integrationId: integration.id,
      isRemoved: false,
      publishedAt: { gte: monthStart, lte: monthEnd },
    },
    select: {
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
      generatedAt: new Date().toISOString(),
      status: "PARTIAL",
      topPosts: [],
      worstPost: null,
      ...followerStats,
      ...reachStats,
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
      generatedAt: new Date().toISOString(),
      status: "PARTIAL",
      topPosts: [],
      worstPost: null,
      ...followerStats,
      ...reachStats,
    };
  }

  withMetrics.sort(
    (a, b) => (b.totalInteractions ?? 0) - (a.totalInteractions ?? 0),
  );

  const topPosts: PostPayload[] = withMetrics
    .slice(0, TOP_POSTS_LIMIT)
    .map(({ media, snapshots }) => buildPostPayload(media, snapshots));

  const lastEntry = withMetrics[withMetrics.length - 1]!;
  const worstPost = !topPosts.some(
    (p) => p.instagramMediaId === lastEntry.media.externalMediaId,
  )
    ? buildPostPayload(lastEntry.media, lastEntry.snapshots)
    : null;

  return {
    sourceReportId,
    clienteId: tenantId,
    referenceYear: year,
    referenceMonth: month,
    generatedAt: new Date().toISOString(),
    status: "AVAILABLE",
    topPosts,
    worstPost,
    ...followerStats,
    ...reachStats,
  };
}

/**
 * Deve ser chamada apenas na primeira semana do mês (dia <= 7),
 * mas a verificação de calendário cabe ao service/cron.
 */
export async function generateMonthlyReportsForAllTenants(
  now: Date = new Date(),
): Promise<
  {
    tenantId: string;
    report: MonthlyReportIngestRequest | null;
    range: MonthRange;
  }[]
> {
  const range = getPreviousMonthRange(now);

  const integrations = await prisma.instagramIntegration.findMany({
    where: { status: InstagramIntegrationStatus.CONNECTED },
    select: { tenantId: true },
  });

  const results: {
    tenantId: string;
    report: MonthlyReportIngestRequest | null;
    range: MonthRange;
  }[] = [];

  for (const { tenantId } of integrations) {
    const report = await generateMonthlyReportForTenant(tenantId, range);
    results.push({ tenantId, report, range });
  }

  return results;
}

export { formatDateUtc };
