import { describe, it, expect } from "vitest";
import {
  createEstablishmentSchema,
  moderationSchema,
} from "../schemas/establishment.schemas";

describe("Sprint 03: Establishment Schemas & Peruvian Validation", () => {
  const validBaseEstablishment = {
    name: "Quinta Sol de Pachacámac",
    description: "Hermosa quinta campestre con amplias áreas verdes, piscina, zona de parrilla y estacionamiento para 30 autos.",
    establishmentType: "COUNTRY_HOUSE" as const,
    ubigeoCode: "150123", // Pachacámac
    approximateLatitude: -12.2289,
    approximateLongitude: -76.8597,
    noiseCurfewTime: "02:00",
    houseRules: "No pirotecnia sonora, música a volumen moderado desde las 02:00.",
    exactAddress: "Av. Manuel Valle Km 5.5, Parcela B-12",
    addressReference: "A 500m del Restaurant Rinconcito de Pachacámac",
    postalCode: "15593",
    hostContactPhone: "987654321",
    hostContactEmail: "contacto@quintasol.pe",
    accessInstructions: "Portón blanco con timbre en caseta de vigilancia.",
  };

  it("acepta un establecimiento con datos válidos y coordenadas en Perú", () => {
    const result = createEstablishmentSchema.safeParse(validBaseEstablishment);
    expect(result.success).toBe(true);
  });

  it("rechaza coordenadas fuera de los límites geográficos del Perú", () => {
    // Latitud positiva (fuera de Perú, que está en el hemisferio sur entre 0° y -18.5°)
    const invalidLat = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      approximateLatitude: 10.5,
    });
    expect(invalidLat.success).toBe(false);
    if (!invalidLat.success) {
      expect(invalidLat.error.errors[0].message).toContain("territorio peruano");
    }

    // Longitud fuera de Perú (-81.5° a -68.5°)
    const invalidLng = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      approximateLongitude: -40.0,
    });
    expect(invalidLng.success).toBe(false);
  });

  it("rechaza ubigeo con formato diferente a 6 dígitos", () => {
    const shortUbigeo = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      ubigeoCode: "1501",
    });
    expect(shortUbigeo.success).toBe(false);

    const nonNumeric = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      ubigeoCode: "15012A",
    });
    expect(nonNumeric.success).toBe(false);
  });

  it("rechaza descripciones muy breves que no orienten al cliente", () => {
    const shortDesc = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      description: "Local bonito",
    });
    expect(shortDesc.success).toBe(false);
    if (!shortDesc.success) {
      expect(shortDesc.error.errors[0].message).toContain("al menos 20 caracteres");
    }
  });

  it("rechaza teléfonos de contacto que no cumplan el estándar móvil peruano de 9 dígitos", () => {
    const invalidPhone = createEstablishmentSchema.safeParse({
      ...validBaseEstablishment,
      hostContactPhone: "12345678",
    });
    expect(invalidPhone.success).toBe(false);
  });

  describe("Esquema de Moderación Administrativa", () => {
    it("valida moderación aprobada con UUID válido", () => {
      const valid = moderationSchema.safeParse({
        establishmentId: "550e8400-e29b-41d4-a716-446655440000",
        status: "APPROVED",
      });
      expect(valid.success).toBe(true);
    });

    it("valida moderación rechazada con motivo", () => {
      const rejected = moderationSchema.safeParse({
        establishmentId: "550e8400-e29b-41d4-a716-446655440000",
        status: "REJECTED",
        rejectionReason: "Falta evidencia clara de seguridad en escaleras",
      });
      expect(rejected.success).toBe(true);
    });

    it("rechaza UUID inválido o estado no reconocido", () => {
      expect(
        moderationSchema.safeParse({
          establishmentId: "invalid-uuid",
          status: "APPROVED",
        }).success
      ).toBe(false);

      expect(
        moderationSchema.safeParse({
          establishmentId: "550e8400-e29b-41d4-a716-446655440000",
          status: "UNKNOWN_STATUS" as unknown as "APPROVED",
        }).success
      ).toBe(false);
    });
  });
});
