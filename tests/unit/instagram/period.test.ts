import { describe, expect, it } from "vitest";
import {
  formatDateIso,
  getComparisonRange,
  parseAnalyticsPeriod,
} from "@/lib/instagram/analytics/period";

describe("analytics period", () => {
  it("parses 30d range", () => {
    const reference = new Date("2026-07-07T15:00:00.000Z");
    const range = parseAnalyticsPeriod("30d", reference);

    expect(range.preset).toBe("30d");
    expect(formatDateIso(range.until)).toBe("2026-07-07");
    expect(formatDateIso(range.since)).toBe("2026-06-07");
  });

  it("builds comparison range with same duration", () => {
    const range = parseAnalyticsPeriod("7d", new Date("2026-07-07T00:00:00.000Z"));
    const comparison = getComparisonRange(range);

    const durationMs = range.until.getTime() - range.since.getTime();
    const compareDurationMs =
      comparison.until.getTime() - comparison.since.getTime();

    expect(compareDurationMs).toBe(durationMs);
    expect(comparison.until.getTime()).toBeLessThan(range.since.getTime());
  });
});
