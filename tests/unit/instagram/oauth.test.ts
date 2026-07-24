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
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
        "instagram_business_content_publish",
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
    expect(url.searchParams.get("scope")).toBe(
      [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
        "instagram_business_content_publish",
        "instagram_business_manage_insights",
      ].join(","),
    );
  });

  it("sanitizes OAuth code with Meta fragment suffix", async () => {
    const { sanitizeOAuthCode } = await import("@/lib/instagram/oauth");
    expect(sanitizeOAuthCode("abc123#_")).toBe("abc123");
  });

  it("exchanges code for short-lived token with numeric user_id in data envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              access_token: "short-token",
              user_id: 12345,
              permissions: ["instagram_business_basic"],
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
    expect(result.permissions).toBe("instagram_business_basic");
  });

  it("exchanges code for short-lived token with legacy flat response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "short-token",
          user_id: 67890,
        }),
        { status: 200 },
      ),
    );

    const { exchangeCodeForShortLivedToken } = await import(
      "@/lib/instagram/oauth"
    );
    const result = await exchangeCodeForShortLivedToken("auth-code");

    expect(result.user_id).toBe("67890");
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

  it("exchanges short-lived token for long-lived token via GET (método documentado)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl.startsWith("https://graph.instagram.com/access_token?")).toBe(
      true,
    );
    const calledParams = new URL(calledUrl).searchParams;
    expect(calledParams.get("grant_type")).toBe("ig_exchange_token");
    expect(calledParams.get("access_token")).toBe("short-token");
  });

  it("recorre a POST quando o GET retorna erro de método não suportado", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: "Unsupported request - method type: get",
              type: "IGApiException",
              code: 100,
            },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "long-token-via-post",
            token_type: "bearer",
            expires_in: 5184000,
          }),
          { status: 200 },
        ),
      );

    const { exchangeLongLivedToken } = await import("@/lib/instagram/oauth");
    const result = await exchangeLongLivedToken("short-token");

    expect(result.access_token).toBe("long-token-via-post");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: expect.any(URLSearchParams),
      }),
    );
  });

  it("propaga erro do GET sem tentar POST quando não é erro de método não suportado", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error_message: "Error validating access token: Session has expired",
        }),
        { status: 400 },
      ),
    );

    const { exchangeLongLivedToken } = await import("@/lib/instagram/oauth");

    await expect(exchangeLongLivedToken("short-token")).rejects.toThrow(
      "Error validating access token: Session has expired",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes long-lived token via GET (método documentado)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "refreshed-token",
          token_type: "bearer",
          expires_in: 5183944,
        }),
        { status: 200 },
      ),
    );

    const { refreshLongLivedToken } = await import("@/lib/instagram/oauth");
    const result = await refreshLongLivedToken("long-token");

    expect(result.access_token).toBe("refreshed-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(
      calledUrl.startsWith("https://graph.instagram.com/refresh_access_token?"),
    ).toBe(true);
    const calledParams = new URL(calledUrl).searchParams;
    expect(calledParams.get("grant_type")).toBe("ig_refresh_token");
    expect(calledParams.get("access_token")).toBe("long-token");
  });
});
