import type { AnalyticsPeriodPreset, DateRange } from "@/types/analytics";

const PRESET_DAYS: Record<AnalyticsPeriodPreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "6m": 180,
  "12m": 365,
};

export function parseAnalyticsPeriod(
  preset: AnalyticsPeriodPreset,
  referenceDate: Date = new Date(),
): DateRange {
  const until = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - PRESET_DAYS[preset]);

  return { preset, since, until };
}

export function getComparisonRange(range: DateRange): DateRange {
  const durationMs = range.until.getTime() - range.since.getTime();
  const until = new Date(range.since.getTime() - 24 * 60 * 60 * 1000);
  const since = new Date(until.getTime() - durationMs);

  return {
    preset: range.preset,
    since,
    until,
  };
}

export function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatDateIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
