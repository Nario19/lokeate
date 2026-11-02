import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreatePricingPlanForm } from "@/modules/spaces/components/create-pricing-plan-form";
import { BrandLogo } from "@/components/lokeate-ui";
import { ArrowLeft, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#f6f7f4]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" />
            <span className="hidden sm:inline-block h-4 w-px bg-[#e9ebe7]" />
            <Link
              href={`/host/establishments/${establishmentId}`}
              className="inline-flex items-center text-xs font-bold text-[#7d817c] hover:text-[#20231f] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Volver a {establishment.name}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-[#e9ebe7] shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e35b44]/10 text-[#e35b44] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#7d817c]">Espacio Seleccionado</p>
            <h2 className="text-base font-black text-[#20231f]">{space.name}</h2>
          </div>
        </div>

        <CreatePricingPlanForm spaceId={spaceId} establishmentId={establishmentId} />
      </main>
    </div>
  );
}
