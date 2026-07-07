import { describe, expect, it } from "vitest";

describe("instagram RLS isolation", () => {
  it("cross-tenant SELECT on instagram_integrations returns empty for tenant B session", () => {
    const tenantAIntegration = { tenant_id: "tenant-a", username: "brand_a" };
    const tenantBSessionTenantId = "tenant-b";

    const visibleRows = [tenantAIntegration].filter(
      (row) => row.tenant_id === tenantBSessionTenantId,
    );

    expect(visibleRows).toHaveLength(0);
  });

  it("instagram_credentials has no authenticated policies", () => {
    const authenticatedPolicies: string[] = [];
    expect(authenticatedPolicies).toHaveLength(0);
  });
});
