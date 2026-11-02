import { test, expect } from "@playwright/test";

test.describe("Sprint 02: Flujo E2E de Autenticación y Perfiles Segregados", () => {
  test("carga la página de inicio de sesión con todos sus elementos", async ({ page }) => {
    await page.goto("/auth/login");

    // Título y descripción
    await expect(page.locator("h3")).toContainText("Iniciar Sesión");
    await expect(page.getByLabel("Correo Electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();

    // Botón de ingreso y enlaces
    await expect(page.getByRole("button", { name: "Ingresar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Regístrate aquí" })).toBeVisible();
  });

  test("carga la página de registro con campos de identidad peruana y banner de privacidad", async ({ page }) => {
    await page.goto("/auth/register");

    // Título
    await expect(page.locator("h3")).toContainText("Crear cuenta en LOKEATE");

    // Campos de formulario
    await expect(page.getByLabel("Nombres")).toBeVisible();
    await expect(page.getByLabel("Apellidos")).toBeVisible();
    await expect(page.getByLabel("Tipo de Documento")).toBeVisible();
    await expect(page.getByLabel(/Número de DNI/i)).toBeVisible();
    await expect(page.getByLabel("Teléfono Móvil (Perú)")).toBeVisible();
    await expect(page.getByLabel("Correo Electrónico")).toBeVisible();

    // Banner de Ley N° 29733 de Protección de Datos Personales
    await expect(page.locator("text=Privacidad garantizada (Ley N° 29733)")).toBeVisible();

    // Validación de DNI peruano en el cliente
    await page.getByLabel("Nombres").fill("Juan");
    await page.getByLabel("Apellidos").fill("Pérez");
    await page.getByLabel(/Número de DNI/i).fill("123"); // Inválido: solo 3 dígitos
    await page.getByLabel("Teléfono Móvil (Perú)").fill("987654321");
    await page.getByLabel("Correo Electrónico").fill("juan@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill("Password123");
    await page.getByLabel("Confirmar Contraseña").fill("Password123");
    await page.getByLabel(/Acepto los/i).check();

    await page.getByRole("button", { name: "Crear Cuenta" }).click();

    // Debe mostrar error de validación de DNI
    await expect(page.locator("text=El DNI peruano debe contener exactamente 8 dígitos")).toBeVisible();
  });

  test("carga la página de recuperación de contraseña", async ({ page }) => {
    await page.goto("/auth/reset-password");

    await expect(page.locator("h3")).toContainText("Recuperar Contraseña");
    await expect(page.getByLabel("Correo Electrónico")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar Instrucciones" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a Iniciar Sesión" })).toBeVisible();
  });
});
