import { test, expect } from "@playwright/test";

test.describe("Instagram connect UI", () => {
  test("configuracoes page shows Instagram connect card", async ({ page }) => {
    await page.route("**/api/instagram/integration", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: false, integration: null }),
      });
    });

    await page.goto("/dashboard/configuracoes");

    await expect(page.getByRole("heading", { name: "Instagram" })).toBeVisible();
    await expect(page.getByText("Não conectado")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Conectar Instagram/i }),
    ).toBeVisible();
  });

  test("shows connected state with mocked API", async ({ page }) => {
    await page.route("**/api/instagram/integration", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          connected: true,
          integration: {
            id: "int-1",
            username: "connex_br",
            displayName: "Connex",
            accountType: "BUSINESS",
            profilePictureUrl: null,
            followersCount: 1000,
            followsCount: 200,
            mediaCount: 50,
            status: "CONNECTED",
            syncStatus: "COMPLETED",
            lastSyncedAt: "2026-07-06T12:00:00.000Z",
            connectedAt: "2026-07-06T11:00:00.000Z",
          },
        }),
      });
    });

    await page.goto("/dashboard/configuracoes");

    await expect(page.getByText("@connex_br")).toBeVisible();
    await expect(page.getByText("Conectado")).toBeVisible();
  });
});
