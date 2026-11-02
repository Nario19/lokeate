import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { SpaceService } from "@/modules/spaces/services/space.service";
import { EstablishmentStatusBadge } from "@/modules/establishments/components/establishment-status-badge";
import { SpacePricingPlanCard } from "@/modules/spaces/components/space-pricing-plan-card";
import { submitForReviewAction } from "@/modules/establishments/actions/submit-review.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Plus, Users, Maximize2, ShieldCheck, SendHorizontal, Building2 } from "lucide-react";

export const metadata = {
  title: "Administrar Establecimiento | LOKEATE",
  description: "Gestiona los espacios y planes tarifarios de tu local para eventos.",
};

export default async function EstablishmentAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: establishmentId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/host/establishments/${establishmentId}`);
  }

  // Cargar establecimiento
  const { data: estData, error: estError } = await supabase
    .from("establishments")
    .select("*")
    .eq("id", establishmentId)
    .single();

  if (estError || !estData) {
    notFound();
  }

  // Verificar que el anfitrión sea el propietario
  if (estData.host_id !== user.id) {
    redirect("/host/establishments");
  }

  // Cargar espacios asociados
  const spaces = await SpaceService.getSpacesByEstablishment(supabase, establishmentId);

  // Cargar planes de cada espacio
  const spacesWithPlans = await Promise.all(
    spaces.map(async (sp) => {
      const plans = await SpaceService.getPricingPlansBySpace(supabase, sp.id);
      return { ...sp, plans };
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/host/establishments"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a Mis Establecimientos
          </Link>

          <div className="flex items-center gap-3">
            <EstablishmentStatusBadge
              status={estData.publishing_status}
              isActive={estData.is_active}
            />

            {(estData.publishing_status === "DRAFT" || estData.publishing_status === "REJECTED") && (
              <form
                action={async () => {
                  "use server";
                  await submitForReviewAction(establishmentId);
                }}
              >
                <Button size="sm" type="submit" className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                  <SendHorizontal className="w-4 h-4 mr-1.5" />
                  Enviar a Revisión
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Encabezado del Local */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">{estData.name}</h1>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            {estData.description}
          </p>
        </div>

        {/* Listado de Espacios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Espacios Individuales y Áreas ({spaces.length})
              </h2>
              <p className="text-xs text-slate-500">
                Cada espacio cuenta con su propio aforo, buffers de montaje y planes tarifarios independientes.
              </p>
            </div>

            <Link href={`/host/establishments/${establishmentId}/spaces/new`}>
              <Button size="sm" className="shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Añadir Espacio
              </Button>
            </Link>
          </div>

          {spacesWithPlans.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  Este establecimiento aún no tiene espacios configurados.
                </p>
                <Link href={`/host/establishments/${establishmentId}/spaces/new`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Crear el Primer Espacio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {spacesWithPlans.map((space) => (
                <Card key={space.id} className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold text-slate-900">
                            {space.name}
                          </CardTitle>
                          {space.is_entire_establishment && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                              Establecimiento Completo
                            </span>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {space.description}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                          {space.area_m2} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {space.standing_capacity} de pie / {space.seated_capacity} sentados
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Planes Tarifarios Configurados ({space.plans.length})
                      </h4>
                      <Link href={`/host/spaces/${space.id}/plans/new?establishmentId=${establishmentId}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Añadir Plan de Precios
                        </Button>
                      </Link>
                    </div>

                    {space.plans.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Sin planes de precio activos. Añade al menos uno para habilitar cotizaciones.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {space.plans.map((plan) => (
                          <SpacePricingPlanCard key={plan.id} plan={plan} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
