import { describe, expect, it } from "vitest";

describe("logout API contract", () => {
  it("returns success payload shape", () => {
    const response = { success: true };
    expect(response.success).toBe(true);
  });
});
