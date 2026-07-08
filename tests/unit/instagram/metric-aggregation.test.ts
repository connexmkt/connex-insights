import { describe, expect, it } from "vitest";
import { sumLatestSnapshotValues } from "@/lib/instagram/analytics/metric-aggregation-utils";
import {
  supportsMediaFallback,
  toMediaMetricName,
} from "@/lib/instagram/insights/metrics/registry";

describe("metric aggregation helpers", () => {
  it("sums latest snapshot per entity", () => {
    const total = sumLatestSnapshotValues([
      { entityId: "media-1", value: 24 },
      { entityId: "media-1", value: 99 },
      { entityId: "media-2", value: 51 },
      { entityId: "media-3", value: null },
    ]);

    expect(total).toBe(75);
  });

  it("returns null when no values exist", () => {
    expect(
      sumLatestSnapshotValues([{ entityId: "media-1", value: null }]),
    ).toBeNull();
  });

  it("maps saves to saved for media snapshots", () => {
    expect(toMediaMetricName("saves")).toBe("saved");
    expect(toMediaMetricName("likes")).toBe("likes");
  });

  it("enables media fallback for interaction metrics", () => {
    expect(supportsMediaFallback("likes")).toBe(true);
    expect(supportsMediaFallback("accounts_engaged")).toBe(false);
  });
});
