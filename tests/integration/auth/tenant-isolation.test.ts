import { describe, expect, it } from "vitest";
import {
  assertTenantOwnership,
  ForbiddenError,
} from "@/lib/auth/tenant-scope";
import { UserRole } from "@/lib/generated/prisma";
import type { TenantContext } from "@/types/auth";
import { SEED_TENANT_A, SEED_TENANT_B } from "@/tests/helpers/seed-fixtures";

describe("tenant isolation", () => {
  it("blocks member from tenant B data when authenticated as tenant A", () => {
    const tenantAContext: TenantContext = {
      userId: "user-a",
      tenantId: SEED_TENANT_A.id,
      email: SEED_TENANT_A.userEmail,
      displayName: SEED_TENANT_A.displayName,
      role: UserRole.MEMBER,
      tenant: {
        id: SEED_TENANT_A.id,
        name: SEED_TENANT_A.name,
        slug: SEED_TENANT_A.slug,
        plan: SEED_TENANT_A.plan,
      },
    };

    expect(() =>
      assertTenantOwnership(tenantAContext, SEED_TENANT_B.id),
    ).toThrow(ForbiddenError);
  });

  it("allows member to access own tenant data", () => {
    const tenantAContext: TenantContext = {
      userId: "user-a",
      tenantId: SEED_TENANT_A.id,
      email: SEED_TENANT_A.userEmail,
      displayName: SEED_TENANT_A.displayName,
      role: UserRole.MEMBER,
      tenant: {
        id: SEED_TENANT_A.id,
        name: SEED_TENANT_A.name,
        slug: SEED_TENANT_A.slug,
        plan: SEED_TENANT_A.plan,
      },
    };

    expect(() =>
      assertTenantOwnership(tenantAContext, SEED_TENANT_A.id),
    ).not.toThrow();
  });
});
