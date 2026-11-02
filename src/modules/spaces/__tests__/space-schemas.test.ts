import { describe, it, expect } from "vitest";
import {
  createSpaceSchema,
  createPricingPlanSchema,
  addSpacePhotoSchema,
} from "../schemas/space.schemas";

describe("Sprint 04 - Space Schemas Validation", () => {
  describe("createSpaceSchema", () => {
    const validSpaceInput = {
      establishmentId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Salón Principal Las Dalias",
      description: "Espacio amplio con iluminación natural y vista al jardín.",
      isEntireEstablishment: false,
      areaM2: 250,
      standingCapacity: 150,
      seatedCapacity: 100,
      setupBufferMinutes: 60,
      cleanupBufferMinutes: 60,
      cancellationPolicy: "MODERATE" as const,
    };

    it("accepts valid space payload", () => {
      const result = createSpaceSchema.safeParse(validSpaceInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Salón Principal Las Dalias");
        expect(result.data.areaM2).toBe(250);
        expect(result.data.standingCapacity).toBe(150);
        expect(result.data.seatedCapacity).toBe(100);
      }
    });

    it("rejects name shorter than 3 characters", () => {
      const result = createSpaceSchema.safeParse({
        ...validSpaceInput,
        name: "Ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 3 caracteres");
      }
    });

    it("rejects non-positive area in m2", () => {
      const result = createSpaceSchema.safeParse({
        ...validSpaceInput,
        areaM2: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("mayor a 0");
      }
    });

    it("rejects seated capacity exceeding standing capacity", () => {
      const result = createSpaceSchema.safeParse({
        ...validSpaceInput,
        standingCapacity: 50,
        seatedCapacity: 100,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("El aforo de pie debe ser igual o mayor al aforo sentado");
      }
    });

    it("rejects negative setup or cleanup buffers", () => {
      const resultSetup = createSpaceSchema.safeParse({
        ...validSpaceInput,
        setupBufferMinutes: -15,
      });
      expect(resultSetup.success).toBe(false);

      const resultCleanup = createSpaceSchema.safeParse({
        ...validSpaceInput,
        cleanupBufferMinutes: -30,
      });
      expect(resultCleanup.success).toBe(false);
    });

    it("rejects invalid cancellation policy", () => {
      const result = createSpaceSchema.safeParse({
        ...validSpaceInput,
        cancellationPolicy: "INVALID_POLICY",
      });
      expect(result.success).toBe(false);
    });

    it("accepts entire establishment flag", () => {
      const result = createSpaceSchema.safeParse({
        ...validSpaceInput,
        isEntireEstablishment: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isEntireEstablishment).toBe(true);
      }
    });
  });

  describe("createPricingPlanSchema", () => {
    const validPlanInput = {
      spaceId: "223e4567-e89b-12d3-a456-426614174000",
      planName: "Tarifa Estándar por Hora",
      description: "Alquiler por bloques de mínimo 4 horas.",
      pricingMode: "HOURLY" as const,
      basePriceWeekday: 150,
      basePriceWeekend: 220,
      extraHourPrice: 120,
      minimumRentalHours: 4,
      minimumBillableGuests: 1,
      cleaningFee: 80,
      securityDeposit: 500,
      requiredAdvancePercentage: 50,
      taxCondition: "TAX_EXEMPT_OR_NOT_APPLICABLE" as const,
      currency: "PEN" as const,
    };

    it("accepts valid HOURLY plan", () => {
      const result = createPricingPlanSchema.safeParse(validPlanInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricingMode).toBe("HOURLY");
        expect(result.data.basePriceWeekday).toBe(150);
        expect(result.data.basePriceWeekend).toBe(220);
      }
    });

    it("accepts valid FIXED_EVENT plan", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        planName: "Paquete Boda Todo el Día",
        pricingMode: "FIXED_EVENT",
        basePriceWeekday: 2500,
        basePriceWeekend: 3500,
        extraHourPrice: 300,
        minimumRentalHours: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pricingMode).toBe("FIXED_EVENT");
      }
    });

    it("accepts valid PER_PERSON plan", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        planName: "Tarifa por Asistente Corporativo",
        pricingMode: "PER_PERSON",
        basePriceWeekday: 35,
        basePriceWeekend: 45,
        minimumBillableGuests: 50,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid PACKAGE plan", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        planName: "Paquete Quinceañero Completo",
        pricingMode: "PACKAGE",
        basePriceWeekday: 4000,
        basePriceWeekend: 5500,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative base price", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        basePriceWeekday: -10,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("no puede ser negativo");
      }
    });

    it("rejects minimum rental hours less than 1", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        minimumRentalHours: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 1 hora");
      }
    });

    it("rejects required advance percentage below 10%", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        requiredAdvancePercentage: 5,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("al menos 10%");
      }
    });

    it("rejects required advance percentage above 100%", () => {
      const result = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        requiredAdvancePercentage: 110,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("no puede exceder el 100%");
      }
    });

    it("rejects negative cleaning fee or security deposit", () => {
      const resultClean = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        cleaningFee: -20,
      });
      expect(resultClean.success).toBe(false);

      const resultDep = createPricingPlanSchema.safeParse({
        ...validPlanInput,
        securityDeposit: -100,
      });
      expect(resultDep.success).toBe(false);
    });
  });

  describe("addSpacePhotoSchema", () => {
    it("accepts valid photo storage path and caption", () => {
      const result = addSpacePhotoSchema.safeParse({
        spaceId: "123e4567-e89b-12d3-a456-426614174000",
        storagePath: "spaces/est-123/salon1.jpg",
        caption: "Vista panorámica del jardín y piscina",
        isCover: true,
        displayOrder: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejects storage path too short", () => {
      const result = addSpacePhotoSchema.safeParse({
        spaceId: "123e4567-e89b-12d3-a456-426614174000",
        storagePath: "ab",
        displayOrder: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Ruta de almacenamiento requerida");
      }
    });

    it("rejects negative display order", () => {
      const result = addSpacePhotoSchema.safeParse({
        spaceId: "123e4567-e89b-12d3-a456-426614174000",
        storagePath: "spaces/est-123/salon1.jpg",
        displayOrder: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});
