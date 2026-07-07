import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetInstagramConfigCache } from "@/lib/instagram/config";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

vi.mock("@/lib/instagram/config", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/instagram/config")>();
  return {
    ...original,
    getInstagramConfig: () => ({
      appId: "test-app-id",
      appSecret: "test-secret",
      redirectUri: "http://localhost:3000/api/auth/instagram/callback",
      oauthScopes: ["instagram_business_basic"],
      tokenEncryptionKey: TEST_KEY,
      oauthStateSecret: "test-state-secret",
      cronSecret: "test-cron-secret",
      appUrl: "http://localhost:3000",
    }),
  };
});

describe("token-crypto", () => {
  beforeEach(() => {
    resetInstagramConfigCache();
  });

  it("encrypts and decrypts token round-trip", async () => {
    const { encryptToken, decryptToken } = await import(
      "@/lib/instagram/token-crypto"
    );
    const plaintext = "IGQWRPaW9n-test-access-token";

    const encrypted = encryptToken(plaintext);
    const decrypted = decryptToken(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);
  });

  it("rejects invalid ciphertext format", async () => {
    const { decryptToken } = await import("@/lib/instagram/token-crypto");

    expect(() => decryptToken("invalid-format")).toThrow(
      "Formato de token criptografado inválido.",
    );
  });
});
