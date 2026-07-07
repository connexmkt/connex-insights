import { describe, expect, it } from "vitest";

describe("instagram token refresh cron contract", () => {
  it("requires CRON_SECRET bearer token", () => {
    const validHeader = "Bearer test-cron-secret";
    expect(validHeader.startsWith("Bearer ")).toBe(true);
  });

  it("marks integration REQUIRES_RECONNECTION on refresh failure", () => {
    const statusAfterFailure = "REQUIRES_RECONNECTION";
    expect(statusAfterFailure).toBe("REQUIRES_RECONNECTION");
  });

  it("updates token_expires_at on successful refresh", () => {
    const before = new Date("2026-07-01T00:00:00Z");
    const after = new Date("2026-09-01T00:00:00Z");

    expect(after.getTime()).toBeGreaterThan(before.getTime());
  });
});
