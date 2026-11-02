"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createPricingPlanSchema,
  type CreatePricingPlanInput,
} from "../schemas/space.schemas";
import { SpaceService } from "../services/space.service";
import type { ActionResponse } from "@/modules/auth/types/auth.types";
import type { SpacePricingPlan } from "../types/space.types";

export async function createPricingPlanAction(
  rawInput: CreatePricingPlanInput
): Promise<ActionResponse<SpacePricingPlan>> {
  const validation = createPricingPlanSchema.safeParse(rawInput);
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos del plan tarifario inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para configurar planes de precios." };
    }

    const result = await SpaceService.createPricingPlan(
      supabase,
      validation.data,
      user.id
    );

    if (!result.success || !result.plan) {
      return { success: false, error: result.error || "No se pudo registrar el plan tarifario." };
    }

    revalidatePath(`/host/spaces/${validation.data.spaceId}`);
    return {
      success: true,
      message: "Plan tarifario configurado con éxito.",
      data: result.plan,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error inesperado en el servidor.";
    return { success: false, error: errorMessage };
  }
}
