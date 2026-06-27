import { test, expect } from "@playwright/test";
import { SEED_TENANT_A } from "../helpers/seed-fixtures";

test.describe("Logout flow", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    "Requires Supabase configuration and seed data",
  );

  test("logout blocks dashboard access", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_TENANT_A.userEmail);
    await page.getByLabel("Senha").fill(SEED_TENANT_A.userPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
  });
});
