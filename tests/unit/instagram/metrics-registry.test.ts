import { describe, expect, it } from "vitest";
import {
  getAccountMetricDefinitions,
  getMediaMetricsForType,
  getMetricLabel,
} from "@/lib/instagram/insights/metrics/registry";

describe("metrics registry", () => {
  it("returns account metrics with metric types", () => {
    const metrics = getAccountMetricDefinitions();
    expect(metrics.some((metric) => metric.name === "reach")).toBe(true);
    expect(
      metrics.find((metric) => metric.name === "accounts_engaged")?.metricType,
    ).toBe("total_value");
    expect(
      metrics.find((metric) => metric.name === "profile_links_taps")?.metricType,
    ).toBe("total_value");
    expect(metrics.some((metric) => metric.name === "profile_views")).toBe(
      false,
    );
  });

  it("returns media metrics by type", () => {
    const imageMetrics = getMediaMetricsForType("IMAGE");
    expect(imageMetrics).toContain("reach");

    const reelMetrics = getMediaMetricsForType("REELS");
    expect(reelMetrics).toContain("views");
  });

  it("returns localized labels", () => {
    expect(getMetricLabel("follower_count")).toBe("Seguidores");
    expect(getMetricLabel("profile_links_taps")).toBe("Toques no perfil");
  });
});
