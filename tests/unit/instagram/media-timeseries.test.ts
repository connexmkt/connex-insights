import { describe, expect, it } from "vitest";
import {
  buildDailyPoints,
  sumMediaValuesByPublishDay,
} from "@/lib/instagram/analytics/media-timeseries-utils";

describe("sumMediaValuesByPublishDay", () => {
  it("sums the latest value of each post grouped by publish date", () => {
    const totals = sumMediaValuesByPublishDay(
      [
        { externalMediaId: "p1", publishedAt: new Date("2026-07-10T12:00:00Z") },
        { externalMediaId: "p2", publishedAt: new Date("2026-07-10T18:00:00Z") },
        { externalMediaId: "p3", publishedAt: new Date("2026-07-12T09:00:00Z") },
      ],
      new Map([
        ["p1", 100],
        ["p2", 40],
        ["p3", 20],
      ]),
    );

    expect(totals.get("2026-07-10")).toBe(140);
    expect(totals.get("2026-07-12")).toBe(20);
    expect(totals.size).toBe(2);
  });

  it("ignores posts without a known metric value", () => {
    const totals = sumMediaValuesByPublishDay(
      [{ externalMediaId: "p1", publishedAt: new Date("2026-07-10T00:00:00Z") }],
      new Map(),
    );

    expect(totals.size).toBe(0);
  });
});

describe("buildDailyPoints", () => {
  it("fills every day in the range, defaulting to 0 when there is no post that day", () => {
    const points = buildDailyPoints(
      new Date("2026-07-10T00:00:00Z"),
      new Date("2026-07-13T00:00:00Z"),
      new Map([
        ["2026-07-10", 140],
        ["2026-07-12", 20],
      ]),
    );

    expect(points.map((p) => p.date)).toEqual([
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
    ]);
    expect(points.map((p) => p.value)).toEqual([140, 0, 20, 0]);
  });
});
