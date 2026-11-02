import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { CreateEstablishmentInput, ModerationInput } from "../schemas/establishment.schemas";
import type { Establishment, EstablishmentLocationPrivate, LaunchDistrict } from "../types/establishment.types";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/[^\w-]+/g, "") // Remueve caracteres no alfanuméricos
    .replace(/--+/g, "-");
}

export class EstablishmentService {
  /**
   * Obtiene los distritos habilitados para la fase de lanzamiento (Beta Lima y Campestres).
   */
  static async getLaunchDistricts(
    supabase: SupabaseClient<Database>
  ): Promise<LaunchDistrict[]> {
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .eq("is_launch_zone", true)
      .order("name", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as LaunchDistrict[];
  }

  /**
   * Registra un nuevo establecimiento con ubicación confidencial segregada.
   */
  static async createEstablishment(
    supabase: SupabaseClient<Database>,
    input: CreateEstablishmentInput,
    hostId: string
  ): Promise<{ success: boolean; establishment?: Establishment; error?: string }> {
    // 1. Validar que el distrito pertenezca a la zona de lanzamiento
    const { data: district } = await supabase
      .from("districts")
      .select("is_launch_zone")
      .eq("ubigeo_code", input.ubigeoCode)
      .single();

    if (!district || !district.is_launch_zone) {
      return {
        success: false,
        error: "El distrito seleccionado no forma parte de la zona de lanzamiento habilitada actualmente.",
      };
    }

    // 2. Generar slug único
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const baseSlug = slugify(input.name);
    const slug = `${baseSlug}-${randomSuffix}`;

    // 3. Insertar datos públicos en establishments
    const { data: estData, error: estError } = await supabase
      .from("establishments")
      .insert({
        host_id: hostId,
        name: input.name,
        slug,
        description: input.description,
        establishment_type: input.establishmentType,
        ubigeo_code: input.ubigeoCode,
        approximate_latitude: input.approximateLatitude,
        approximate_longitude: input.approximateLongitude,
        noise_curfew_time: input.noiseCurfewTime || null,
        house_rules: input.houseRules || null,
        publishing_status: "DRAFT",
        is_active: false,
        is_verified: false,
      })
      .select()
      .single();

    if (estError || !estData) {
      return {
        success: false,
        error: estError?.message || "No se pudo registrar el establecimiento.",
      };
    }

    // 4. Insertar dirección exacta y contacto en establishment_locations_private
    const { error: locError } = await supabase
      .from("establishment_locations_private")
      .insert({
        establishment_id: estData.id,
        exact_address: input.exactAddress,
        address_reference: input.addressReference || null,
        postal_code: input.postalCode || null,
        host_contact_phone: input.hostContactPhone,
        host_contact_email: input.hostContactEmail || null,
        access_instructions: input.accessInstructions || null,
      });

    if (locError) {
      // Revertir inserción pública si falla la ubicación privada
      await supabase.from("establishments").delete().eq("id", estData.id);
      return {
        success: false,
        error: `Error al resguardar la ubicación confidencial: ${locError.message}`,
      };
    }

    return {
      success: true,
      establishment: estData as Establishment,
    };
  }

  /**
   * Obtiene los establecimientos gestionados por un anfitrión.
   */
  static async getEstablishmentsByHost(
    supabase: SupabaseClient<Database>,
    hostId: string
  ): Promise<Establishment[]> {
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Establishment[];
  }

  /**
   * Catálogo público: Solo establecimientos con publishing_status = 'APPROVED' y is_active = TRUE.
   */
  static async getPublicEstablishments(
    supabase: SupabaseClient<Database>
  ): Promise<Establishment[]> {
    const { data, error } = await supabase
      .from("establishments")
      .select("*")
      .eq("publishing_status", "APPROVED")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Establishment[];
  }

  /**
   * Envía un establecimiento a revisión / moderación administrativa.
   */
  static async submitForReview(
    supabase: SupabaseClient<Database>,
    establishmentId: string,
    hostId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from("establishments")
      .update({
        publishing_status: "SUBMITTED_FOR_REVIEW",
      })
      .eq("id", establishmentId)
      .eq("host_id", hostId)
      .in("publishing_status", ["DRAFT", "REJECTED"]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Moderación administrativa de un establecimiento (Solo Superadministrador).
   */
  static async moderateEstablishment(
    supabase: SupabaseClient<Database>,
    input: ModerationInput
  ): Promise<{ success: boolean; error?: string }> {
    const updatePayload: {
      publishing_status: "APPROVED" | "REJECTED" | "SUSPENDED";
      is_active?: boolean;
    } = {
      publishing_status: input.status,
    };

    if (input.status === "APPROVED") {
      updatePayload.is_active = true;
    } else {
      updatePayload.is_active = false;
    }

    const { error } = await supabase
      .from("establishments")
      .update(updatePayload)
      .eq("id", input.establishmentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Obtiene la ubicación privada exacta de un establecimiento.
   * Sujeto estrictamente a la política RLS: Anfitrión propietario, cliente confirmado o Superadmin.
   */
  static async getPrivateLocation(
    supabase: SupabaseClient<Database>,
    establishmentId: string
  ): Promise<EstablishmentLocationPrivate | null> {
    const { data, error } = await supabase
      .from("establishment_locations_private")
      .select("*")
      .eq("establishment_id", establishmentId)
      .single();

    if (error || !data) return null;
    return data as EstablishmentLocationPrivate;
  }
}
