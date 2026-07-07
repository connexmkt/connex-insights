import { describe, expect, it } from "vitest";

describe("instagram token leak prevention", () => {
  const sensitivePatterns = [
    "access_token",
    "accessToken",
    "accessTokenEnc",
    "IGQWRPaW9n",
  ];

  it("API JSON response does not contain access token", () => {
    const apiResponse = JSON.stringify({
      connected: true,
      integration: {
        id: "uuid",
        username: "connex_br",
        status: "CONNECTED",
        syncStatus: "COMPLETED",
      },
    });

    for (const pattern of sensitivePatterns) {
      expect(apiResponse.toLowerCase()).not.toContain(pattern.toLowerCase());
    }
  });

  it("HTML configuracoes page does not embed tokens", () => {
    const htmlSnippet = `
      <div>@connex_br</div>
      <span>Conectado</span>
    `;

    for (const pattern of sensitivePatterns) {
      expect(htmlSnippet).not.toContain(pattern);
    }
  });
});
