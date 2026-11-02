import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SpaceService } from "../services/space.service";
import type {
  CreateSpaceInput,
  CreatePricingPlanInput,
  AddSpacePhotoInput,
} from "../schemas/space.schemas";

describe("Sprint 04: SpaceService Unit Tests", () => {
  const mockSpaceInput: CreateSpaceInput = {
    establishmentId: "est-123",
    name: "Terraza Mirador",
    description: "Terraza al aire libre con vista a las lomas.",
    isEntireEstablishment: false,
    areaM2: 180,
    standingCapacity: 120,
    seatedCapacity: 90,
    setupBufferMinutes: 45,
    cleanupBufferMinutes: 45,
    cancellationPolicy: "MODERATE",
  };

  const mockPlanInput: CreatePricingPlanInput = {
    spaceId: "space-456",
    planName: "Tarifa Fin de Semana",
    description: "Tarifa preferencial para viernes a domingo.",
    pricingMode: "HOURLY",
    basePriceWeekday: 160,
    basePriceWeekend: 220,
    extraHourPrice: 120,
    minimumRentalHours: 5,
    minimumBillableGuests: 1,
    cleaningFee: 90,
    securityDeposit: 600,
    requiredAdvancePercentage: 50,
    taxCondition: "TAX_EXEMPT_OR_NOT_APPLICABLE",
    currency: "PEN",
  };

  const mockPhotoInput: AddSpacePhotoInput = {
    spaceId: "space-456",
    storagePath: "spaces/est-123/terraza-1.jpg",
    caption: "Vista al atardecer",
    displayOrder: 0,
    isCover: true,
  };

  describe("createSpace", () => {
    it("crea un espacio exitosamente cuando el usuario es el dueño del establecimiento", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "establishments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "est-123", host_id: "host-user-1" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "spaces") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "space-new-1",
                      establishment_id: "est-123",
                      name: mockSpaceInput.name,
                      area_m2: mockSpaceInput.areaM2,
                      standing_capacity: mockSpaceInput.standingCapacity,
                      seated_capacity: mockSpaceInput.seatedCapacity,
                      is_entire_establishment: false,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.createSpace(mockSupabase, mockSpaceInput, "host-user-1");
      expect(result.success).toBe(true);
      expect(result.space?.id).toBe("space-new-1");
      expect(result.space?.name).toBe("Terraza Mirador");
    });

    it("rechaza la creación si el usuario no es el dueño del establecimiento", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "est-123", host_id: "other-user" },
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.createSpace(mockSupabase, mockSpaceInput, "host-user-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("No autorizado");
    });
  });

  describe("createPricingPlan", () => {
    it("crea un plan tarifario cuando el usuario es el dueño del establecimiento", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "spaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "space-456", establishment_id: "est-123" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "establishments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { host_id: "host-user-1" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "space_pricing_plans") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "plan-new-1",
                      space_id: "space-456",
                      plan_name: mockPlanInput.planName,
                      pricing_mode: "HOURLY",
                      base_price_weekday: 160,
                      base_price_weekend: 220,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.createPricingPlan(mockSupabase, mockPlanInput, "host-user-1");
      expect(result.success).toBe(true);
      expect(result.plan?.id).toBe("plan-new-1");
      expect(result.plan?.pricing_mode).toBe("HOURLY");
    });

    it("rechaza crear plan si el espacio no existe", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.createPricingPlan(mockSupabase, mockPlanInput, "host-user-1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Espacio no encontrado.");
    });
  });

  describe("getSpacesByEstablishment", () => {
    it("obtiene la lista de espacios ordenados alfabéticamente", async () => {
      const mockSpaces = [
        { id: "sp-1", name: "Jardín Los Álamos", establishment_id: "est-123" },
        { id: "sp-2", name: "Salón Imperial", establishment_id: "est-123" },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSpaces, error: null }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.getSpacesByEstablishment(mockSupabase, "est-123");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Jardín Los Álamos");
    });
  });

  describe("getPricingPlansBySpace", () => {
    it("obtiene únicamente los planes activos de un espacio", async () => {
      const mockPlans = [
        { id: "pl-1", space_id: "space-456", plan_name: "Plan Regular", is_active: true },
        { id: "pl-2", space_id: "space-456", plan_name: "Plan Paquete", is_active: true },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.getPricingPlansBySpace(mockSupabase, "space-456");
      expect(result).toHaveLength(2);
      expect(result[1].plan_name).toBe("Plan Paquete");
    });
  });

  describe("getSpaceWithDetails", () => {
    it("obtiene el espacio consolidado con sus planes y fotos", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "spaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "space-456",
                      name: "Salón Principal",
                      establishment_id: "est-123",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "space_pricing_plans") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [{ id: "pl-1", plan_name: "Por Hora", is_active: true }],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "space_photos") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [{ id: "ph-1", storage_path: "path/photo.jpg", is_cover: true }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.getSpaceWithDetails(mockSupabase, "space-456");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Salón Principal");
      expect(result?.pricing_plans).toHaveLength(1);
      expect(result?.photos).toHaveLength(1);
    });

    it("retorna null si el espacio no existe", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.getSpaceWithDetails(mockSupabase, "non-existent");
      expect(result).toBeNull();
    });
  });

  describe("addSpacePhoto", () => {
    it("guarda la foto cuando el anfitrión es propietario", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "spaces") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { establishment_id: "est-123" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "establishments") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { host_id: "host-user-1" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "space_photos") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "photo-1",
                      space_id: "space-456",
                      storage_path: mockPhotoInput.storagePath,
                      is_cover: true,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await SpaceService.addSpacePhoto(mockSupabase, mockPhotoInput, "host-user-1");
      expect(result.success).toBe(true);
      expect(result.photo?.id).toBe("photo-1");
    });
  });
});
