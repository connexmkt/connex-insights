import { test, expect } from "@playwright/test";

test.describe("Password recovery flow", () => {
  test("shows generic confirmation after forgot password request", async ({
    page,
  }) => {
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill("nao-importa@example.com");
    await page.getByRole("button", { name: "Enviar instruções" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Se o e-mail estiver cadastrado",
    );
  });

  test("login page links to forgot password", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL("/esqueci-senha");
  });
});
