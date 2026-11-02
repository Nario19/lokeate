import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { CreateEstablishmentForm } from "@/modules/establishments/components/create-establishment-form";
import { ArrowLeft, Building2 } from "lucide-react";

export const metadata = {
  title: "Registrar Establecimiento | LOKEATE",
  description: "Da de alta tu local o espacio para eventos con protección física de ubicación.",
};

export default async function NewEstablishmentPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/host/establishments/new");
  }

  // Cargar distritos autorizados en la zona de lanzamiento
  let districts = await EstablishmentService.getLaunchDistricts(supabase);

  // Si la base de datos local aún no tiene sembradas las zonas de lanzamiento, proveer distritos por defecto
  if (!districts || districts.length === 0) {
    districts = [
      {
        ubigeo_code: "150123",
        province_code: "1501",
        name: "Pachacámac",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
      {
        ubigeo_code: "150109",
        province_code: "1501",
        name: "Cieneguilla",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
      {
        ubigeo_code: "150122",
        province_code: "1501",
        name: "Miraflores",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
      {
        ubigeo_code: "150140",
        province_code: "1501",
        name: "Santiago de Surco",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
      {
        ubigeo_code: "150101",
        province_code: "1501",
        name: "Lima (Cercado)",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/host/establishments"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a Mis Locales
          </Link>

          <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>Portal Anfitriones LOKEATE</span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Registrar Nuevo Establecimiento
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Define tu local con georreferenciación referencial y resguardo físico de dirección exacta conforme a Ley.
          </p>
        </div>

        <CreateEstablishmentForm districts={districts} />
      </div>
    </div>
  );
}
