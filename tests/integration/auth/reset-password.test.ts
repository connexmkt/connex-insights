import { describe, expect, it } from "vitest";
import { INVALID_RESET_LINK_MESSAGE } from "@/lib/auth/messages";
import { resetPasswordSchema } from "@/lib/auth/schemas";

describe("reset-password API contract", () => {
  it("rejects weak passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "abc" });
    expect(result.success).toBe(false);
  });

  it("accepts valid passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "novaSenha1" });
    expect(result.success).toBe(true);
  });

  it("defines invalid link error message", () => {
    expect(INVALID_RESET_LINK_MESSAGE).toContain("inválido");
    expect(INVALID_RESET_LINK_MESSAGE).toContain("expirou");
  });
});
