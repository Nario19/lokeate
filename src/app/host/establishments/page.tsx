import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { EstablishmentCard } from "@/modules/establishments/components/establishment-card";
import { BrandLogo, LokeateNotice } from "@/components/lokeate-ui";
import { Plus, Building2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mis Establecimientos | LOKEATE",
  description: "Administra tus locales, revisa su estado de moderación y añade nuevos espacios.",
};

export default async function HostEstablishmentsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/host/establishments");
  }

  const establishments = await EstablishmentService.getEstablishmentsByHost(
    supabase,
    user.id
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      {/* Header Fijo */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-[1530px] mx-auto px-4 sm:px-9 h-[72px] flex items-center justify-between">
          <BrandLogo />

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-[#e35b44] hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Mi Panel</span>
            </Link>

            <Link
              href="/host/establishments/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#e35b44] text-white hover:bg-[#cf4832] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publicar Nuevo Local</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-9 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#e35b44]">
              PANEL DE ANFITRIÓN
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[#20231f] mt-1">
              Mis Establecimientos ({establishments.length})
            </h1>
            <p className="text-xs text-[#7d817c] mt-0.5">
              Administra tus locales, revisa su estado de moderación y configura sus espacios y planes tarifarios.
            </p>
          </div>

          <Link
            href="/host/establishments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#24362d] text-white hover:bg-[#1a2922] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Añadir Establecimiento</span>
          </Link>
        </div>

        {/* Banner de flujo de moderación */}
        <LokeateNotice type="realprice" title="Política de Moderación y Publicación Segura">
          Los nuevos locales inician en estado <strong>Borrador</strong>. Para publicarse en el marketplace deben ser enviados a revisión y formalmente aprobados por la administración de LOKEATE (los anfitriones no pueden autoaprobarse).
        </LokeateNotice>

        {establishments.length === 0 ? (
          <div className="p-16 text-center bg-white border border-[#e9ebe7] rounded-3xl shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#f6f7f4] text-[#24362d] mx-auto flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-[#20231f]">
                Aún no tienes establecimientos registrados
              </h3>
              <p className="text-xs text-[#7d817c] leading-relaxed">
                Publica tu primer local para comenzar a recibir solicitudes de eventos con transparencia RealPrice.
              </p>
            </div>
            <Link
              href="/host/establishments/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#e35b44] text-white text-xs font-bold hover:bg-[#cf4832] transition-colors shadow-sm mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Local Ahora</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {establishments.map((est) => (
              <EstablishmentCard key={est.id} establishment={est} isHostView={true} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#e9ebe7] py-6 px-4 sm:px-9 bg-white text-xs text-[#8a8e88] text-center">
        © 2026 LOKEATE · Todos los derechos reservados.
      </footer>
    </div>
  );
}
