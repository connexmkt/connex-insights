import type { TrendDirection } from "@/types/analytics";

export interface TrendResult {
  changePercent: number | null;
  trend: TrendDirection;
}

export function computeTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
): TrendResult {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    previous === 0
  ) {
    return { changePercent: null, trend: "neutral" };
  }

  const changePercent = ((current - previous) / previous) * 100;
  const rounded = Math.round(changePercent * 10) / 10;

  if (rounded > 0) {
    return { changePercent: rounded, trend: "up" };
  }
  if (rounded < 0) {
    return { changePercent: rounded, trend: "down" };
  }
  return { changePercent: 0, trend: "neutral" };
}
