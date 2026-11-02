import * as React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { EstablishmentCard } from "@/modules/establishments/components/establishment-card";
import { Search, MapPin, Sparkles, Building2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Explorar Establecimientos | LOKEATE",
  description: "Descubre locales y espacios verificados para eventos en Lima y zonas campestres de Perú.",
};

export default async function ExplorarPage() {
  const supabase = await createServerSupabaseClient();
  const establishments = await EstablishmentService.getPublicEstablishments(supabase);
  const launchDistricts = await EstablishmentService.getLaunchDistricts(supabase);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">LOKEATE</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              BETA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/host/establishments/new"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Publicar Local
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
        {/* Banner de Zonas de Lanzamiento */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Fase Beta — Zonas de Lanzamiento Habilitadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Catálogo Oficial de Locales para Eventos en Perú
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Locales aprobados por moderación con geolocalización referencial (~500m) y cálculo transparente de tarifas con RealPrice.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-indigo-300 font-medium">Distritos activos:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono">Pachacámac</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono">Cieneguilla</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono">Miraflores</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono">Surco</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/15 font-mono">Lima Centro</span>
          </div>
        </div>

        {/* Listado de Locales Aprobados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Locales Publicados y Verificados ({establishments.length})
            </h2>
            <span className="text-xs text-slate-500">
              Solo locales con estado APROBADO por el Superadministrador
            </span>
          </div>

          {establishments.length === 0 ? (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  Próximamente nuevos locales disponibles
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Los anfitriones de Pachacámac, Cieneguilla y Miraflores están subiendo sus quintas y salones. Serán visibles tan pronto concluya su revisión de moderación.
                </p>
              </div>
              <Link
                href="/host/establishments/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm mt-2"
              >
                ¿Eres anfitrión? Publica tu local
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {establishments.map((est) => (
                <EstablishmentCard key={est.id} establishment={est} isHostView={false} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} LOKEATE Perú Marketplace. Todos los derechos reservados.</p>
        <p className="text-[11px] text-slate-400">
          Los comprobantes o resúmenes de LOKEATE no constituyen comprobantes de pago autorizados por SUNAT.
        </p>
      </footer>
    </div>
  );
}
