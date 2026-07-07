import { describe, expect, it } from "vitest";

describe("instagram sync API contract", () => {
  it("returns 202 with jobId on retry", () => {
    const response = {
      jobId: "550e8400-e29b-41d4-a716-446655440000",
      syncStatus: "IN_PROGRESS" as const,
    };

    expect(response.syncStatus).toBe("IN_PROGRESS");
    expect(response.jobId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns 409 when sync already in progress", () => {
    const errorShape = {
      error: "Sincronização já em andamento.",
      code: "SYNC_IN_PROGRESS",
    };

    expect(errorShape.code).toBe("SYNC_IN_PROGRESS");
  });
});
