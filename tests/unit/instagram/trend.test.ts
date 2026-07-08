import { describe, expect, it } from "vitest";
import { computeTrend } from "@/lib/instagram/analytics/trend";

describe("analytics trend", () => {
  it("returns up trend for positive change", () => {
    const result = computeTrend(120, 100);
    expect(result.trend).toBe("up");
    expect(result.changePercent).toBe(20);
  });

  it("returns down trend for negative change", () => {
    const result = computeTrend(80, 100);
    expect(result.trend).toBe("down");
    expect(result.changePercent).toBe(-20);
  });

  it("returns neutral when previous is zero", () => {
    const result = computeTrend(100, 0);
    expect(result.trend).toBe("neutral");
    expect(result.changePercent).toBeNull();
  });
});
