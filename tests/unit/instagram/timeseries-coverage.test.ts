import { describe, expect, it } from "vitest";
import { computeCoverage } from "@/lib/instagram/analytics/timeseries-coverage";
import type { TimeseriesPoint } from "@/types/analytics";

function point(date: string, value: number | null): TimeseriesPoint {
  return { date, label: date, value };
}

describe("computeCoverage", () => {
  it("marks as partial when only a few days have real data in a 30d window", () => {
    const range = {
      preset: "30d" as const,
      since: new Date("2026-06-24T00:00:00Z"),
      until: new Date("2026-07-24T00:00:00Z"),
    };

    const coverage = computeCoverage(
      [point("2026-07-09", 300), point("2026-07-22", 340), point("2026-07-24", 388)],
      range,
    );

    expect(coverage.totalDays).toBe(30);
    expect(coverage.availableDays).toBe(3);
    expect(coverage.isPartial).toBe(true);
  });

  it("is not partial when nearly every day in the window has data", () => {
    const range = {
      preset: "7d" as const,
      since: new Date("2026-07-17T00:00:00Z"),
      until: new Date("2026-07-24T00:00:00Z"),
    };

    const dates = [
      "2026-07-18",
      "2026-07-19",
      "2026-07-20",
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ];
    const points: TimeseriesPoint[] = dates.map((date, i) => point(date, 100 + i));

    const coverage = computeCoverage(points, range);

    expect(coverage.isPartial).toBe(false);
  });

  it("ignores null values when counting available days", () => {
    const range = {
      preset: "7d" as const,
      since: new Date("2026-07-17T00:00:00Z"),
      until: new Date("2026-07-24T00:00:00Z"),
    };

    const coverage = computeCoverage(
      [point("2026-07-18", null), point("2026-07-19", 50)],
      range,
    );

    expect(coverage.availableDays).toBe(1);
  });
});
