import { describe, expect, it } from "vitest";
import {
  getAccountMetricDefinitions,
  getMediaMetricsForType,
  getMetricLabel,
} from "@/lib/instagram/insights/metrics/registry";

describe("metrics registry", () => {
  it("returns account metrics", () => {
    const metrics = getAccountMetricDefinitions();
    expect(metrics.some((metric) => metric.name === "reach")).toBe(true);
  });

  it("returns media metrics by type", () => {
    const imageMetrics = getMediaMetricsForType("IMAGE");
    expect(imageMetrics).toContain("reach");

    const reelMetrics = getMediaMetricsForType("REELS");
    expect(reelMetrics).toContain("views");
  });

  it("returns localized labels", () => {
    expect(getMetricLabel("follower_count")).toBe("Seguidores");
  });
});
