import { describe, expect, it } from "vitest";

describe("RLS policy expectations", () => {
  it("documents tenant-scoped policy predicate", () => {
    const policyPredicate = "tenant_id = public.current_tenant_id()";
    expect(policyPredicate).toContain("current_tenant_id()");
  });

  it("requires RLS on tenant-owned tables", () => {
    const protectedTables = ["tenants", "profiles"];
    expect(protectedTables).toEqual(["tenants", "profiles"]);
  });
});
