import { describe, expect, it } from "vitest";
import {
  activateAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      login: "marina",
      password: "connex2026",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      login: "marina",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty login", () => {
    const result = loginSchema.safeParse({
      login: "",
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

describe("activateAccountSchema", () => {
  it("accepts valid activation payload", () => {
    const result = activateAccountSchema.safeParse({
      temporaryPassword: "temp2026!",
      password: "novaSenha1",
      confirmPassword: "novaSenha1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty fields", () => {
    const result = activateAccountSchema.safeParse({
      temporaryPassword: "",
      password: "",
      confirmPassword: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = activateAccountSchema.safeParse({
      temporaryPassword: "temp2026!",
      password: "novaSenha1",
      confirmPassword: "outraSenha1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects new password equal to temporary password", () => {
    const result = activateAccountSchema.safeParse({
      temporaryPassword: "temp2026!",
      password: "temp2026!",
      confirmPassword: "temp2026!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects weak new password", () => {
    const result = activateAccountSchema.safeParse({
      temporaryPassword: "temp2026!",
      password: "abc",
      confirmPassword: "abc",
    });

    expect(result.success).toBe(false);
  });
});
