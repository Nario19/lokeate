import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { CreateEstablishmentForm } from "@/modules/establishments/components/create-establishment-form";
import { BrandLogo } from "@/components/lokeate-ui";
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
        ubigeo_code: "150104",
        province_code: "1501",
        name: "Barranco",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
      {
        ubigeo_code: "150131",
        province_code: "1501",
        name: "San Isidro",
        is_launch_zone: true,
        launch_phase: "PHASE_BETA_LIMA",
      },
    ];
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      {/* Header Fijo */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-[1530px] mx-auto px-4 sm:px-9 h-[72px] flex items-center justify-between">
          <BrandLogo />

          <Link
            href="/host/establishments"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-[#e35b44] hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Mis Establecimientos</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#e35b44]">
            ALTA DE PROPIEDAD
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20231f] mt-1">
            Registrar Nuevo Establecimiento
          </h1>
          <p className="text-xs text-[#7d817c] mt-0.5">
            Publica tu local en la plataforma. Tu dirección exacta estará segregada y protegida por la Ley N° 29733.
          </p>
        </div>

        <CreateEstablishmentForm districts={districts} />
      </main>

      <footer className="border-t border-[#e9ebe7] py-6 px-4 sm:px-9 bg-white text-xs text-[#8a8e88] text-center">
        © 2026 LOKEATE · Todos los derechos reservados.
      </footer>
    </div>
  );
}
