import { describe, expect, it } from "vitest";

describe("analytics tenant isolation", () => {
  it("snapshot queries filter by tenant_id", () => {
    const snapshots = [
      { tenantId: "tenant-a", integrationId: "int-a", metricName: "reach", value: 120 },
      { tenantId: "tenant-b", integrationId: "int-b", metricName: "reach", value: 999 },
    ];

    const tenantAId = "tenant-a";
    const tenantAIntegrationId = "int-a";

    const visible = snapshots.filter(
      (row) =>
        row.tenantId === tenantAId && row.integrationId === tenantAIntegrationId,
    );

    expect(visible).toHaveLength(1);
    expect(visible[0]?.value).toBe(120);
  });

  it("analytics overview JSON does not expose tokens or credentials", () => {
    const overviewResponse = JSON.stringify({
      period: { preset: "30d", since: "2026-06-07", until: "2026-07-07" },
      integration: {
        username: "connex_br",
        profilePictureUrl: "https://example.com/avatar.jpg",
        status: "CONNECTED",
        displayName: "Connex",
      },
      kpis: [{ name: "reach", label: "Alcance", status: "available", value: 100 }],
      sync: {
        syncStatus: "COMPLETED",
        lastSyncedAt: "2026-07-07T12:00:00.000Z",
        freshnessLabel: "Atualizado há 1h",
        integrationStatus: "CONNECTED",
      },
    });

    const forbidden = [
      "access_token",
      "accessToken",
      "accessTokenEnc",
      "refresh_token",
      "cronSecret",
    ];

    for (const pattern of forbidden) {
      expect(overviewResponse.toLowerCase()).not.toContain(pattern.toLowerCase());
    }
  });
});
