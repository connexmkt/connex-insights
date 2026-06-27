import { test, expect } from "@playwright/test";
import { SEED_INACTIVE_USER } from "../helpers/seed-fixtures";

test.describe("Activation bypass prevention", () => {
  test("blocks dashboard access for inactive pre-activation session", async ({
    page,
  }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      "Requires Supabase configuration and seed data",
    );

    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_INACTIVE_USER.userEmail);
    await page.getByLabel("Senha").fill(SEED_INACTIVE_USER.temporaryPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/ativar-conta/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/ativar-conta/);
  });

  test("redirects unauthenticated users away from activation page", async ({
    page,
  }) => {
    await page.goto("/ativar-conta");
    await expect(page).toHaveURL("/");
  });

  test("returns 401 from session API for inactive users", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      "Requires Supabase configuration and seed data",
    );

    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_INACTIVE_USER.userEmail);
    await page.getByLabel("Senha").fill(SEED_INACTIVE_USER.temporaryPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/ativar-conta/);

    const response = await page.request.get("/api/auth/session");
    expect(response.status()).toBe(401);
  });
});
