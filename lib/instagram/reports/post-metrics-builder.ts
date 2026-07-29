import type { InstagramMedia, InstagramMetricSnapshot } from "@/lib/generated/prisma";
import type { PostPayload } from "@/lib/instagram/reports/report-types";

/**
 * Snapshot mínimo necessário para construir o PostPayload.
 */
export type SnapshotForReport = Pick<
  InstagramMetricSnapshot,
  "metricName" | "value" | "collectedAt"
>;

/**
 * Snapshot com entityId — usado ao filtrar por media em listas mistas.
 */
export type SnapshotForReportWithEntity = SnapshotForReport & {
  entityId: string;
};

/**
 * Subconjunto de InstagramMedia usado na construção do PostPayload.
 */
export type MediaForReport = Pick<
  InstagramMedia,
  | "externalMediaId"
  | "permalink"
  | "thumbnailUrl"
  | "mediaType"
  | "publishedAt"
>;

const PRIMARY_METRIC = "total_interactions";

/**
 * Converte um InstagramMedia + lista de snapshots (já deduplicados — um por
 * métrica) em um PostPayload pronto para envio ao CRM.
 *
 * `primaryMetricValue` vem de `total_interactions`; as demais métricas
 * ficam em `metrics`.
 */
export function buildPostPayload(
  media: MediaForReport,
  snapshots: SnapshotForReport[],
): PostPayload {
  const metricsMap: Record<string, number> = {};

  for (const snapshot of snapshots) {
    if (snapshot.value !== null) {
      metricsMap[snapshot.metricName] = Number(snapshot.value);
    }
  }

  const primaryMetricValue = metricsMap[PRIMARY_METRIC] ?? null;
  const otherMetrics = Object.fromEntries(
    Object.entries(metricsMap).filter(([key]) => key !== PRIMARY_METRIC),
  );

  return {
    instagramMediaId: media.externalMediaId,
    permalink: media.permalink ?? null,
    thumbnailUrl: media.thumbnailUrl ?? null,
    contentType: media.mediaType ?? null,
    publishedAt: media.publishedAt?.toISOString() ?? null,
    primaryMetricName: PRIMARY_METRIC,
    primaryMetricValue,
    metrics: Object.keys(otherMetrics).length > 0 ? otherMetrics : undefined,
  };
}

/**
 * Seleciona o snapshot mais recente de cada métrica para um dado
 * `externalMediaId` a partir de uma lista plana de snapshots de múltiplos media.
 */
export function pickLatestSnapshotsForMedia(
  externalMediaId: string,
  allSnapshots: SnapshotForReportWithEntity[],
): SnapshotForReport[] {
  const byMetric = new Map<string, SnapshotForReportWithEntity>();

  for (const snapshot of allSnapshots) {
    if (snapshot.entityId !== externalMediaId) {
      continue;
    }

    const existing = byMetric.get(snapshot.metricName);
    if (!existing || snapshot.collectedAt > existing.collectedAt) {
      byMetric.set(snapshot.metricName, snapshot);
    }
  }

  return Array.from(byMetric.values());
}

/**
 * Extrai o valor de `total_interactions` do conjunto de snapshots (mais recente),
 * retornando null se não disponível.
 */
export function getTotalInteractions(
  snapshots: SnapshotForReport[],
): number | null {
  const candidates = snapshots
    .filter((s) => s.metricName === PRIMARY_METRIC && s.value !== null)
    .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime());

  if (candidates.length === 0 || candidates[0]!.value === null) {
    return null;
  }

  return Number(candidates[0]!.value);
}
