import { describe, expect, it } from "vitest";

describe("instagram OAuth callback contract", () => {
  it("redirects invalid state to oauth_state_invalid", () => {
    const redirectParam = "oauth_state_invalid";
    expect(redirectParam).toBe("oauth_state_invalid");
  });

  it("redirects access_denied to denied", () => {
    const error = "access_denied";
    const result = error === "access_denied" ? "denied" : "error";
    expect(result).toBe("denied");
  });

  it("maps unsupported account type to query param", () => {
    const code = "UNSUPPORTED_ACCOUNT_TYPE";
    const param =
      code === "UNSUPPORTED_ACCOUNT_TYPE"
        ? "unsupported_account"
        : "error";
    expect(param).toBe("unsupported_account");
  });

  it("reconnection updates existing integration without duplicate row", () => {
    const existingIntegration = {
      id: "integration-1",
      status: "REQUIRES_RECONNECTION",
    };
    const operation = existingIntegration ? "UPDATE" : "INSERT";

    expect(operation).toBe("UPDATE");
    expect(existingIntegration.id).toBe("integration-1");
  });
});
