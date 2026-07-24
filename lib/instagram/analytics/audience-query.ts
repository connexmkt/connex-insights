import { unstable_cache } from "next/cache";
import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import type {
  AnalyticsPeriodPreset,
  AudienceResponse,
  AudienceSegment,
} from "@/types/analytics";

function parseBreakdownKey(breakdownKey: string): {
  dimension: string;
  value: string;
} {
  const [dimension, value] = breakdownKey.split(":");
  return {
    dimension: dimension ?? "unknown",
    value: value ?? breakdownKey,
  };
}

async function fetchAudience(tenantId: string): Promise<AudienceResponse | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration) {
    return null;
  }

  const rows = await prisma.instagramMetricSnapshot.findMany({
    where: {
      tenantId,
      integrationId: integration.id,
      scope: InstagramMetricScope.AUDIENCE,
    },
    orderBy: { collectedAt: "desc" },
    take: 500,
  });

  if (rows.length === 0) {
    return {
      available: false,
      demographics: {},
      onlineFollowers: null,
    };
  }

  const demographics: Record<string, AudienceSegment[]> = {};
  const onlineFollowers: AudienceSegment[] = [];
  let totalDemographics = 0;

  for (const row of rows) {
    if (!row.breakdownKey) {
      continue;
    }

    const { dimension, value } = parseBreakdownKey(row.breakdownKey);
    const count = row.value ? Number(row.value) : null;

    if (row.metricName === "online_followers") {
      onlineFollowers.push({
        dimension: "hour",
        value,
        count,
        percentage: null,
      });
      continue;
    }

    if (!demographics[dimension]) {
      demographics[dimension] = [];
    }

    demographics[dimension].push({
      dimension,
      value,
      count,
      percentage: null,
    });

    if (count) {
      totalDemographics += count;
    }
  }

  for (const segments of Object.values(demographics)) {
    for (const segment of segments) {
      if (segment.count !== null && totalDemographics > 0) {
        segment.percentage =
          Math.round((segment.count / totalDemographics) * 1000) / 10;
      }
    }
  }

  return {
    available: Object.keys(demographics).length > 0 || onlineFollowers.length > 0,
    demographics,
    onlineFollowers: onlineFollowers.length > 0 ? onlineFollowers : null,
  };
}

export async function getAudienceAnalytics(
  tenantId: string,
  period: AnalyticsPeriodPreset,
): Promise<AudienceResponse | null> {
  return unstable_cache(
    async () => fetchAudience(tenantId),
    [`audience`, tenantId, period],
    {
      tags: [`instagram-analytics-${tenantId}`],
      revalidate: 120,
    },
  )();
}
