import * as React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateSpaceForm } from "@/modules/spaces/components/create-space-form";
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          href={`/host/establishments/${establishmentId}`}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a {establishment.name}
        </Link>

        <CreateSpaceForm establishmentId={establishmentId} />
      </div>
    </div>
  );
}
