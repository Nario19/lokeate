import { test, expect } from "@playwright/test";

test.describe("LOKEATE Landing Page E2E Smoke Tests", () => {
  test("carga la página principal con el título y elementos esenciales", async ({ page }) => {
    await page.goto("/");

    // Verificar marca LOKEATE
    await expect(page.locator("text=LOKEATE").first()).toBeVisible();

    // Verificar badge BETA
    await expect(page.locator("text=BETA").first()).toBeVisible();

    // Verificar propuesta de valor de RealPrice
    await expect(page.locator("text=RealPrice Transparente").first()).toBeVisible();

    // Verificar descargo legal de SUNAT en el footer
    await expect(page.locator("text=no sustituyen comprobantes tributarios SUNAT").first()).toBeVisible();
  });
});
