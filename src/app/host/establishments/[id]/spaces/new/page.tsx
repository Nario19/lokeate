import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateSpaceForm } from "@/modules/spaces/components/create-space-form";
import { BrandLogo } from "@/components/lokeate-ui";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Añadir Espacio | LOKEATE",
  description: "Configura un nuevo espacio o área para eventos en tu establecimiento.",
};

export default async function NewSpacePage({
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
    redirect(`/auth/login?next=/host/establishments/${establishmentId}/spaces/new`);
  }

  const { data: establishment, error } = await supabase
    .from("establishments")
    .select("id, name, host_id")
    .eq("id", establishmentId)
    .single();

  if (error || !establishment) {
    notFound();
  }

  if (establishment.host_id !== user.id) {
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <CreateSpaceForm establishmentId={establishmentId} />
      </main>
    </div>
  );
}
