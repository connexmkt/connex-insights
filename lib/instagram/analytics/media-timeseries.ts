import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  buildDailyPoints,
  sumMediaValuesByPublishDay,
} from "@/lib/instagram/analytics/media-timeseries-utils";
import { toMediaMetricName } from "@/lib/instagram/insights/metrics/registry";
import type { TimeseriesPoint } from "@/types/analytics";

/**
 * Métricas de engajamento de conta (curtidas, comentários, compartilhamentos,
 * visualizações) só existem na API da Meta como `metric_type=total_value`:
 * um único número agregando todo o intervalo pedido, sem quebra diária
 * nativa (só `reach` suporta `time_series`). Como fallback, distribuímos o
 * valor mais recente de cada publicação pela data em que ela foi publicada —
 * isso aproxima uma série diária real a partir de dados já coletados por
 * post, em vez de um único ponto colapsado no dia da sincronização.
 *
 * Retorna [] quando não há dados de publicações suficientes no período, para
 * que o chamador possa cair de volta no snapshot de conta bruto.
 */
export async function buildMediaDerivedTimeseries(
  tenantId: string,
  integrationId: string,
  metricName: string,
  since: Date,
  until: Date,
): Promise<TimeseriesPoint[]> {
  const mediaMetricName = toMediaMetricName(metricName);

  const mediaItems = await prisma.instagramMedia.findMany({
    where: {
      tenantId,
      integrationId,
      isRemoved: false,
      publishedAt: { gte: since, lte: until },
    },
    select: { externalMediaId: true, publishedAt: true },
  });

  const publishedMedia = mediaItems.filter(
    (item): item is { externalMediaId: string; publishedAt: Date } =>
      item.publishedAt !== null,
  );

  if (publishedMedia.length === 0) {
    return [];
  }

  const mediaIds = publishedMedia.map((item) => item.externalMediaId);

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
    select: { entityId: true, value: true },
  });

  const latestValueByEntity = new Map<string, number>();
  for (const snapshot of snapshots) {
    if (latestValueByEntity.has(snapshot.entityId)) {
      continue;
    }
    if (snapshot.value === null) {
      continue;
    }
    latestValueByEntity.set(snapshot.entityId, Number(snapshot.value));
  }

  if (latestValueByEntity.size === 0) {
    return [];
  }

  const totalsByDay = sumMediaValuesByPublishDay(publishedMedia, latestValueByEntity);

  return buildDailyPoints(since, until, totalsByDay);
}
