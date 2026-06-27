import { test, expect } from "@playwright/test";
import { SEED_TENANT_A } from "../helpers/seed-fixtures";

test.describe("Login flow", () => {
  test("shows generic error for invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("E-mail").fill("invalid@example.com");
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "E-mail ou senha incorretos",
    );
  });

  test("redirects to dashboard with valid seed credentials", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      "Requires Supabase configuration and seed data",
    );

    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_TENANT_A.userEmail);
    await page.getByLabel("Senha").fill(SEED_TENANT_A.userPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(SEED_TENANT_A.name)).toBeVisible();
  });
});
