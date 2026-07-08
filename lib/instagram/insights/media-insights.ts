import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { getInstagramConfig } from "@/lib/instagram/config";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getMediaInsights } from "@/lib/instagram/graph-client";
import { getMediaMetricsForType } from "@/lib/instagram/insights/metrics/registry";
import { parseInsightsResponse } from "@/lib/instagram/insights/metrics/parser";
import { insertMetricSnapshots } from "@/lib/instagram/insights/snapshot-repository";
import { MetaApiError } from "@/types/instagram";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncMediaInsights(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  accessToken: string,
  stats?: GraphFetchStats,
): Promise<number> {
  const config = getInstagramConfig();
  const mediaItems = await prisma.instagramMedia.findMany({
    where: {
      integrationId,
      isRemoved: false,
    },
    orderBy: { publishedAt: "desc" },
  });

  let totalImported = 0;

  for (let index = 0; index < mediaItems.length; index += 1) {
    const media = mediaItems[index];
    if (!media) {
      continue;
    }

    const metrics = getMediaMetricsForType(media.mediaType);

    try {
      const response = await getMediaInsights(
        media.externalMediaId,
        accessToken,
        metrics,
        stats,
      );

      const rows = parseInsightsResponse(response, {
        scope: InstagramMetricScope.MEDIA,
        entityId: media.externalMediaId,
      });

      totalImported += await insertMetricSnapshots(
        tenantId,
        integrationId,
        syncJobId,
        rows,
      );

      await prisma.instagramMedia.update({
        where: { id: media.id },
        data: { lastInsightsSyncedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof MetaApiError && error.statusCode === 400) {
        continue;
      }
      throw error;
    }

    if ((index + 1) % config.syncBatchSize === 0) {
      await sleep(200);
    }
  }

  return totalImported;
}
