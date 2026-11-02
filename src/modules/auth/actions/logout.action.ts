"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthService } from "../services/auth.service";

export async function logoutUserAction(): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await AuthService.signOut(supabase);
  } catch (err: unknown) {
    console.error("Error al cerrar sesión:", err);
  }

  redirect("/auth/login");
}
