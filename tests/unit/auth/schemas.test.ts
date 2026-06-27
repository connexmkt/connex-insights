import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "marina@auroracosmeticos.com",
      password: "connex2026",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "marina@auroracosmeticos.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "connex2026",
    });

    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "marina@auroracosmeticos.com",
    });

    expect(result.success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts password with letters and numbers", () => {
    const result = resetPasswordSchema.safeParse({
      password: "novaSenha1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = resetPasswordSchema.safeParse({
      password: "abc1",
    });

    expect(result.success).toBe(false);
  });
});
