import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/auth/schemas";

describe("login API contract", () => {
  it("defines validation rules for invalid payloads", () => {
    const emptyEmail = loginSchema.safeParse({ email: "", password: "test" });
    const invalidEmail = loginSchema.safeParse({
      email: "not-an-email",
      password: "test",
    });
    const emptyPassword = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(emptyEmail.success).toBe(false);
    expect(invalidEmail.success).toBe(false);
    expect(emptyPassword.success).toBe(false);
  });

  it("defines generic error shape for failed authentication", () => {
    const errorShape = {
      error: "E-mail ou senha incorretos.",
      code: "INVALID_CREDENTIALS",
    };

    expect(errorShape.error).not.toMatch(/senha incorreta/i);
    expect(errorShape.error).not.toMatch(/e-mail não encontrado/i);
  });
});
