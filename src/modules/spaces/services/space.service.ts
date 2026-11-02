import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  CreateSpaceInput,
  CreatePricingPlanInput,
  AddSpacePhotoInput,
} from "../schemas/space.schemas";
import type {
  Space,
  SpacePricingPlan,
  SpacePhoto,
  SpaceWithDetails,
} from "../types/space.types";

export class SpaceService {
  /**
   * Registra un nuevo espacio individual o la modalidad de Establecimiento Completo.
   */
  static async createSpace(
    supabase: SupabaseClient<Database>,
    input: CreateSpaceInput,
    hostId: string
  ): Promise<{ success: boolean; space?: Space; error?: string }> {
    // 1. Validar que el establecimiento pertenezca al anfitrión
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select("id, host_id")
      .eq("id", input.establishmentId)
      .single();

    if (estError || !establishment || establishment.host_id !== hostId) {
      return {
        success: false,
        error: "No autorizado: El establecimiento no existe o no te pertenece.",
      };
    }

    // 2. Insertar espacio
    const { data: spaceData, error: spaceError } = await supabase
      .from("spaces")
      .insert({
        establishment_id: input.establishmentId,
        name: input.name,
        description: input.description,
        is_entire_establishment: input.isEntireEstablishment,
        area_m2: input.areaM2,
        standing_capacity: input.standingCapacity,
        seated_capacity: input.seatedCapacity,
        setup_buffer_minutes: input.setupBufferMinutes,
        cleanup_buffer_minutes: input.cleanupBufferMinutes,
        cancellation_policy: input.cancellationPolicy,
        is_active: true,
      })
      .select()
      .single();

    if (spaceError || !spaceData) {
      return {
        success: false,
        error: spaceError?.message || "No se pudo crear el espacio.",
      };
    }

    return {
      success: true,
      space: spaceData as Space,
    };
  }

  /**
   * Crea un plan tarifario para un espacio (soporte para múltiples planes alternativos).
   */
  static async createPricingPlan(
    supabase: SupabaseClient<Database>,
    input: CreatePricingPlanInput,
    hostId: string
  ): Promise<{ success: boolean; plan?: SpacePricingPlan; error?: string }> {
    // 1. Validar propiedad del espacio
    const { data: spaceData, error: spaceError } = await supabase
      .from("spaces")
      .select("id, establishment_id")
      .eq("id", input.spaceId)
      .single();

    if (spaceError || !spaceData) {
      return { success: false, error: "Espacio no encontrado." };
    }

    const { data: estData } = await supabase
      .from("establishments")
      .select("host_id")
      .eq("id", spaceData.establishment_id)
      .single();

    if (!estData || estData.host_id !== hostId) {
      return { success: false, error: "No autorizado para modificar este espacio." };
    }

    // 2. Insertar plan tarifario
    const { data: planData, error: planError } = await supabase
      .from("space_pricing_plans")
      .insert({
        space_id: input.spaceId,
        plan_name: input.planName,
        description: input.description || null,
        pricing_mode: input.pricingMode,
        base_price_weekday: input.basePriceWeekday,
        base_price_weekend: input.basePriceWeekend,
        extra_hour_price: input.extraHourPrice,
        minimum_rental_hours: input.minimumRentalHours,
        minimum_billable_guests: input.minimumBillableGuests,
        cleaning_fee: input.cleaningFee,
        security_deposit: input.securityDeposit,
        required_advance_percentage: input.requiredAdvancePercentage,
        tax_condition: input.taxCondition,
        currency: "PEN",
        is_active: true,
      })
      .select()
      .single();

    if (planError || !planData) {
      return {
        success: false,
        error: planError?.message || "No se pudo registrar el plan tarifario.",
      };
    }

    return {
      success: true,
      plan: planData as SpacePricingPlan,
    };
  }

  /**
   * Obtiene todos los espacios de un establecimiento.
   */
  static async getSpacesByEstablishment(
    supabase: SupabaseClient<Database>,
    establishmentId: string
  ): Promise<Space[]> {
    const { data, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data as Space[];
  }

  /**
   * Obtiene los planes tarifarios activos asociados a un espacio.
   */
  static async getPricingPlansBySpace(
    supabase: SupabaseClient<Database>,
    spaceId: string
  ): Promise<SpacePricingPlan[]> {
    const { data, error } = await supabase
      .from("space_pricing_plans")
      .select("*")
      .eq("space_id", spaceId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as SpacePricingPlan[];
  }

  /**
   * Obtiene el detalle completo de un espacio con sus planes tarifarios y fotos.
   */
  static async getSpaceWithDetails(
    supabase: SupabaseClient<Database>,
    spaceId: string
  ): Promise<SpaceWithDetails | null> {
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", spaceId)
      .single();

    if (spaceError || !space) return null;

    const plans = await this.getPricingPlansBySpace(supabase, spaceId);

    const { data: photos } = await supabase
      .from("space_photos")
      .select("*")
      .eq("space_id", spaceId)
      .order("display_order", { ascending: true });

    return {
      ...(space as Space),
      pricing_plans: plans,
      photos: (photos || []) as SpacePhoto[],
    };
  }

  /**
   * Agrega una foto a la galería de un espacio.
   */
  static async addSpacePhoto(
    supabase: SupabaseClient<Database>,
    input: AddSpacePhotoInput,
    hostId: string
  ): Promise<{ success: boolean; photo?: SpacePhoto; error?: string }> {
    const { data: space } = await supabase
      .from("spaces")
      .select("establishment_id")
      .eq("id", input.spaceId)
      .single();

    if (!space) return { success: false, error: "Espacio no encontrado." };

    const { data: est } = await supabase
      .from("establishments")
      .select("host_id")
      .eq("id", space.establishment_id)
      .single();

    if (!est || est.host_id !== hostId) {
      return { success: false, error: "No autorizado para añadir fotos a este espacio." };
    }

    const { data: photoData, error } = await supabase
      .from("space_photos")
      .insert({
        space_id: input.spaceId,
        storage_path: input.storagePath,
        caption: input.caption || null,
        display_order: input.displayOrder,
        is_cover: input.isCover,
      })
      .select()
      .single();

    if (error || !photoData) {
      return { success: false, error: error?.message || "No se pudo guardar la foto." };
    }

    return { success: true, photo: photoData as SpacePhoto };
  }
}
