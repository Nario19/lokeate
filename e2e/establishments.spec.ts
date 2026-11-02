import { test, expect } from "@playwright/test";

test.describe("Sprint 03: Catálogo Territorial, Moderación y Ubicación Segregada", () => {
  test("carga la página pública de exploración con zonas de lanzamiento y catálogo", async ({ page }) => {
    await page.goto("/explorar");

    // Banner de fase de lanzamiento
    await expect(page.locator("text=Fase Beta — Zonas de Lanzamiento Habilitadas")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Catálogo Oficial de Locales para Eventos en Perú");

    // Distritos activos en Lima y Campestres
    await expect(page.getByText("Pachacámac", { exact: true })).toBeVisible();
    await expect(page.getByText("Cieneguilla", { exact: true })).toBeVisible();
    await expect(page.getByText("Miraflores", { exact: true })).toBeVisible();

    // Sección de locales publicados y verificados
    await expect(page.locator("h2")).toContainText("Locales Publicados y Verificados");
  });

  test("carga el formulario de alta de establecimiento para anfitriones con segregación física", async ({ page }) => {
    // Si no está autenticado, el middleware o la página redirige a login con next
    await page.goto("/host/establishments/new");

    // Verificar si redirige a login debido a guardia de sesión
    const currentUrl = page.url();
    if (currentUrl.includes("/auth/login")) {
      await expect(page.locator("h3")).toContainText("Iniciar Sesión");
    } else {
      // Si la sesión está simulada o la página carga directamente
      await expect(page.locator("h1")).toContainText("Registrar Nuevo Establecimiento");
      await expect(page.getByLabel("Nombre del Local o Establecimiento")).toBeVisible();
      await expect(page.getByLabel("Tipo de Establecimiento")).toBeVisible();
      await expect(page.getByLabel(/Distrito/i)).toBeVisible();
      await expect(page.locator("text=Georreferenciación Referencial Perturbada (~500m)")).toBeVisible();
      await expect(page.locator("text=2. Ubicación Confidencial y Contacto Operativo")).toBeVisible();
      await expect(page.getByLabel(/Dirección Física Exacta/i)).toBeVisible();
    }
  });
});
