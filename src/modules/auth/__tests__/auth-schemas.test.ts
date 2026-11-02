import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
  peruvianPhoneSchema,
} from "../schemas/auth.schemas";

describe("Sprint 02: Auth & Peruvian Identity Schemas", () => {
  describe("Validación de Documentos Peruanos y Extranjeros", () => {
    const validBaseUser = {
      firstName: "Carlos",
      lastName: "Mamani",
      phone: "987654321",
      email: "carlos.mamani@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      termsAccepted: true,
    };

    it("acepta un DNI peruano válido de 8 dígitos", () => {
      const result = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "DNI",
        documentNumber: "45678912",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza un DNI peruano con menos o más de 8 dígitos", () => {
      const shortDni = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "DNI",
        documentNumber: "1234567",
      });
      expect(shortDni.success).toBe(false);
      if (!shortDni.success) {
        expect(shortDni.error.errors[0].message).toContain("8 dígitos numéricos");
      }

      const longDni = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "DNI",
        documentNumber: "123456789",
      });
      expect(longDni.success).toBe(false);
    });

    it("rechaza un DNI peruano con caracteres no numéricos", () => {
      const nonNumericDni = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "DNI",
        documentNumber: "4567891A",
      });
      expect(nonNumericDni.success).toBe(false);
    });

    it("acepta un RUC peruano válido de 11 dígitos que inicia con 10 o 20", () => {
      const ruc10 = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "RUC",
        documentNumber: "10456789121",
      });
      expect(ruc10.success).toBe(true);

      const ruc20 = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "RUC",
        documentNumber: "20601234567",
      });
      expect(ruc20.success).toBe(true);
    });

    it("rechaza un RUC que no empieza con 10 o 20 o no tiene 11 dígitos", () => {
      const invalidRuc = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "RUC",
        documentNumber: "15456789121",
      });
      expect(invalidRuc.success).toBe(false);
      if (!invalidRuc.success) {
        expect(invalidRuc.error.errors[0].message).toContain("11 dígitos y comenzar con 10 o 20");
      }
    });

    it("acepta un Carné de Extranjería (CE) válido de 9 a 12 caracteres alfanuméricos", () => {
      const validCe = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "CE",
        documentNumber: "001234567",
      });
      expect(validCe.success).toBe(true);
    });

    it("acepta un Pasaporte válido de 6 a 12 caracteres alfanuméricos", () => {
      const validPassport = registerSchema.safeParse({
        ...validBaseUser,
        documentType: "PASSPORT",
        documentNumber: "PE123456",
      });
      expect(validPassport.success).toBe(true);
    });
  });

  describe("Validación de Teléfono Móvil Peruano", () => {
    it("acepta teléfono móvil que inicia con 9 y tiene 9 dígitos", () => {
      expect(peruvianPhoneSchema.safeParse("987654321").success).toBe(true);
      expect(peruvianPhoneSchema.safeParse("912345678").success).toBe(true);
    });

    it("rechaza teléfono que no inicia con 9 o no tiene 9 dígitos", () => {
      expect(peruvianPhoneSchema.safeParse("187654321").success).toBe(false);
      expect(peruvianPhoneSchema.safeParse("98765432").success).toBe(false);
      expect(peruvianPhoneSchema.safeParse("9876543210").success).toBe(false);
      expect(peruvianPhoneSchema.safeParse("98765432A").success).toBe(false);
    });
  });

  describe("Validación de Seguridad de Contraseñas", () => {
    const baseValid = {
      firstName: "Ana",
      lastName: "Rios",
      documentType: "DNI" as const,
      documentNumber: "72345678",
      phone: "998877665",
      email: "ana.rios@example.com",
      termsAccepted: true,
    };

    it("exige al menos 8 caracteres, 1 mayúscula, 1 minúscula y 1 número", () => {
      const valid = registerSchema.safeParse({
        ...baseValid,
        password: "ValidPassword1",
        confirmPassword: "ValidPassword1",
      });
      expect(valid.success).toBe(true);

      const noNumber = registerSchema.safeParse({
        ...baseValid,
        password: "ValidPassword",
        confirmPassword: "ValidPassword",
      });
      expect(noNumber.success).toBe(false);

      const noUpper = registerSchema.safeParse({
        ...baseValid,
        password: "validpassword1",
        confirmPassword: "validpassword1",
      });
      expect(noUpper.success).toBe(false);

      const short = registerSchema.safeParse({
        ...baseValid,
        password: "Pass1",
        confirmPassword: "Pass1",
      });
      expect(short.success).toBe(false);
    });

    it("rechaza registro cuando confirmPassword no coincide con password", () => {
      const mismatch = registerSchema.safeParse({
        ...baseValid,
        password: "ValidPassword1",
        confirmPassword: "DifferentPassword2",
      });
      expect(mismatch.success).toBe(false);
      if (!mismatch.success) {
        expect(mismatch.error.errors.some((e) => e.message === "Las contraseñas no coinciden.")).toBe(true);
      }
    });

    it("rechaza registro si no se aceptan los términos y condiciones", () => {
      const termsRejected = registerSchema.safeParse({
        ...baseValid,
        password: "ValidPassword1",
        confirmPassword: "ValidPassword1",
        termsAccepted: false,
      });
      expect(termsRejected.success).toBe(false);
    });
  });

  describe("Login y Recuperación de Clave", () => {
    it("valida login exitoso con email y contraseña", () => {
      const valid = loginSchema.safeParse({
        email: "usuario@lokeate.pe",
        password: "MiPasswordSeguro123",
      });
      expect(valid.success).toBe(true);
    });

    it("rechaza login con correo inválido o contraseña vacía", () => {
      expect(loginSchema.safeParse({ email: "invalido", password: "123" }).success).toBe(false);
      expect(loginSchema.safeParse({ email: "valido@correo.com", password: "" }).success).toBe(false);
    });

    it("valida solicitud de recuperación de clave", () => {
      expect(requestPasswordResetSchema.safeParse({ email: "test@correo.com" }).success).toBe(true);
      expect(requestPasswordResetSchema.safeParse({ email: "invalido" }).success).toBe(false);
    });

    it("valida actualización de contraseña con coincidencia", () => {
      const valid = updatePasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
      expect(valid.success).toBe(true);

      const mismatch = updatePasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "AnotherPassword123",
      });
      expect(mismatch.success).toBe(false);
    });
  });
});
