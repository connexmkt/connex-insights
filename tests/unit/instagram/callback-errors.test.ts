import { describe, expect, it } from "vitest";
import { Prisma } from "@/lib/generated/prisma";
import { mapCallbackError } from "@/lib/instagram/callback-errors";
import { InstagramServiceError, MetaApiError } from "@/types/instagram";

describe("mapCallbackError", () => {
  it("maps token exchange MetaApiError 400", () => {
    const mapped = mapCallbackError(
      "token_exchange",
      new MetaApiError("Matching code was not found", 400),
    );

    expect(mapped.result).toBe("token_exchange_failed");
    expect(mapped.detail).toContain("INSTAGRAM_APP_SECRET");
  });

  it("maps long-lived token failure", () => {
    const mapped = mapCallbackError(
      "long_lived_token",
      new MetaApiError("Invalid token", 400),
    );

    expect(mapped.result).toBe("long_lived_token_failed");
  });

  it("maps unsupported account type", () => {
    const mapped = mapCallbackError(
      "persist",
      new InstagramServiceError(
        "Conta não suportada",
        "UNSUPPORTED_ACCOUNT_TYPE",
      ),
    );

    expect(mapped.result).toBe("unsupported_account");
  });

  it("maps Prisma database errors", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Table not found",
      { code: "P2021", clientVersion: "7.8.0" },
    );

    const mapped = mapCallbackError("persist", prismaError);

    expect(mapped.result).toBe("database_error");
    expect(mapped.detail).toContain("P2021");
  });

  it("maps encryption key errors", () => {
    const mapped = mapCallbackError(
      "persist",
      new Error(
        "INSTAGRAM_TOKEN_ENCRYPTION_KEY deve conter exatamente 32 bytes em base64.",
      ),
    );

    expect(mapped.result).toBe("encryption_error");
  });

  it("sanitizes access tokens from error details", () => {
    const mapped = mapCallbackError(
      "token_exchange",
      new MetaApiError("Token EAACEdEose0cBAD invalid", 400),
    );

    expect(mapped.detail).not.toContain("EAACEdEose0cBAD");
    expect(mapped.detail).toContain("[token]");
  });
});
