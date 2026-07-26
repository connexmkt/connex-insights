import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("shows generic error for invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Login").fill("usuario-inexistente");
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Login ou senha incorretos",
    );
  });
});
