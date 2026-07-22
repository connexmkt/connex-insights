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
      syncBatchSize: 25,
      syncMaxRetries: 3,
      metricRetentionDays: 90,
    }),
  };
});

describe("graph-client", () => {
  beforeEach(() => {
    resetInstagramConfigCache();
    vi.restoreAllMocks();
  });

  it("fetches Instagram profile from Graph API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user_id: "178414000",
          username: "connex_br",
          name: "Connex",
          account_type: "Business",
          followers_count: 1200,
        }),
        { status: 200 },
      ),
    );

    const { getInstagramProfile } = await import(
      "@/lib/instagram/graph-client"
    );
    const profile = await getInstagramProfile("access-token");

    expect(profile.username).toBe("connex_br");
    expect(profile.account_type).toBe("Business");
  });

  it("fetches Instagram media from Graph API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "media-1",
              media_type: "IMAGE",
              caption: "Post teste",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { getInstagramMedia } = await import("@/lib/instagram/graph-client");
    const media = await getInstagramMedia("178414000", "access-token");

    expect(media.data).toHaveLength(1);
    expect(media.data[0]?.id).toBe("media-1");
  });

  it("throws MetaApiError on auth failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Invalid token", code: 190 },
        }),
        { status: 401 },
      ),
    );

    const { getInstagramProfile, MetaApiError, isMetaAuthError } =
      await import("@/lib/instagram/graph-client");

    await expect(getInstagramProfile("bad-token")).rejects.toBeInstanceOf(
      MetaApiError,
    );

    expect(isMetaAuthError(401)).toBe(true);
  });
});
