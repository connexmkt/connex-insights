import { InstagramMetricScope } from "@/lib/generated/prisma";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getAudienceInsights } from "@/lib/instagram/graph-client";
import { getAudienceMetricDefinitions } from "@/lib/instagram/insights/metrics/registry";
import { parseInsightsResponse } from "@/lib/instagram/insights/metrics/parser";
import { insertMetricSnapshots } from "@/lib/instagram/insights/snapshot-repository";
import { MetaApiError } from "@/types/instagram";

export async function syncAudienceInsights(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  professionalUserId: string,
  accessToken: string,
  stats?: GraphFetchStats,
): Promise<number> {
  const definitions = getAudienceMetricDefinitions();
  let totalImported = 0;

  for (const definition of definitions) {
    try {
      const response = await getAudienceInsights(
        professionalUserId,
        accessToken,
        {
          metric: definition.name,
          breakdown: definition.breakdown,
        },
        stats,
      );

      const rows = parseInsightsResponse(response, {
        scope: InstagramMetricScope.AUDIENCE,
      });

      totalImported += await insertMetricSnapshots(
        tenantId,
        integrationId,
        syncJobId,
        rows,
      );
    } catch (error) {
      if (error instanceof MetaApiError && error.statusCode === 400) {
        continue;
      }
      throw error;
    }
  }

  return totalImported;
}
