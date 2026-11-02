import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { EstablishmentService } from "../services/establishment.service";
import type { CreateEstablishmentInput } from "../schemas/establishment.schemas";

describe("Sprint 03: EstablishmentService Unit Tests", () => {
  const mockInput: CreateEstablishmentInput = {
    name: "Quinta Miraflores",
    description: "Salón amplio y jardín para eventos corporativos y bodas en Lima.",
    establishmentType: "HALL",
    ubigeoCode: "150122", // Miraflores
    approximateLatitude: -12.1198,
    approximateLongitude: -77.0298,
    noiseCurfewTime: "01:00",
    houseRules: "Sin pirotecnia",
    exactAddress: "Av. Benavides 1234",
    addressReference: "Frente al parque",
    postalCode: "15074",
    hostContactPhone: "987654321",
    hostContactEmail: "info@quintamiraflores.pe",
    accessInstructions: "Recepción en primer piso",
  };

  it("obtiene la lista de distritos habilitados para la zona de lanzamiento", async () => {
    const mockDistricts = [
      { ubigeo_code: "150123", name: "Pachacámac", is_launch_zone: true, launch_phase: "PHASE_BETA_LIMA", province_code: "1501" },
      { ubigeo_code: "150109", name: "Cieneguilla", is_launch_zone: true, launch_phase: "PHASE_BETA_LIMA", province_code: "1501" },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDistricts, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await EstablishmentService.getLaunchDistricts(mockSupabase);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Pachacámac");
    expect(mockSupabase.from).toHaveBeenCalledWith("districts");
  });

  it("crea un establecimiento y su ubicación confidencial cuando el distrito está habilitado", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "districts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { is_launch_zone: true },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "establishments") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "est-uuid-1", name: mockInput.name, slug: "quinta-miraflores-123" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "establishment_locations_private") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await EstablishmentService.createEstablishment(
      mockSupabase,
      mockInput,
      "host-user-id"
    );

    expect(result.success).toBe(true);
    expect(result.establishment?.id).toBe("est-uuid-1");
  });

  it("rechaza crear un establecimiento si el distrito no está en zona de lanzamiento", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_launch_zone: false }, // No habilitado
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await EstablishmentService.createEstablishment(
      mockSupabase,
      mockInput,
      "host-user-id"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("zona de lanzamiento");
  });

  it("obtiene el catálogo público filtrando exclusivamente locales APROBADOS y ACTIVOS", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "est-1", name: "Local Aprobado 1", publishing_status: "APPROVED", is_active: true },
                ],
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await EstablishmentService.getPublicEstablishments(mockSupabase);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Local Aprobado 1");
  });

  it("envía un establecimiento a revisión / moderación", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await EstablishmentService.submitForReview(
      mockSupabase,
      "est-uuid-1",
      "host-uuid-1"
    );

    expect(result.success).toBe(true);
  });
});
