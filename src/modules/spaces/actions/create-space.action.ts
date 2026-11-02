"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSpaceSchema, type CreateSpaceInput } from "../schemas/space.schemas";
import { SpaceService } from "../services/space.service";
import type { ActionResponse } from "@/modules/auth/types/auth.types";
import type { Space } from "../types/space.types";

export async function createSpaceAction(
  rawInput: CreateSpaceInput
): Promise<ActionResponse<Space>> {
  const validation = createSpaceSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos del espacio inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para crear espacios." };
    }

    const result = await SpaceService.createSpace(
      supabase,
      validation.data,
      user.id
    );

    if (!result.success || !result.space) {
      return { success: false, error: result.error || "No se pudo registrar el espacio." };
    }

    revalidatePath(`/host/establishments/${validation.data.establishmentId}`);
    return {
      success: true,
      message: "Espacio registrado con éxito.",
      data: result.space,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
