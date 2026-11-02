"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "../schemas/auth.schemas";
import { AuthService } from "../services/auth.service";
import type { ActionResponse } from "../types/auth.types";

export async function registerUserAction(
  rawInput: RegisterInput
): Promise<ActionResponse<{ userId: string }>> {
  // 1. Validación estricta en el servidor con Zod
  const validation = registerSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos de registro inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await AuthService.signUp(supabase, validation.data);

    if (!result.success || !result.user) {
      return {
        success: false,
        error: result.error || "No se pudo completar el registro.",
      };
    }

    // Si opera en modo local/demo sin Supabase online, guardamos la sesión en cookies
    if (result.isLocalDemo && result.user) {
      const cookieStore = await cookies();
      cookieStore.set("lokeate_local_user", JSON.stringify(result.user), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    }

    return {
      success: true,
      message: "¡Cuenta creada con éxito! Redirigiendo...",
      data: { userId: result.user.id },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
