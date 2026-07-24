import { unstable_cache } from "next/cache";
import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { buildMediaDerivedTimeseries } from "@/lib/instagram/analytics/media-timeseries";
import {
  formatDateLabel,
  formatDateIso,
  getComparisonRange,
  parseAnalyticsPeriod,
} from "@/lib/instagram/analytics/period";
import { computeCoverage } from "@/lib/instagram/analytics/timeseries-coverage";
import { supportsMediaFallback } from "@/lib/instagram/insights/metrics/registry";
import type {
  AnalyticsPeriodPreset,
  TimeseriesPoint,
  TimeseriesResponse,
  TimeseriesSource,
} from "@/types/analytics";

async function fetchAccountPoints(
  tenantId: string,
  integrationId: string,
  metric: string,
  since: Date,
  until: Date,
): Promise<TimeseriesPoint[]> {
  const rows = await prisma.instagramMetricSnapshot.findMany({
    where: {
      tenantId,
      integrationId,
      scope: InstagramMetricScope.ACCOUNT,
      metricName: metric,
      breakdownKey: "",
      metricDate: {
        gte: since,
        lte: until,
      },
    },
    orderBy: { metricDate: "asc" },
  });

  return rows
    .filter((row) => row.metricDate !== null)
    .map((row) => ({
      date: formatDateIso(row.metricDate as Date),
      label: formatDateLabel(row.metricDate as Date),
      value: row.value ? Number(row.value) : null,
    }));
}

/**
 * Reach vem com série diária nativa da Meta. Métricas como curtidas,
 * comentários, compartilhamentos e visualizações só existem como total
 * agregado — nesses casos preferimos a série derivada por publicação
 * (ver `media-timeseries.ts`), que cobre o período dia a dia de verdade.
 */
async function resolvePoints(
  tenantId: string,
  integrationId: string,
  metric: string,
  since: Date,
  until: Date,
): Promise<{ points: TimeseriesPoint[]; source: TimeseriesSource }> {
  const accountPoints = await fetchAccountPoints(
    tenantId,
    integrationId,
    metric,
    since,
    until,
  );

  if (!supportsMediaFallback(metric)) {
    return { points: accountPoints, source: "account_insights" };
  }

  const mediaPoints = await buildMediaDerivedTimeseries(
    tenantId,
    integrationId,
    metric,
    since,
    until,
  );

  if (mediaPoints.length > 0) {
    return { points: mediaPoints, source: "media_aggregate" };
  }

  return { points: accountPoints, source: "account_insights" };
}

async function fetchTimeseries(
  tenantId: string,
  metric: string,
  period: AnalyticsPeriodPreset,
  compare: boolean,
): Promise<TimeseriesResponse | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration) {
    return null;
  }

  const range = parseAnalyticsPeriod(period);
  const { points, source } = await resolvePoints(
    tenantId,
    integration.id,
    metric,
    range.since,
    range.until,
  );

  let comparePoints: TimeseriesPoint[] | null = null;
  if (compare) {
    const compareRange = getComparisonRange(range);
    const compareResolved = await resolvePoints(
      tenantId,
      integration.id,
      metric,
      compareRange.since,
      compareRange.until,
    );
    comparePoints = compareResolved.points;
  }

  return {
    metric,
    period,
    points,
    comparePoints,
    source,
    coverage: computeCoverage(points, range),
  };
}

export async function getTimeseriesAnalytics(
  tenantId: string,
  metric: string,
  period: AnalyticsPeriodPreset,
  compare = false,
): Promise<TimeseriesResponse | null> {
  return unstable_cache(
    async () => fetchTimeseries(tenantId, metric, period, compare),
    [`timeseries`, tenantId, metric, period, String(compare)],
    {
      tags: [`instagram-analytics-${tenantId}`],
      revalidate: 120,
    },
  )();
}
