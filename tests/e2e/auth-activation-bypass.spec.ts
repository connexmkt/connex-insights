import { test, expect } from "@playwright/test";

test.describe("Activation bypass prevention", () => {
  test("redirects unauthenticated users away from activation page", async ({
    page,
  }) => {
    await page.goto("/ativar-conta");
    await expect(page).toHaveURL("/");
  });
});
