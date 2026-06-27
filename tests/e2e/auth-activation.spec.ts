import { test, expect } from "@playwright/test";
import { SEED_INACTIVE_USER } from "../helpers/seed-fixtures";

test.describe("Account activation flow", () => {
  test("redirects inactive user to activation after login", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      "Requires Supabase configuration and seed data",
    );

    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_INACTIVE_USER.userEmail);
    await page.getByLabel("Senha").fill(SEED_INACTIVE_USER.temporaryPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/ativar-conta/);
  });

  test("completes activation, reaches dashboard, and rejects old temporary password", async ({
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

    await page
      .getByLabel("Senha temporária")
      .fill(SEED_INACTIVE_USER.temporaryPassword);
    await page
      .getByLabel("Nova senha", { exact: true })
      .fill(SEED_INACTIVE_USER.newPassword);
    await page
      .getByLabel("Confirmar nova senha")
      .fill(SEED_INACTIVE_USER.newPassword);
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(SEED_INACTIVE_USER.tenantName)).toBeVisible();

    await page.goto("/");
    await page.getByLabel("E-mail").fill(SEED_INACTIVE_USER.userEmail);
    await page.getByLabel("Senha").fill(SEED_INACTIVE_USER.temporaryPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "E-mail ou senha incorretos",
    );
  });
});
