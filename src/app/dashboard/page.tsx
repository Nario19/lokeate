import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthService } from "@/modules/auth/services/auth.service";
import { RoleSwitcher } from "@/modules/auth/components/role-switcher";
import { logoutUserAction } from "@/modules/auth/actions/logout.action";
import {
  BrandLogo,
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateButton,
  LokeateNotice,
} from "@/components/lokeate-ui";
import { User, ShieldCheck, LogOut, Lock, Building2, Compass, Plus } from "lucide-react";

export const metadata = {
  title: "Mi Panel | LOKEATE",
  description: "Panel de control del usuario en LOKEATE",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const profile = await AuthService.getCurrentProfile(supabase);
  const privateDetails = await AuthService.getCurrentPrivateDetails(supabase);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : (user.user_metadata?.first_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
        : user.email?.split("@")[0] || "Usuario");

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      {/* Header Fijo */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-[1530px] mx-auto px-4 sm:px-9 h-[72px] flex items-center justify-between">
          <BrandLogo />

          <div className="flex items-center gap-3">
            {profile && <RoleSwitcher profile={profile} />}

            <form action={logoutUserAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-9 py-8 space-y-6">
        {/* Banner de Bienvenida */}
        <div className="p-6 sm:p-8 bg-[#24362d] text-white rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
              PANEL DE CONTROL
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              ¡Hola, {fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/70 mt-1 max-w-xl">
              Gestiona tus solicitudes de eventos, tus locales registrados y tus cotizaciones con RealPrice.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-[#24362d] text-xs font-bold hover:bg-slate-100 shadow-sm transition-colors"
            >
              <Compass className="w-4 h-4 text-[#e35b44]" />
              <span>Explorar Espacios</span>
            </Link>

            <Link
              href="/host/establishments"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#e35b44] text-white text-xs font-bold hover:bg-[#cf4832] shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Mis Locales</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Información Segregada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Perfil Público General */}
          <LokeateCard>
            <LokeateCardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#e9ebe7]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#e35b44]" />
                <h3 className="font-heading font-extrabold text-sm text-[#20231f]">
                  Identidad Pública
                </h3>
              </div>
              <span className="text-[10px] font-black tracking-wide px-2.5 py-0.5 rounded-full bg-slate-100 text-[#20231f]">
                {profile?.role || "CLIENT"}
              </span>
            </LokeateCardHeader>

            <LokeateCardContent className="space-y-3 pt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#7d817c]">Nombres y Apellidos:</span>
                <span className="font-bold text-[#20231f]">{fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#7d817c]">Estado de Anfitrión:</span>
                <span className="font-bold text-[#20231f]">
                  {profile?.is_host_active ? "Activo (Habilitado)" : "Inactivo (Modo Cliente)"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#7d817c]">Miembro desde:</span>
                <span className="text-slate-600">Fase Beta 2026</span>
              </div>

              <p className="text-[11px] text-[#7d817c] pt-2">
                Esta información básica es la única visible para otros miembros de la comunidad LOKEATE.
              </p>
            </LokeateCardContent>
          </LokeateCard>

          {/* Card: Datos Personales Confidenciales (Aislados por RLS) */}
          <LokeateCard>
            <LokeateCardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#e9ebe7]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-extrabold text-sm text-[#20231f]">
                  Datos Privados Confidenciales
                </h3>
              </div>
              <span className="text-[10px] font-black tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Ley N° 29733
              </span>
            </LokeateCardHeader>

            <LokeateCardContent className="space-y-3 pt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#7d817c]">Tipo y N° Documento:</span>
                <span className="font-mono font-bold text-[#20231f]">
                  {privateDetails?.document_type || "DNI"}:{" "}
                  {privateDetails?.document_number || user.user_metadata?.document_number || "••••••••"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#7d817c]">Teléfono de Contacto:</span>
                <span className="font-mono font-bold text-[#20231f]">
                  {privateDetails?.phone || user.user_metadata?.phone || "No configurado"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-[#7d817c]">Correo Electrónico:</span>
                <span className="font-mono text-[#20231f]">{user.email}</span>
              </div>

              <LokeateNotice type="privacy" className="mt-3">
                Tu DNI/RUC y teléfono nunca son expuestos públicamente ni mediante consultas directas a la base de datos.
              </LokeateNotice>
            </LokeateCardContent>
          </LokeateCard>
        </div>
      </main>

      <footer className="border-t border-[#e9ebe7] py-6 px-4 sm:px-9 bg-white text-xs text-[#8a8e88] text-center">
        © 2026 LOKEATE · Todos los derechos reservados.
      </footer>
    </div>
  );
}
