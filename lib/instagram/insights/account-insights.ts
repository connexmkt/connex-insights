import { InstagramMetricScope } from "@/lib/generated/prisma";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getAccountInsights } from "@/lib/instagram/graph-client";
import { getAccountMetricDefinitions } from "@/lib/instagram/insights/metrics/registry";
import { parseInsightsResponse } from "@/lib/instagram/insights/metrics/parser";
import { insertMetricSnapshots } from "@/lib/instagram/insights/snapshot-repository";
import { MetaApiError } from "@/types/instagram";

function getInsightsWindow(isInitial: boolean): { since: number; until: number } {
  const until = Math.floor(Date.now() / 1000);
  const days = isInitial ? 90 : 2;
  const since = until - days * 24 * 60 * 60;
  return { since, until };
}

export async function syncAccountInsights(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  professionalUserId: string,
  accessToken: string,
  isInitial: boolean,
  stats?: GraphFetchStats,
): Promise<number> {
  const { since, until } = getInsightsWindow(isInitial);
  const definitions = getAccountMetricDefinitions();
  let totalImported = 0;

  for (const definition of definitions) {
    try {
      const response = await getAccountInsights(
        professionalUserId,
        accessToken,
        {
          metric: definition.name,
          period: definition.period,
          since,
          until,
        },
        stats,
      );

      const rows = parseInsightsResponse(response, {
        scope: InstagramMetricScope.ACCOUNT,
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
