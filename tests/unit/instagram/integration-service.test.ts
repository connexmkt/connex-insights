import { describe, expect, it } from "vitest";
import { mapIntegrationUniqueViolation } from "@/lib/instagram/integration-unique-violation";

describe("mapIntegrationUniqueViolation", () => {
  it("maps instagram_professional_id conflicts to ACCOUNT_LINKED_ELSEWHERE", () => {
    expect(
      mapIntegrationUniqueViolation(["instagram_professional_id"]),
    ).toBe("ACCOUNT_LINKED_ELSEWHERE");
  });

  it("maps tenant_id conflicts to ALREADY_CONNECTED", () => {
    expect(mapIntegrationUniqueViolation(["tenant_id"])).toBe(
      "ALREADY_CONNECTED",
    );
  });

  it("defaults unknown unique targets to ALREADY_CONNECTED", () => {
    expect(mapIntegrationUniqueViolation(undefined)).toBe("ALREADY_CONNECTED");
  });
});
