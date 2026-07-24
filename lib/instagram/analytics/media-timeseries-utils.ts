import { formatDateIso, formatDateLabel } from "@/lib/instagram/analytics/period";
import type { TimeseriesPoint } from "@/types/analytics";

export interface MediaPublishRecord {
  externalMediaId: string;
  publishedAt: Date;
}

export function sumMediaValuesByPublishDay(
  media: MediaPublishRecord[],
  latestValueByEntity: Map<string, number>,
): Map<string, number> {
  const totalsByDay = new Map<string, number>();

  for (const item of media) {
    const value = latestValueByEntity.get(item.externalMediaId);
    if (value === undefined) {
      continue;
    }

    const dayKey = formatDateIso(item.publishedAt);
    totalsByDay.set(dayKey, (totalsByDay.get(dayKey) ?? 0) + value);
  }

  return totalsByDay;
}

export function buildDailyPoints(
  since: Date,
  until: Date,
  totalsByDay: Map<string, number>,
): TimeseriesPoint[] {
  const points: TimeseriesPoint[] = [];
  const cursor = new Date(since);

  while (cursor.getTime() <= until.getTime()) {
    const dateIso = formatDateIso(cursor);
    points.push({
      date: dateIso,
      label: formatDateLabel(cursor),
      value: totalsByDay.get(dateIso) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return points;
}
