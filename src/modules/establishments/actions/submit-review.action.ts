"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "../services/establishment.service";
import type { ActionResponse } from "@/modules/auth/types/auth.types";

export async function submitForReviewAction(
  establishmentId: string
): Promise<ActionResponse> {
  if (!establishmentId) {
    return { success: false, error: "Identificador de local requerido." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesión no iniciada." };
    }

    const result = await EstablishmentService.submitForReview(
      supabase,
      establishmentId,
      user.id
    );

    if (!result.success) {
      return { success: false, error: result.error || "No se pudo enviar a revisión." };
    }

    revalidatePath("/host/establishments");
    return {
      success: true,
      message: "Establecimiento enviado a moderación. Será revisado por el equipo de administración.",
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
