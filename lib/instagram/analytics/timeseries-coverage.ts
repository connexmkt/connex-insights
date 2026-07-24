import type { DateRange, TimeseriesCoverage, TimeseriesPoint } from "@/types/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Abaixo desse percentual de dias com dado real, sinalizamos histórico parcial. */
const COVERAGE_THRESHOLD = 0.8;

export function computeCoverage(
  points: TimeseriesPoint[],
  range: DateRange,
): TimeseriesCoverage {
  const totalDays = Math.max(
    1,
    Math.round((range.until.getTime() - range.since.getTime()) / DAY_MS),
  );
  const availableDays = new Set(
    points.filter((point) => point.value !== null).map((point) => point.date),
  ).size;

  return {
    availableDays,
    totalDays,
    isPartial: availableDays < totalDays * COVERAGE_THRESHOLD,
  };
}
