"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  requestPasswordResetSchema,
  updatePasswordSchema,
  type RequestPasswordResetInput,
  type UpdatePasswordInput,
} from "../schemas/auth.schemas";
import { AuthService } from "../services/auth.service";
import type { ActionResponse } from "../types/auth.types";

export async function requestPasswordResetAction(
  rawInput: RequestPasswordResetInput
): Promise<ActionResponse> {
  const validation = requestPasswordResetSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Correo inválido.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await AuthService.requestPasswordReset(supabase, validation.data.email);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "No se pudo procesar la solicitud de recuperación.",
      };
    }

    return {
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}

export async function updatePasswordAction(
  rawInput: UpdatePasswordInput
): Promise<ActionResponse> {
  const validation = updatePasswordSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Contraseña inválida.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await AuthService.updatePassword(supabase, validation.data.password);

    if (!result.success) {
      return {
        success: false,
        error: result.error || "No se pudo actualizar la contraseña.",
      };
    }

    return {
      success: true,
      message: "Contraseña actualizada exitosamente.",
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
