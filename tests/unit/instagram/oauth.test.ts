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
      oauthScopes: [
        "instagram_business_basic",
        "instagram_business_manage_insights",
      ],
      tokenEncryptionKey: Buffer.alloc(32, 2).toString("base64"),
      oauthStateSecret: "test-state-secret",
      cronSecret: "test-cron-secret",
      appUrl: "http://localhost:3000",
    }),
  };
});

describe("oauth", () => {
  beforeEach(() => {
    resetInstagramConfigCache();
    vi.restoreAllMocks();
  });

  it("builds authorization URL with required params", async () => {
    const { buildAuthorizationUrl } = await import("@/lib/instagram/oauth");
    const url = new URL(buildAuthorizationUrl("signed-state"));

    expect(url.origin).toBe("https://www.instagram.com");
    expect(url.pathname).toBe("/oauth/authorize");
    expect(url.searchParams.get("force_reauth")).toBe("true");
    expect(url.searchParams.get("client_id")).toBe("test-app-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/instagram/callback",
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("signed-state");
    expect(url.searchParams.get("scope")).toContain("instagram_business_basic");
  });

  it("sanitizes OAuth code with Meta fragment suffix", async () => {
    const { sanitizeOAuthCode } = await import("@/lib/instagram/oauth");
    expect(sanitizeOAuthCode("abc123#_")).toBe("abc123");
  });

  it("exchanges code for short-lived token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              access_token: "short-token",
              user_id: "12345",
              permissions: "instagram_business_basic",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { exchangeCodeForShortLivedToken } = await import(
      "@/lib/instagram/oauth"
    );
    const result = await exchangeCodeForShortLivedToken("auth-code");

    expect(result.access_token).toBe("short-token");
    expect(result.user_id).toBe("12345");
  });

  it("exchanges short-lived token for long-lived token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "long-token",
          token_type: "bearer",
          expires_in: 5184000,
        }),
        { status: 200 },
      ),
    );

    const { exchangeLongLivedToken } = await import("@/lib/instagram/oauth");
    const result = await exchangeLongLivedToken("short-token");

    expect(result.access_token).toBe("long-token");
    expect(result.expires_in).toBe(5184000);
  });
});
