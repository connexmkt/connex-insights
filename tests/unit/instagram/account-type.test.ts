import { describe, expect, it } from "vitest";
import { mapGraphAccountType } from "@/types/instagram";

describe("mapGraphAccountType", () => {
  it.each([
    ["Business", "BUSINESS"],
    ["BUSINESS", "BUSINESS"],
    ["business", "BUSINESS"],
  ])("maps %s to BUSINESS", (input, expected) => {
    expect(mapGraphAccountType(input)).toBe(expected);
  });

  it.each([
    ["Media_Creator", "MEDIA_CREATOR"],
    ["MEDIA_CREATOR", "MEDIA_CREATOR"],
    ["media_creator", "MEDIA_CREATOR"],
    ["Creator", "MEDIA_CREATOR"],
    ["CREATOR", "MEDIA_CREATOR"],
    ["creator", "MEDIA_CREATOR"],
  ])("maps %s to MEDIA_CREATOR", (input, expected) => {
    expect(mapGraphAccountType(input)).toBe(expected);
  });

  it.each(["PERSONAL", "Personal", "personal", "UNKNOWN"])(
    "rejects %s",
    (input) => {
      expect(mapGraphAccountType(input)).toBeNull();
    },
  );
});
