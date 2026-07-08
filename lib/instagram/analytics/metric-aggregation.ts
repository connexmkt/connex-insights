import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { sumLatestSnapshotValues } from "@/lib/instagram/analytics/metric-aggregation-utils";
import {
  getMetricAggregation,
  supportsMediaFallback,
  toMediaMetricName,
} from "@/lib/instagram/insights/metrics/registry";

export { sumLatestSnapshotValues } from "@/lib/instagram/analytics/metric-aggregation-utils";

async function aggregateAccountMetricInRange(
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

  const aggregation = getMetricAggregation(metricName);

  if (aggregation === "latest") {
    const latest = rows[0]?.value;
    return latest !== null && latest !== undefined ? Number(latest) : null;
  }

  return rows.reduce((acc, row) => acc + Number(row.value ?? 0), 0);
}

async function aggregateMediaMetricInRange(
  tenantId: string,
  integrationId: string,
  metricName: string,
  since: Date,
  until: Date,
): Promise<number | null> {
  const mediaMetricName = toMediaMetricName(metricName);

  const mediaItems = await prisma.instagramMedia.findMany({
    where: {
      tenantId,
      integrationId,
      isRemoved: false,
      publishedAt: {
        gte: since,
        lte: until,
      },
    },
    select: { externalMediaId: true },
  });

  if (mediaItems.length === 0) {
    return null;
  }

  const mediaIds = mediaItems.map((media) => media.externalMediaId);

  const snapshots = await prisma.instagramMetricSnapshot.findMany({
    where: {
      tenantId,
      integrationId,
      scope: InstagramMetricScope.MEDIA,
      metricName: mediaMetricName,
      breakdownKey: "",
      entityId: { in: mediaIds },
    },
    orderBy: { collectedAt: "desc" },
    select: {
      entityId: true,
      value: true,
    },
  });

  return sumLatestSnapshotValues(
    snapshots.map((snapshot) => ({
      entityId: snapshot.entityId,
      value: snapshot.value ? Number(snapshot.value) : null,
    })),
  );
}

export async function aggregateMetricInRange(
  tenantId: string,
  integrationId: string,
  metricName: string,
  since: Date,
  until: Date,
): Promise<number | null> {
  const accountValue = await aggregateAccountMetricInRange(
    tenantId,
    integrationId,
    metricName,
    since,
    until,
  );

  if (accountValue !== null) {
    return accountValue;
  }

  if (!supportsMediaFallback(metricName)) {
    return null;
  }

  return aggregateMediaMetricInRange(
    tenantId,
    integrationId,
    metricName,
    since,
    until,
  );
}
