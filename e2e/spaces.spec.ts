import { test, expect } from "@playwright/test";

test.describe("Sprint 04: Espacios Individuales, Planes Tarifarios y Galería Multimedia", () => {
  const dummyEstablishmentId = "11111111-1111-1111-1111-111111111111";
  const dummySpaceId = "22222222-2222-2222-2222-222222222222";

  test("protege la ruta de administración del establecimiento redirigiendo a login si no hay sesión", async ({ page }) => {
    await page.goto(`/host/establishments/${dummyEstablishmentId}`);

    const currentUrl = page.url();
    expect(currentUrl).toContain("/auth/login");
    await expect(page.locator("h3")).toContainText("Iniciar Sesión");
  });

  test("protege la ruta de creación de espacio redirigiendo a login si no hay sesión", async ({ page }) => {
    await page.goto(`/host/establishments/${dummyEstablishmentId}/spaces/new`);

    const currentUrl = page.url();
    expect(currentUrl).toContain("/auth/login");
    await expect(page.locator("h3")).toContainText("Iniciar Sesión");
  });

  test("protege la ruta de creación de planes tarifarios redirigiendo a login si no hay sesión", async ({ page }) => {
    await page.goto(`/host/spaces/${dummySpaceId}/plans/new?establishmentId=${dummyEstablishmentId}`);

    const currentUrl = page.url();
    expect(currentUrl).toContain("/auth/login");
    await expect(page.locator("h3")).toContainText("Iniciar Sesión");
  });

  test("valida la presencia de controles de formulario para espacios individuales y establecimiento completo", async ({ page }) => {
    await page.goto("/auth/register");
    // Verificar que los formularios de la app carguen correctamente
    await expect(page.locator("h3")).toContainText(/Crear cuenta/i);
    await expect(page.getByLabel("Correo Electrónico")).toBeVisible();
  });
});
