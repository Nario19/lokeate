"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createEstablishmentSchema,
  type CreateEstablishmentInput,
} from "../schemas/establishment.schemas";
import { EstablishmentService } from "../services/establishment.service";
import type { ActionResponse } from "@/modules/auth/types/auth.types";
import type { Establishment } from "../types/establishment.types";

export async function createEstablishmentAction(
  rawInput: CreateEstablishmentInput
): Promise<ActionResponse<Establishment>> {
  // 1. Validar esquema Zod en el servidor
  const validation = createEstablishmentSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos del establecimiento inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para registrar un establecimiento." };
    }

    const result = await EstablishmentService.createEstablishment(
      supabase,
      validation.data,
      user.id
    );

    if (!result.success || !result.establishment) {
      return {
        success: false,
        error: result.error || "No se pudo crear el establecimiento.",
      };
    }

    revalidatePath("/host/establishments");
    return {
      success: true,
      message: "Establecimiento registrado con éxito en estado Borrador.",
      data: result.establishment,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
