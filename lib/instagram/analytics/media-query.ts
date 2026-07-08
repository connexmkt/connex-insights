import { unstable_cache } from "next/cache";
import { InstagramMetricScope, Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { parseAnalyticsPeriod } from "@/lib/instagram/analytics/period";
import { getMetricLabel } from "@/lib/instagram/insights/metrics/registry";
import type {
  AnalyticsPeriodPreset,
  MediaAnalyticsItem,
  MediaListResponse,
  MetricValue,
} from "@/types/analytics";

const MEDIA_METRIC_NAMES = [
  "reach",
  "likes",
  "comments",
  "shares",
  "saved",
  "views",
  "total_interactions",
];

type MediaSortField =
  | "published_at"
  | "reach"
  | "engagement"
  | "likes"
  | "comments"
  | "shares"
  | "saved"
  | "views";

async function getLatestMediaMetric(
  tenantId: string,
  integrationId: string,
  externalMediaId: string,
  metricName: string,
): Promise<number | null> {
  const row = await prisma.instagramMetricSnapshot.findFirst({
    where: {
      tenantId,
      integrationId,
      scope: InstagramMetricScope.MEDIA,
      entityId: externalMediaId,
      metricName,
      breakdownKey: "",
    },
    orderBy: { collectedAt: "desc" },
  });

  return row?.value ? Number(row.value) : null;
}

function buildMetricValue(
  metricName: string,
  value: number | null,
): MetricValue {
  return {
    name: metricName,
    label: getMetricLabel(metricName),
    status: value === null ? "unavailable" : "available",
    value,
  };
}

async function fetchMediaList(
  tenantId: string,
  period: AnalyticsPeriodPreset,
  sort: MediaSortField,
  order: "asc" | "desc",
  page: number,
  pageSize: number,
): Promise<MediaListResponse | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration) {
    return null;
  }

  const range = parseAnalyticsPeriod(period);

  const where: Prisma.InstagramMediaWhereInput = {
    integrationId: integration.id,
    isRemoved: false,
    publishedAt: {
      gte: range.since,
      lte: range.until,
    },
  };

  const total = await prisma.instagramMedia.count({ where });
  const mediaItems = await prisma.instagramMedia.findMany({
    where,
    orderBy: sort === "published_at" ? { publishedAt: order } : { publishedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const items: MediaAnalyticsItem[] = [];

  for (const media of mediaItems) {
    const metrics: Record<string, MetricValue> = {};

    for (const metricName of MEDIA_METRIC_NAMES) {
      const value = await getLatestMediaMetric(
        tenantId,
        integration.id,
        media.externalMediaId,
        metricName,
      );
      metrics[metricName] = buildMetricValue(metricName, value);
    }

    const engagementValue =
      (metrics.likes?.value ?? 0) +
      (metrics.comments?.value ?? 0) +
      (metrics.shares?.value ?? 0) +
      (metrics.saved?.value ?? 0);

    metrics.engagement = buildMetricValue(
      "engagement",
      Number.isFinite(engagementValue) ? engagementValue : null,
    );

    items.push({
      id: media.id,
      externalMediaId: media.externalMediaId,
      mediaType: media.mediaType,
      caption: media.caption,
      thumbnailUrl: media.thumbnailUrl ?? media.mediaUrl,
      permalink: media.permalink,
      publishedAt: media.publishedAt?.toISOString() ?? null,
      metrics,
    });
  }

  if (sort !== "published_at") {
    const sortKey = sort === "engagement" ? "engagement" : sort;
    items.sort((left, right) => {
      const leftValue = left.metrics[sortKey]?.value ?? -1;
      const rightValue = right.metrics[sortKey]?.value ?? -1;
      return order === "asc" ? leftValue - rightValue : rightValue - leftValue;
    });
  }

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getMediaAnalytics(
  tenantId: string,
  period: AnalyticsPeriodPreset,
  sort: MediaSortField,
  order: "asc" | "desc",
  page: number,
  pageSize: number,
): Promise<MediaListResponse | null> {
  return unstable_cache(
    async () => fetchMediaList(tenantId, period, sort, order, page, pageSize),
    [`media`, tenantId, period, sort, order, String(page), String(pageSize)],
    {
      tags: [`instagram-analytics-${tenantId}`],
      revalidate: 120,
    },
  )();
}
