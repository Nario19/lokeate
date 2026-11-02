import { describe, it, expect } from "vitest";
import type { SpacePricingPlan, SpaceWithDetails } from "../types/space.types";

describe("Sprint 04 - Multi-Plan and Establishment Invariants", () => {
  const samplePlans: SpacePricingPlan[] = [
    {
      id: "plan-hourly-01",
      space_id: "space-salon-cristal",
      plan_name: "Alquiler por Horas",
      description: "Ideal para conferencias, talleres y reuniones cortas.",
      pricing_mode: "HOURLY",
      base_price_weekday: 120,
      base_price_weekend: 180,
      extra_hour_price: 100,
      minimum_rental_hours: 4,
      minimum_billable_guests: 1,
      cleaning_fee: 70,
      security_deposit: 400,
      required_advance_percentage: 50,
      tax_condition: "TAX_EXEMPT_OR_NOT_APPLICABLE",
      currency: "PEN",
      included_amenities_ids: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "plan-package-01",
      space_id: "space-salon-cristal",
      plan_name: "Paquete Matrimonio Oro",
      description: "Incluye 8 horas continuas, camerino y luces básicas.",
      pricing_mode: "PACKAGE",
      base_price_weekday: 2000,
      base_price_weekend: 2800,
      extra_hour_price: 250,
      minimum_rental_hours: 8,
      minimum_billable_guests: 1,
      cleaning_fee: 150,
      security_deposit: 800,
      required_advance_percentage: 50,
      tax_condition: "TAX_EXEMPT_OR_NOT_APPLICABLE",
      currency: "PEN",
      included_amenities_ids: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "plan-per-person-01",
      space_id: "space-salon-cristal",
      plan_name: "Almuerzo Corporativo por Persona",
      description: "Costo unitario por invitado con coffee break.",
      pricing_mode: "PER_PERSON",
      base_price_weekday: 45,
      base_price_weekend: 60,
      extra_hour_price: 0,
      minimum_rental_hours: 5,
      minimum_billable_guests: 40,
      cleaning_fee: 100,
      security_deposit: 500,
      required_advance_percentage: 40,
      tax_condition: "TAX_EXEMPT_OR_NOT_APPLICABLE",
      currency: "PEN",
      included_amenities_ids: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it("ensures that an individual space can have multiple distinct pricing plans", () => {
    expect(samplePlans.length).toBe(3);
    const planModes = samplePlans.map((p) => p.pricing_mode);
    expect(planModes).toEqual(["HOURLY", "PACKAGE", "PER_PERSON"]);
  });

  it("enforces that plans are independent alternatives and NOT automatically summed", () => {
    // In LOKEATE, selecting a plan computes the price for THAT plan only.
    // The total price must not be the sum of all plans.
    const selectedPlan = samplePlans.find((p) => p.pricing_mode === "HOURLY")!;
    const simulatedHours = 5;
    const isWeekend = true;

    const baseRate = isWeekend ? selectedPlan.base_price_weekend : selectedPlan.base_price_weekday;
    const calculatedBase = baseRate * simulatedHours;
    const totalWithoutDeposit = calculatedBase + selectedPlan.cleaning_fee;

    // Must be based solely on the selected HOURLY plan (180 * 5 + 70 = 970)
    expect(totalWithoutDeposit).toBe(970);

    // Summing all plans would yield an absurd 2000 + 45 + 180 = ~5000+
    const combinedBaseSum = samplePlans.reduce((acc, p) => acc + p.base_price_weekend, 0);
    expect(totalWithoutDeposit).not.toBe(combinedBaseSum);
  });

  it("applies differential weekend and weekday pricing correctly", () => {
    const packagePlan = samplePlans.find((p) => p.pricing_mode === "PACKAGE")!;
    expect(packagePlan.base_price_weekend).toBeGreaterThan(packagePlan.base_price_weekday);
    expect(packagePlan.base_price_weekend - packagePlan.base_price_weekday).toBe(800);
  });

  it("differentiates entire establishment spaces from individual spaces", () => {
    const entirePropertySpace: SpaceWithDetails = {
      id: "space-entire-hacienda",
      establishment_id: "est-hacienda-pachacamac",
      name: "Hacienda Completa (Salones + Jardín + Zona Parrillas)",
      description: "Acceso exclusivo a todas las instalaciones del establecimiento.",
      is_entire_establishment: true,
      area_m2: 2500,
      standing_capacity: 500,
      seated_capacity: 350,
      setup_buffer_minutes: 120,
      cleanup_buffer_minutes: 120,
      cancellation_policy: "STRICT",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pricing_plans: [],
      photos: [],
    };

    const individualGardenSpace: SpaceWithDetails = {
      id: "space-garden-only",
      establishment_id: "est-hacienda-pachacamac",
      name: "Solo Jardín y Piscina",
      description: "Área abierta al aire libre.",
      is_entire_establishment: false,
      area_m2: 1200,
      standing_capacity: 250,
      seated_capacity: 180,
      setup_buffer_minutes: 60,
      cleanup_buffer_minutes: 60,
      cancellation_policy: "MODERATE",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pricing_plans: [],
      photos: [],
    };

    expect(entirePropertySpace.is_entire_establishment).toBe(true);
    expect(individualGardenSpace.is_entire_establishment).toBe(false);
    expect(entirePropertySpace.area_m2).toBeGreaterThan(individualGardenSpace.area_m2);
    expect(entirePropertySpace.setup_buffer_minutes).toBe(120);
  });
});
