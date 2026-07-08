import { unstable_cache } from "next/cache";
import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  formatDateLabel,
  formatDateIso,
  getComparisonRange,
  parseAnalyticsPeriod,
} from "@/lib/instagram/analytics/period";
import type {
  AnalyticsPeriodPreset,
  TimeseriesPoint,
  TimeseriesResponse,
} from "@/types/analytics";

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

  const rows = await prisma.instagramMetricSnapshot.findMany({
    where: {
      tenantId,
      integrationId: integration.id,
      scope: InstagramMetricScope.ACCOUNT,
      metricName: metric,
      breakdownKey: "",
      metricDate: {
        gte: range.since,
        lte: range.until,
      },
    },
    orderBy: { metricDate: "asc" },
  });

  const points: TimeseriesPoint[] = rows
    .filter((row) => row.metricDate !== null)
    .map((row) => ({
      date: formatDateIso(row.metricDate as Date),
      label: formatDateLabel(row.metricDate as Date),
      value: row.value ? Number(row.value) : null,
    }));

  let comparePoints: TimeseriesPoint[] | null = null;
  if (compare) {
    const compareRange = getComparisonRange(range);
    const compareRows = await prisma.instagramMetricSnapshot.findMany({
      where: {
        tenantId,
        integrationId: integration.id,
        scope: InstagramMetricScope.ACCOUNT,
        metricName: metric,
        breakdownKey: "",
        metricDate: {
          gte: compareRange.since,
          lte: compareRange.until,
        },
      },
      orderBy: { metricDate: "asc" },
    });

    comparePoints = compareRows
      .filter((row) => row.metricDate !== null)
      .map((row) => ({
        date: formatDateIso(row.metricDate as Date),
        label: formatDateLabel(row.metricDate as Date),
        value: row.value ? Number(row.value) : null,
      }));
  }

  return {
    metric,
    period,
    points,
    comparePoints,
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
