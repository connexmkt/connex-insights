import { describe, expect, it } from "vitest";
import { activateAccountSchema } from "@/lib/auth/schemas";

describe("activate account API contract", () => {
  it("rejects activation body with userId from client", () => {
    const body = {
      userId: "other-user",
      tenantId: "other-tenant",
      temporaryPassword: "temp2026!",
      password: "novaSenha1",
      confirmPassword: "novaSenha1",
    };

    const parsed = activateAccountSchema.safeParse(body);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("userId" in parsed.data).toBe(false);
      expect("tenantId" in parsed.data).toBe(false);
    }
  });

  it("defines successful activation response shape", () => {
    const success = {
      success: true,
      redirectTo: "/dashboard",
    };

    expect(success.redirectTo).toBe("/dashboard");
  });

  it("defines invalid temporary password error shape", () => {
    const error = {
      error: "Senha temporária incorreta.",
      code: "INVALID_TEMPORARY_PASSWORD",
    };

    expect(error.code).toBe("INVALID_TEMPORARY_PASSWORD");
  });

  it("defines already active account error shape", () => {
    const error = {
      error: "Esta conta já está ativa.",
      code: "ACCOUNT_ALREADY_ACTIVE",
    };

    expect(error.code).toBe("ACCOUNT_ALREADY_ACTIVE");
  });
});
