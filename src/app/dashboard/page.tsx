import * as React from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthService } from "@/modules/auth/services/auth.service";
import { RoleSwitcher } from "@/modules/auth/components/role-switcher";
import { logoutUserAction } from "@/modules/auth/actions/logout.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, LogOut, Lock } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-indigo-600">LOKEATE</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              Panel de Control
            </span>
          </div>

          <div className="flex items-center gap-4">
            {profile && <RoleSwitcher profile={profile} />}

            <form action={logoutUserAction}>
              <Button variant="ghost" size="sm" type="submit" className="text-slate-600 hover:text-red-600">
                <LogOut className="w-4 h-4 mr-1.5" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bienvenido, {profile ? `${profile.first_name} ${profile.last_name}` : user.email}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona tus solicitudes de eventos, espacios favoritos y cotizaciones con RealPrice.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Perfil Público General */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Identidad Pública
              </CardTitle>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                {profile?.role || "CLIENT"}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="text-sm">
                <span className="text-slate-500">Nombres y Apellidos:</span>{" "}
                <span className="font-medium text-slate-900">
                  {profile ? `${profile.first_name} ${profile.last_name}` : "No configurado"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Estado de Anfitrión:</span>{" "}
                <span className="font-medium text-slate-900">
                  {profile?.is_host_active ? "Activo (Habilitado)" : "Inactivo (Solo Cliente)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                Esta información básica es la única visible para otros miembros de la comunidad LOKEATE.
              </p>
            </CardContent>
          </Card>

          {/* Card: Datos Personales Confidenciales (Aislados por RLS) */}
          <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                Datos Personales Segregados (Confidencial)
              </CardTitle>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ley N° 29733
              </span>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div className="text-sm">
                <span className="text-slate-500">Documento Oficial:</span>{" "}
                <span className="font-mono font-medium text-slate-900">
                  {privateDetails
                    ? `${privateDetails.document_type}: ${privateDetails.document_number}`
                    : "No asignado"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Teléfono Privado:</span>{" "}
                <span className="font-mono font-medium text-slate-900">
                  {privateDetails?.phone ? `+51 ${privateDetails.phone}` : "No registrado"}
                </span>
              </div>
              <p className="text-xs text-slate-600 border-t border-indigo-100/60 pt-2">
                <strong>Aislamiento de seguridad:</strong> Ningún otro usuario, anfitrión o cliente puede consultar estos datos desde PostgREST. Solo tú y el Superadministrador tienen acceso por RLS.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
