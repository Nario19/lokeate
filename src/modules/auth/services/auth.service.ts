import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RegisterInput, LoginInput } from "../schemas/auth.schemas";
import type { UserProfile, UserPrivateDetails } from "../types/auth.types";

/**
 * Servicio de Autenticación y Gestión de Perfiles
 */
export class AuthService {
  /**
   * Registro de un nuevo usuario con perfil público y detalles confidenciales segregados.
   */
  static async signUp(
    supabase: SupabaseClient<Database>,
    input: RegisterInput,
    emailRedirectTo?: string
  ) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          document_type: input.documentType,
          document_number: input.documentNumber,
          phone: input.phone,
        },
      },
    });

    if (authError) {
      return { success: false, error: authError.message, user: null };
    }

    if (!authData.user) {
      return { success: false, error: "No se pudo registrar el usuario.", user: null };
    }

    const userId = authData.user.id;

    // Inserción directa / idempotente por si el trigger de base de datos no está activo
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        first_name: input.firstName,
        last_name: input.lastName,
        role: "CLIENT",
        is_host_active: false,
      })
      .select()
      .single();

    if (profileError) {
      // Ignoramos si ya existe por el trigger
      console.warn("Perfil público ya registrado o gestionado por trigger:", profileError.message);
    }

    const { error: privateError } = await supabase
      .from("profile_private_details")
      .upsert({
        user_id: userId,
        document_type: input.documentType,
        document_number: input.documentNumber,
        phone: input.phone,
        email: input.email,
      })
      .select()
      .single();

    if (privateError) {
      console.warn("Detalles privados ya registrados o gestionados por trigger:", privateError.message);
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  }

  /**
   * Inicio de sesión con correo y contraseña.
   */
  static async signIn(supabase: SupabaseClient<Database>, input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return { success: false, error: error.message, session: null };
    }

    return { success: true, session: data.session, user: data.user };
  }

  /**
   * Cierre de sesión.
   */
  static async signOut(supabase: SupabaseClient<Database>) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Obtiene el perfil público del usuario autenticado actual.
   */
  static async getCurrentProfile(
    supabase: SupabaseClient<Database>
  ): Promise<UserProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;

    return data as UserProfile;
  }

  /**
   * Obtiene los detalles privados (DNI, teléfono) del usuario autenticado actual.
   * RLS garantiza que solo el titular o el Superadmin pueden leer este registro.
   */
  static async getCurrentPrivateDetails(
    supabase: SupabaseClient<Database>
  ): Promise<UserPrivateDetails | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profile_private_details")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;

    return data as UserPrivateDetails;
  }

  /**
   * Solicita el restablecimiento de contraseña vía correo.
   */
  static async requestPasswordReset(
    supabase: SupabaseClient<Database>,
    email: string,
    redirectTo?: string
  ) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Actualiza la contraseña del usuario con sesión activa.
   */
  static async updatePassword(
    supabase: SupabaseClient<Database>,
    newPassword: string
  ) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}
