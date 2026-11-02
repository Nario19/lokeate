import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SpaceService } from "@/modules/spaces/services/space.service";
import { EstablishmentStatusBadge } from "@/modules/establishments/components/establishment-status-badge";
import { SpacePricingPlanCard } from "@/modules/spaces/components/space-pricing-plan-card";
import { submitForReviewAction } from "@/modules/establishments/actions/submit-review.action";
import {
  BrandLogo,
  LokeateButton,
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateNotice,
} from "@/components/lokeate-ui";
import {
  ArrowLeft,
  Plus,
  Users,
  Maximize2,
  SendHorizontal,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#f6f7f4]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" />
            <span className="hidden sm:inline-block h-4 w-px bg-[#e9ebe7]" />
            <Link
              href="/host/establishments"
              className="inline-flex items-center text-xs font-bold text-[#7d817c] hover:text-[#20231f] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Mis Locales
            </Link>
          </div>

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
                <LokeateButton size="sm" variant="primary" type="submit">
                  <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  Enviar a Revisión
                </LokeateButton>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Encabezado del Local */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e9ebe7] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#24362d]/10 text-[#24362d]">
                  <Building2 className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#7d817c]">
                  Establecimiento Anfitrión
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#20231f] tracking-tight">
                {estData.name}
              </h1>
              <p className="text-xs text-[#7d817c] max-w-2xl leading-relaxed">
                {estData.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/host/establishments/${establishmentId}/spaces/new`}>
                <LokeateButton size="sm" variant="primary">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Añadir Espacio
                </LokeateButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Listado de Espacios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#20231f] tracking-tight">
                Espacios Individuales y Áreas ({spaces.length})
              </h2>
              <p className="text-xs text-[#7d817c]">
                Cada espacio cuenta con su propio aforo, buffers de montaje y planes tarifarios independientes.
              </p>
            </div>
          </div>

          {spacesWithPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#e1e4df] space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f6f7f4] flex items-center justify-center text-[#7d817c]">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#20231f]">
                  Este establecimiento aún no tiene espacios configurados
                </h3>
                <p className="text-xs text-[#7d817c] max-w-md mx-auto">
                  Agrega salones, terrazas, jardines o configura la opción de alquiler de la propiedad completa.
                </p>
              </div>
              <Link href={`/host/establishments/${establishmentId}/spaces/new`}>
                <LokeateButton size="sm" variant="primary">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Crear el Primer Espacio
                </LokeateButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {spacesWithPlans.map((space) => (
                <LokeateCard key={space.id} className="overflow-hidden">
                  <LokeateCardHeader className="bg-[#fafbf9] border-b border-[#e9ebe7]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-[#20231f]">
                            {space.name}
                          </h3>
                          {space.is_entire_establishment && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#24362d] text-white tracking-wider">
                              PROPIEDAD COMPLETA
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7d817c] mt-1">
                          {space.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-[#7d817c]">
                        <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#e9ebe7]">
                          <Maximize2 className="w-3.5 h-3.5 text-[#24362d]" />
                          {space.area_m2} m²
                        </span>
                        <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#e9ebe7]">
                          <Users className="w-3.5 h-3.5 text-[#24362d]" />
                          {space.standing_capacity} pie / {space.seated_capacity} sentados
                        </span>
                      </div>
                    </div>
                  </LokeateCardHeader>

                  <LokeateCardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#20231f]">
                        Planes Tarifarios Configurados ({space.plans.length})
                      </h4>
                      <Link href={`/host/spaces/${space.id}/plans/new?establishmentId=${establishmentId}`}>
                        <LokeateButton size="sm" variant="outline">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Añadir Plan de Precios
                        </LokeateButton>
                      </Link>
                    </div>

                    {space.plans.length === 0 ? (
                      <p className="text-xs text-[#7d817c] italic py-2">
                        Sin planes de precio activos. Añade al menos uno para habilitar cotizaciones públicas.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {space.plans.map((plan) => (
                          <SpacePricingPlanCard key={plan.id} plan={plan} />
                        ))}
                      </div>
                    )}
                  </LokeateCardContent>
                </LokeateCard>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
