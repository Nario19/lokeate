"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "../schemas/auth.schemas";
import { AuthService } from "../services/auth.service";
import type { ActionResponse } from "../types/auth.types";

export async function loginUserAction(
  rawInput: LoginInput
): Promise<ActionResponse<{ userId: string }>> {
  // 1. Validación estricta en el servidor con Zod
  const validation = loginSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos de inicio de sesión inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const result = await AuthService.signIn(supabase, validation.data);

    if (!result.success || !result.user) {
      return {
        success: false,
        error: result.error || "Credenciales incorrectas o usuario no encontrado.",
      };
    }

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
      message: "Inicio de sesión exitoso.",
      data: { userId: result.user.id },
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
