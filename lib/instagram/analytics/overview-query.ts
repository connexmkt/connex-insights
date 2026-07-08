import { unstable_cache } from "next/cache";
import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { computeTrend } from "@/lib/instagram/analytics/trend";
import {
  formatDateIso,
  getComparisonRange,
  parseAnalyticsPeriod,
} from "@/lib/instagram/analytics/period";
import { getMetricLabel } from "@/lib/instagram/insights/metrics/registry";
import { getDashboardIntegration } from "@/lib/instagram/integration-service";
import type {
  AnalyticsPeriodPreset,
  MetricValue,
  OverviewResponse,
  SyncStatusResponse,
} from "@/types/analytics";

const KPI_METRICS = [
  "follower_count",
  "reach",
  "accounts_engaged",
  "profile_views",
  "total_interactions",
];

function formatFreshnessLabel(lastSyncedAt: Date | null): string {
  if (!lastSyncedAt) {
    return "Nunca sincronizado";
  }

  const diffMs = Date.now() - lastSyncedAt.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Atualizado agora";
  }
  if (diffMinutes < 60) {
    return `Atualizado há ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Atualizado há ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Atualizado há ${diffDays} dia(s)`;
}

export function buildSyncStatus(integration: {
  syncStatus: string;
  lastSyncedAt: Date | null;
  status: string;
}): SyncStatusResponse {
  return {
    syncStatus: integration.syncStatus,
    lastSyncedAt: integration.lastSyncedAt?.toISOString() ?? null,
    freshnessLabel: formatFreshnessLabel(integration.lastSyncedAt),
    integrationStatus: integration.status,
  };
}

async function sumMetricInRange(
  tenantId: string,
  integrationId: string,
  metricName: string,
  since: Date,
  until: Date,
): Promise<number | null> {
  const rows = await prisma.instagramMetricSnapshot.findMany({
    where: {
      tenantId,
      integrationId,
      scope: InstagramMetricScope.ACCOUNT,
      metricName,
      breakdownKey: "",
      metricDate: {
        gte: since,
        lte: until,
      },
    },
    orderBy: { metricDate: "desc" },
  });

  if (rows.length === 0) {
    return null;
  }

  if (metricName === "follower_count") {
    const latest = rows[0]?.value;
    return latest ? Number(latest) : null;
  }

  return rows.reduce((acc, row) => acc + Number(row.value ?? 0), 0);
}

async function buildKpis(
  tenantId: string,
  integrationId: string,
  period: AnalyticsPeriodPreset,
  compare: boolean,
  followersCountFallback: number | null,
): Promise<MetricValue[]> {
  const range = parseAnalyticsPeriod(period);
  const compareRange = compare ? getComparisonRange(range) : null;

  const kpis: MetricValue[] = [];

  for (const metricName of KPI_METRICS) {
    let current = await sumMetricInRange(
      tenantId,
      integrationId,
      metricName,
      range.since,
      range.until,
    );

    if (
      metricName === "follower_count" &&
      current === null &&
      followersCountFallback !== null
    ) {
      current = followersCountFallback;
    }

    let previous: number | null = null;
    if (compareRange) {
      previous = await sumMetricInRange(
        tenantId,
        integrationId,
        metricName,
        compareRange.since,
        compareRange.until,
      );
    }

    const trend = computeTrend(current, previous);

    kpis.push({
      name: metricName,
      label: getMetricLabel(metricName),
      status: current === null ? "unavailable" : "available",
      value: current,
      previousValue: previous,
      changePercent: trend.changePercent,
      trend: current === null ? null : trend.trend,
    });
  }

  return kpis;
}

async function fetchOverview(
  tenantId: string,
  period: AnalyticsPeriodPreset,
  compare: boolean,
): Promise<OverviewResponse | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  const publicIntegration = await getDashboardIntegration(tenantId);

  if (!integration || !publicIntegration) {
    return null;
  }

  const range = parseAnalyticsPeriod(period);
  const kpis = await buildKpis(
    tenantId,
    integration.id,
    period,
    compare,
    integration.followersCount,
  );

  return {
    period: {
      preset: period,
      since: formatDateIso(range.since),
      until: formatDateIso(range.until),
    },
    integration: {
      username: publicIntegration.username,
      profilePictureUrl: publicIntegration.profilePictureUrl,
      status: publicIntegration.status,
      displayName: publicIntegration.displayName,
    },
    kpis,
    sync: buildSyncStatus(integration),
  };
}

export async function getOverviewAnalytics(
  tenantId: string,
  period: AnalyticsPeriodPreset,
  compare = false,
): Promise<OverviewResponse | null> {
  const snapshotCount = await prisma.instagramMetricSnapshot.count({
    where: { tenantId },
  });

  if (snapshotCount === 0) {
    return fetchOverview(tenantId, period, compare);
  }

  return unstable_cache(
    async () => fetchOverview(tenantId, period, compare),
    [`overview`, tenantId, period, String(compare)],
    {
      tags: [`instagram-analytics-${tenantId}`],
      revalidate: 120,
    },
  )();
}

export async function getSyncStatusAnalytics(
  tenantId: string,
): Promise<SyncStatusResponse | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration) {
    return null;
  }

  return buildSyncStatus(integration);
}
