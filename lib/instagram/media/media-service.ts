import { prisma } from "@/lib/db/prisma";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getInstagramMediaPage } from "@/lib/instagram/graph-client";
import type { InstagramGraphMediaItem } from "@/types/instagram";

export interface MediaSyncResult {
  importedCount: number;
  nextCursor: string | null;
}

async function upsertMediaItem(
  tenantId: string,
  integrationId: string,
  item: InstagramGraphMediaItem,
): Promise<void> {
  await prisma.instagramMedia.upsert({
    where: {
      integrationId_externalMediaId: {
        integrationId,
        externalMediaId: item.id,
      },
    },
    create: {
      tenantId,
      integrationId,
      externalMediaId: item.id,
      mediaType: item.media_type,
      caption: item.caption ?? null,
      permalink: item.permalink ?? null,
      mediaUrl: item.media_url ?? null,
      thumbnailUrl: item.thumbnail_url ?? null,
      publishedAt: item.timestamp ? new Date(item.timestamp) : null,
      isRemoved: false,
      removedAt: null,
    },
    update: {
      mediaType: item.media_type,
      caption: item.caption ?? null,
      permalink: item.permalink ?? null,
      mediaUrl: item.media_url ?? null,
      thumbnailUrl: item.thumbnail_url ?? null,
      publishedAt: item.timestamp ? new Date(item.timestamp) : null,
      isRemoved: false,
      removedAt: null,
    },
  });
}

export async function syncAllMedia(
  integrationId: string,
  tenantId: string,
  professionalUserId: string,
  accessToken: string,
  stats?: GraphFetchStats,
  startCursor?: string | null,
): Promise<MediaSyncResult> {
  let importedCount = 0;
  let cursor = startCursor ?? null;
  let hasMore = true;

  while (hasMore) {
    const page = await getInstagramMediaPage(
      professionalUserId,
      accessToken,
      cursor,
      stats,
    );

    for (const item of page.data) {
      await upsertMediaItem(tenantId, integrationId, item);
      importedCount += 1;
    }

    const nextCursor = page.paging?.cursors?.after ?? null;
    if (page.paging?.next && nextCursor) {
      cursor = nextCursor;
    } else {
      hasMore = false;
      cursor = null;
    }
  }

  await prisma.instagramIntegration.update({
    where: { id: integrationId },
    data: {
      mediaSyncCursor: cursor,
      lastFullMediaSyncAt: new Date(),
    },
  });

  return { importedCount, nextCursor: cursor };
}

export async function syncIncrementalMedia(
  integrationId: string,
  tenantId: string,
  professionalUserId: string,
  accessToken: string,
  stats?: GraphFetchStats,
): Promise<MediaSyncResult> {
  let importedCount = 0;
  let cursor: string | null = null;
  let stop = false;

  while (!stop) {
    const page = await getInstagramMediaPage(
      professionalUserId,
      accessToken,
      cursor,
      stats,
    );

    for (const item of page.data) {
      const existing = await prisma.instagramMedia.findUnique({
        where: {
          integrationId_externalMediaId: {
            integrationId,
            externalMediaId: item.id,
          },
        },
      });

      if (existing && cursor !== null) {
        stop = true;
        break;
      }

      await upsertMediaItem(tenantId, integrationId, item);
      importedCount += 1;
    }

    if (stop) {
      break;
    }

    const nextCursor = page.paging?.cursors?.after ?? null;
    if (page.paging?.next && nextCursor) {
      cursor = nextCursor;
    } else {
      break;
    }
  }

  return { importedCount, nextCursor: cursor };
}
