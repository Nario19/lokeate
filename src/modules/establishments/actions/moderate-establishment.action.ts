"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { moderationSchema, type ModerationInput } from "../schemas/establishment.schemas";
import { EstablishmentService } from "../services/establishment.service";
import type { ActionResponse } from "@/modules/auth/types/auth.types";

export async function moderateEstablishmentAction(
  rawInput: ModerationInput
): Promise<ActionResponse> {
  const validation = moderationSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos de moderación inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión no iniciada." };
    }

    // Comprobar rol de superadministrador
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "SUPERADMIN") {
      return {
        success: false,
        error: "Violación de seguridad: Solo los administradores pueden moderar locales (error 42501).",
      };
    }

    const result = await EstablishmentService.moderateEstablishment(
      supabase,
      validation.data
    );

    if (!result.success) {
      return { success: false, error: result.error || "No se pudo moderar el local." };
    }

    revalidatePath("/admin/establishments");
    revalidatePath("/explorar");
    return {
      success: true,
      message: `El establecimiento ha sido actualizado a estado: ${validation.data.status}`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
