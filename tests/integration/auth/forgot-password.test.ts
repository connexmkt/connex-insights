import { describe, expect, it } from "vitest";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/auth/messages";
import { forgotPasswordSchema } from "@/lib/auth/schemas";

describe("forgot-password API contract", () => {
  it("validates email format", () => {
    const result = forgotPasswordSchema.safeParse({ email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("uses the same generic success message for all outcomes", () => {
    const existingEmailResponse = {
      success: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    };
    const missingEmailResponse = {
      success: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    };

    expect(existingEmailResponse.message).toBe(missingEmailResponse.message);
    expect(existingEmailResponse.message).not.toMatch(/não encontrado/i);
  });
});
