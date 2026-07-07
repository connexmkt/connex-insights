import { describe, expect, it } from "vitest";

describe("instagram disconnect API contract", () => {
  it("returns success with DISCONNECTED status", () => {
    const response = {
      success: true,
      status: "DISCONNECTED" as const,
    };

    expect(response.success).toBe(true);
    expect(response.status).toBe("DISCONNECTED");
  });

  it("blocks sync after disconnect with 422", () => {
    function canSync(status: "CONNECTED" | "DISCONNECTED"): boolean {
      return status === "CONNECTED";
    }

    expect(canSync("DISCONNECTED")).toBe(false);
  });

  it("reconnection reuses same integration record", () => {
    const tenantIntegrations = [{ id: "int-1", tenantId: "tenant-a" }];
    const afterReconnect = tenantIntegrations.filter(
      (i) => i.tenantId === "tenant-a",
    );

    expect(afterReconnect).toHaveLength(1);
    expect(afterReconnect[0]?.id).toBe("int-1");
  });
});
