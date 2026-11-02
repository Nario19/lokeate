import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreatePricingPlanForm } from "@/modules/spaces/components/create-pricing-plan-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Añadir Plan Tarifario | LOKEATE",
  description: "Configura una modalidad de precio y condiciones de reserva para tu espacio.",
};

export default async function NewPricingPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ establishmentId?: string }>;
}) {
  const { id: spaceId } = await params;
  const { establishmentId: queryEstablishmentId } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/host/spaces/${spaceId}/plans/new`);
  }

  // Cargar espacio
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, name, establishment_id")
    .eq("id", spaceId)
    .single();

  if (spaceError || !space) {
    notFound();
  }

  const establishmentId = space.establishment_id || queryEstablishmentId;
  if (!establishmentId) {
    notFound();
  }

  // Verificar propietario del establecimiento
  const { data: establishment, error: estError } = await supabase
    .from("establishments")
    .select("id, name, host_id")
    .eq("id", establishmentId)
    .single();

  if (estError || !establishment || establishment.host_id !== user.id) {
    redirect("/host/establishments");
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          href={`/host/establishments/${establishmentId}`}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a {establishment.name}
        </Link>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Espacio Seleccionado</p>
          <h2 className="text-lg font-bold text-slate-900">{space.name}</h2>
        </div>

        <CreatePricingPlanForm spaceId={spaceId} establishmentId={establishmentId} />
      </div>
    </div>
  );
}
