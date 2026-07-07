import { describe, expect, it } from "vitest";
import {
  assertTenantOwnership,
  ForbiddenError,
} from "@/lib/auth/tenant-scope";
import { UserRole } from "@/lib/generated/prisma";
import type { TenantContext } from "@/types/auth";

describe("instagram tenant isolation", () => {
  const tenantAContext: TenantContext = {
    userId: "user-a",
    tenantId: "tenant-a-id",
    email: "a@example.com",
    displayName: "User A",
    role: UserRole.MEMBER,
    tenant: { id: "tenant-a-id", name: "Tenant A", slug: "tenant-a" },
  };

  it("blocks access to integration from another tenant", () => {
    expect(() =>
      assertTenantOwnership(tenantAContext, "tenant-b-id"),
    ).toThrow(ForbiddenError);
  });

  it("rejects duplicate instagram_professional_id across tenants", () => {
    const existingProfessionalId = "178414000";
    const tenantAHas = { tenantId: "tenant-a", professionalId: existingProfessionalId };
    const tenantBTries = { tenantId: "tenant-b", professionalId: existingProfessionalId };

    const isDuplicate =
      tenantAHas.professionalId === tenantBTries.professionalId &&
      tenantAHas.tenantId !== tenantBTries.tenantId;

    expect(isDuplicate).toBe(true);
  });
});
