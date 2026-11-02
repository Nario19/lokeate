import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { AuthService } from "../services/auth.service";
import type { RegisterInput, LoginInput } from "../schemas/auth.schemas";

describe("Sprint 02: AuthService Unit Tests", () => {
  const mockRegisterInput: RegisterInput = {
    firstName: "Mario",
    lastName: "Vargas",
    documentType: "DNI",
    documentNumber: "10293847",
    phone: "987123456",
    email: "mario@example.com",
    password: "Password123",
    confirmPassword: "Password123",
    termsAccepted: true,
  };

  it("registra un usuario y hace upsert de su perfil público y detalles privados", async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: { id: "user-test-id", email: "mario@example.com" },
            session: null,
          },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await AuthService.signUp(mockSupabase, mockRegisterInput);

    expect(result.success).toBe(true);
    expect(result.user?.id).toBe("user-test-id");
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "mario@example.com",
      password: "Password123",
      options: {
        emailRedirectTo: undefined,
        data: {
          first_name: "Mario",
          last_name: "Vargas",
          document_type: "DNI",
          document_number: "10293847",
          phone: "987123456",
        },
      },
    });
    // Verifica que se llamó para profiles y profile_private_details
    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(mockSupabase.from).toHaveBeenCalledWith("profile_private_details");
  });

  it("maneja errores devueltos por el proveedor de autenticación", async () => {
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "User already registered" },
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await AuthService.signUp(mockSupabase, mockRegisterInput);
    expect(result.success).toBe(false);
    expect(result.error).toBe("User already registered");
  });

  it("inicia sesión correctamente con correo y contraseña", async () => {
    const mockLoginInput: LoginInput = {
      email: "mario@example.com",
      password: "Password123",
    };

    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: { access_token: "jwt-token" },
            user: { id: "user-test-id" },
          },
          error: null,
        }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await AuthService.signIn(mockSupabase, mockLoginInput);
    expect(result.success).toBe(true);
    expect(result.session).not.toBeNull();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "mario@example.com",
      password: "Password123",
    });
  });

  it("cierra sesión mediante signOut", async () => {
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    } as unknown as SupabaseClient<Database>;

    const result = await AuthService.signOut(mockSupabase);
    expect(result.success).toBe(true);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
