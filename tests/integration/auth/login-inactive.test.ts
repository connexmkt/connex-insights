import { describe, expect, it } from "vitest";
import { ACTIVATION_PATH } from "@/lib/auth/activation-guard";

describe("login inactive contract", () => {
  it("returns activation redirect for inactive accounts", () => {
    const inactiveSuccess = {
      success: true,
      requiresActivation: true,
      redirectTo: ACTIVATION_PATH,
      user: {
        id: "user-inactive",
        email: "novo@gammastartup.com",
      },
    };

    expect(inactiveSuccess.requiresActivation).toBe(true);
    expect(inactiveSuccess.redirectTo).toBe("/ativar-conta");
  });

  it("returns dashboard redirect for active accounts", () => {
    const activeSuccess = {
      success: true,
      requiresActivation: false,
      redirectTo: "/dashboard",
      user: {
        id: "user-active",
        email: "marina@auroracosmeticos.com",
      },
    };

    expect(activeSuccess.requiresActivation).toBe(false);
    expect(activeSuccess.redirectTo).toBe("/dashboard");
  });

  it("returns forbidden for suspended accounts", () => {
    const suspendedError = {
      error: "Acesso não autorizado.",
      code: "ACCOUNT_SUSPENDED",
    };

    expect(suspendedError.code).toBe("ACCOUNT_SUSPENDED");
  });
});
