import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { EstablishmentCard } from "@/modules/establishments/components/establishment-card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, ShieldAlert } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Mis Establecimientos
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Locales y quintas registradas para eventos en el Perú.
            </p>
          </div>

          <Link href="/host/establishments/new">
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Registrar Nuevo Local
            </Button>
          </Link>
        </div>

        {/* Banner de flujo de moderación */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              Política de Moderación y Publicación Segura:
            </p>
            <p className="text-slate-700 leading-relaxed">
              Los nuevos locales inician en estado <strong>Borrador</strong>. Para publicarse en el marketplace deben ser enviados a revisión y formalmente aprobados por la administración de LOKEATE (error 42501 si un anfitrión intenta autoaprobarse).
            </p>
          </div>
        </div>

        {establishments.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                Aún no tienes establecimientos registrados
              </h3>
              <p className="text-xs text-slate-500">
                Publica tu primer local para comenzar a recibir solicitudes de eventos con RealPrice.
              </p>
            </div>
            <Link href="/host/establishments/new">
              <Button size="sm" className="mt-2">
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar Local Ahora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {establishments.map((est) => (
              <EstablishmentCard key={est.id} establishment={est} isHostView={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
