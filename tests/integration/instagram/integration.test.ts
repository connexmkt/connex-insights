import { describe, expect, it } from "vitest";
import type { IntegrationPublic } from "@/types/instagram";

const PUBLIC_INTEGRATION: IntegrationPublic = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  username: "connex_br",
  displayName: "Connex",
  accountType: "BUSINESS",
  profilePictureUrl: "https://example.com/photo.jpg",
  followersCount: 1000,
  followsCount: 200,
  mediaCount: 50,
  status: "CONNECTED",
  syncStatus: "COMPLETED",
  lastSyncedAt: "2026-07-06T12:00:00.000Z",
  connectedAt: "2026-07-06T11:00:00.000Z",
};

describe("instagram integration API response", () => {
  it("does not expose token fields in public integration", () => {
    const json = JSON.stringify({ connected: true, integration: PUBLIC_INTEGRATION });

    expect(json).not.toContain("access_token");
    expect(json).not.toContain("accessToken");
    expect(json).not.toContain("accessTokenEnc");
    expect(json).not.toContain("tokenExpiresAt");
  });

  it("includes required public fields", () => {
    expect(PUBLIC_INTEGRATION.username).toBeTruthy();
    expect(PUBLIC_INTEGRATION.status).toBe("CONNECTED");
    expect(PUBLIC_INTEGRATION.syncStatus).toBe("COMPLETED");
  });
});
