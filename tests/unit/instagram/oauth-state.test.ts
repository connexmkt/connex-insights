import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetInstagramConfigCache } from "@/lib/instagram/config";

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
      tokenEncryptionKey: Buffer.alloc(32, 1).toString("base64"),
      oauthStateSecret: "test-state-secret",
      cronSecret: "test-cron-secret",
      appUrl: "http://localhost:3000",
    }),
  };
});

describe("oauth-state", () => {
  beforeEach(() => {
    resetInstagramConfigCache();
  });

  it("creates and verifies valid OAuth state", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "@/lib/instagram/oauth-state"
    );

    const { state, nonce } = createOAuthState("tenant-1", "user-1");
    const payload = verifyOAuthState(state, nonce);

    expect(payload.tenantId).toBe("tenant-1");
    expect(payload.userId).toBe("user-1");
    expect(payload.nonce).toBe(nonce);
  });

  it("rejects state with mismatched cookie nonce", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "@/lib/instagram/oauth-state"
    );

    const { state } = createOAuthState("tenant-1", "user-1");

    expect(() => verifyOAuthState(state, "wrong-nonce")).toThrow(
      "Nonce OAuth não corresponde ao cookie.",
    );
  });

  it("rejects tampered state signature", async () => {
    const { createOAuthState, verifyOAuthState } = await import(
      "@/lib/instagram/oauth-state"
    );

    const { state, nonce } = createOAuthState("tenant-1", "user-1");
    const tampered = `${state}x`;

    expect(() => verifyOAuthState(tampered, nonce)).toThrow();
  });
});
