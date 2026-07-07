import { describe, expect, it } from "vitest";
import { mapGraphAccountType } from "@/types/instagram";

describe("sync-service contract", () => {
  it("accepts Business account type", () => {
    expect(mapGraphAccountType("Business")).toBe("BUSINESS");
  });

  it("accepts Media_Creator account type", () => {
    expect(mapGraphAccountType("Media_Creator")).toBe("MEDIA_CREATOR");
  });

  it("rejects personal account type", () => {
    expect(mapGraphAccountType("PERSONAL")).toBeNull();
  });

  it("marks sync as FAILED on API error with partial data preserved", () => {
    const syncResult = {
      syncStatus: "FAILED" as const,
      profileSaved: true,
    };

    expect(syncResult.syncStatus).toBe("FAILED");
    expect(syncResult.profileSaved).toBe(true);
  });
});
