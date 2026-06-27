import { describe, expect, it } from "vitest";
import { UserRole } from "@/lib/generated/prisma";
import {
  assertTenantOwnership,
  ForbiddenError,
} from "@/lib/auth/tenant-scope";
import type { TenantContext } from "@/types/auth";
import { SEED_TENANT_A, SEED_TENANT_B } from "@/tests/helpers/seed-fixtures";

function buildContext(tenantId: string, role: UserRole = UserRole.MEMBER): TenantContext {
  return {
    userId: "00000000-0000-4000-8000-000000000099",
    tenantId,
    email: "user@example.com",
    displayName: "Test User",
    role,
    tenant: {
      id: tenantId,
      name: "Tenant",
      slug: "tenant",
      plan: "Plan",
    },
  };
}

describe("assertTenantOwnership", () => {
  it("allows access to own tenant resources", () => {
    const context = buildContext(SEED_TENANT_A.id);
    expect(() => assertTenantOwnership(context, SEED_TENANT_A.id)).not.toThrow();
  });

  it("denies cross-tenant access for members", () => {
    const context = buildContext(SEED_TENANT_A.id);
    expect(() => assertTenantOwnership(context, SEED_TENANT_B.id)).toThrow(
      ForbiddenError,
    );
  });

  it("allows platform admin cross-tenant access", () => {
    const context = buildContext(SEED_TENANT_A.id, UserRole.PLATFORM_ADMIN);
    expect(() => assertTenantOwnership(context, SEED_TENANT_B.id)).not.toThrow();
  });
});
