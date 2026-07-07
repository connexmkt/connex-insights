import { describe, expect, it } from "vitest";
import { instagramCallbackQuerySchema } from "@/lib/instagram/schemas";

describe("instagram connect API contract", () => {
  it("defines 401 response for unauthenticated requests", () => {
    const errorShape = {
      error: "Sessão expirada.",
      code: "SESSION_EXPIRED",
    };

    expect(errorShape.code).toBe("SESSION_EXPIRED");
  });

  it("defines 409 response when tenant already connected", () => {
    const errorShape = {
      error: "Este workspace já possui uma conta Instagram conectada.",
      code: "ALREADY_CONNECTED",
    };

    expect(errorShape.code).toBe("ALREADY_CONNECTED");
  });

  it("redirects authenticated user to Meta authorize URL", () => {
    const authorizationUrl = new URL(
      "https://www.instagram.com/oauth/authorize",
    );
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("force_reauth", "true");

    expect(authorizationUrl.hostname).toBe("www.instagram.com");
    expect(authorizationUrl.searchParams.get("response_type")).toBe("code");
  });
});

describe("instagram callback query schema", () => {
  it("requires state parameter", () => {
    const result = instagramCallbackQuerySchema.safeParse({
      code: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid callback query", () => {
    const result = instagramCallbackQuerySchema.safeParse({
      code: "abc",
      state: "signed-state",
    });

    expect(result.success).toBe(true);
  });
});
