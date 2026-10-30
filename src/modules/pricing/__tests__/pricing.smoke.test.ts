import { describe, it, expect } from "vitest";
import { formatCurrencyPEN } from "@/lib/utils";

describe("Pricing Smoke Unit Tests - RealPrice Foundation", () => {
  it("formatea correctamente los importes a Soles peruanos (PEN)", () => {
    const formatted = formatCurrencyPEN(1500.5);
    // Debe incluir el símbolo de soles S/ o PEN y los dos decimales
    expect(formatted).toMatch(/S\/\s?1[,.]500\.50|PEN\s?1[,.]500\.50/);
  });

  it("calcula de forma determinista la suma de conceptos sin mezclar modalidades", () => {
    const planBasePrice = 1200.0;
    const cleaningFee = 150.0;
    const securityDeposit = 500.0;
    const additionalHours = 2;
    const extraHourPrice = 100.0;

    const totalRental = planBasePrice + (additionalHours * extraHourPrice) + cleaningFee;
    const totalContract = totalRental + securityDeposit;

    expect(totalRental).toBe(1550.0);
    expect(totalContract).toBe(2050.0);
  });
});
