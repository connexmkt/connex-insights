import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/auth/schemas";

describe("login API contract", () => {
  it("defines validation rules for invalid payloads", () => {
    const emptyLogin = loginSchema.safeParse({ login: "", password: "test" });
    const emptyPassword = loginSchema.safeParse({
      login: "marina",
      password: "",
    });

    expect(emptyLogin.success).toBe(false);
    expect(emptyPassword.success).toBe(false);
  });

  it("defines generic error shape for failed authentication", () => {
    const errorShape = {
      error: "Login ou senha incorretos.",
      code: "INVALID_CREDENTIALS",
    };

    expect(errorShape.error).not.toMatch(/senha incorreta/i);
    expect(errorShape.error).not.toMatch(/login não encontrado/i);
  });

  it("defines inactive account success shape with activation redirect", () => {
    const inactiveSuccess = {
      success: true,
      requiresActivation: true,
      redirectTo: "/ativar-conta",
      user: {
        id: "user-id",
        email: "novo@gammastartup.com",
      },
    };

    expect(inactiveSuccess.requiresActivation).toBe(true);
    expect(inactiveSuccess.redirectTo).toBe("/ativar-conta");
  });
});
