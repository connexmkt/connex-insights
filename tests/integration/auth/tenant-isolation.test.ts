import { describe, expect, it } from "vitest";
import { assertTenantOwnership, ForbiddenError } from "@/lib/auth/tenant-scope";
import { UserRole } from "@/lib/generated/prisma";
import type { TenantContext } from "@/types/auth";
import { TEST_TENANT_A, TEST_TENANT_B } from "@/tests/helpers/tenant-fixtures";

describe("tenant isolation", () => {
  it("blocks member from tenant B data when authenticated as tenant A", () => {
    const tenantAContext: TenantContext = {
      userId: "user-a",
      tenantId: TEST_TENANT_A.id,
      email: TEST_TENANT_A.userEmail,
      displayName: TEST_TENANT_A.displayName,
      role: UserRole.MEMBER,
      tenant: {
        id: TEST_TENANT_A.id,
        name: TEST_TENANT_A.name,
        slug: TEST_TENANT_A.slug,
      },
    };

    expect(() =>
      assertTenantOwnership(tenantAContext, TEST_TENANT_B.id),
    ).toThrow(ForbiddenError);
  });

  it("allows member to access own tenant data", () => {
    const tenantAContext: TenantContext = {
      userId: "user-a",
      tenantId: TEST_TENANT_A.id,
      email: TEST_TENANT_A.userEmail,
      displayName: TEST_TENANT_A.displayName,
      role: UserRole.MEMBER,
      tenant: {
        id: TEST_TENANT_A.id,
        name: TEST_TENANT_A.name,
        slug: TEST_TENANT_A.slug,
      },
    };

    expect(() =>
      assertTenantOwnership(tenantAContext, TEST_TENANT_A.id),
    ).not.toThrow();
  });
});
