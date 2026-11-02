import * as React from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstablishmentService } from "@/modules/establishments/services/establishment.service";
import { EstablishmentCard } from "@/modules/establishments/components/establishment-card";
import { PinterestGallery } from "@/modules/search/components/pinterest-gallery";
import { INITIAL_VENUES } from "@/modules/search/data/sample-venues";
import { Search, Sparkles, Building2, Plus, User } from "lucide-react";

export const metadata = {
  title: "Explorar Establecimientos | LOKEATE",
  description: "Descubre locales y espacios verificados para eventos en Lima y zonas campestres de Perú.",
};

export default async function ExplorarPage() {
  const supabase = await createServerSupabaseClient();
  const establishments = await EstablishmentService.getPublicEstablishments(supabase);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between">
      {/* Header Estilo Lokeate */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e9ebe7]">
        <div className="max-w-[1530px] mx-auto px-4 sm:px-9 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#e35b44] text-white flex items-center justify-center font-black text-lg shadow-sm -rotate-6 group-hover:rotate-0 transition-transform">
              <span className="rotate-6 group-hover:rotate-0 transition-transform text-sm">⌂</span>
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tighter text-[#20231f]">
              LOKEATE<span className="text-[#e35b44]">.</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              BETA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-xs font-bold text-slate-700 hover:text-[#e35b44] px-3 py-1.5 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/host/establishments/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#e35b44] text-white hover:bg-[#cf4832] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publicar Local</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-9 py-6 space-y-8">
        {/* Banner de Zonas de Lanzamiento */}
        <div className="p-6 sm:p-8 bg-[#24362d] text-white rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Fase Beta — Zonas de Lanzamiento Habilitadas</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight">
            Catálogo Oficial de Locales para Eventos en Perú
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
            Locales aprobados por moderación con geolocalización referencial (~500m) y cálculo transparente de tarifas con RealPrice.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-200 font-medium">Distritos activos:</span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold">Pachacámac</span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold">Cieneguilla</span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold">Miraflores</span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold">Barranco</span>
            <span className="px-2.5 py-1 rounded-full bg-white/15 font-semibold">San Isidro</span>
          </div>
        </div>

        {/* Sección de Locales Verificados */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-extrabold text-[#20231f] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#e35b44]" />
              <span>Locales Publicados y Verificados</span>
            </h2>
            <span className="text-xs text-[#7d817c]">
              Fotografía destacada y disponibilidad en tiempo real
            </span>
          </div>

          {establishments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {establishments.map((est) => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>
          )}

          {/* Galería Visual Pinterest con las imágenes más resaltantes */}
          <div className="pt-2">
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
              {INITIAL_VENUES.map((venue) => (
                <Link
                  key={venue.id}
                  href="/"
                  className="group block w-full mb-5 cursor-pointer break-inside-avoid select-none rounded-2xl"
                >
                  <div
                    className="relative w-full overflow-hidden rounded-2xl bg-[#e5e9e5] shadow-sm transition-shadow group-hover:shadow-md"
                    style={{
                      aspectRatio: venue.aspectRatio ? `${1 / venue.aspectRatio}` : "4/3",
                    }}
                  >
                    <img
                      src={venue.image}
                      alt={venue.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />
                    {venue.badge && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[#20231f] text-[10px] font-black tracking-wide shadow-sm">
                        {venue.badge}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-[#1c2420]/80 text-white text-[10px] font-bold backdrop-blur-md">
                      Hasta {venue.capacity} personas
                    </div>
                  </div>
                  <div className="pt-2.5 px-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-extrabold text-sm text-[#20231f] group-hover:text-[#e35b44] transition-colors line-clamp-1">
                        {venue.name}
                      </h3>
                      <span className="text-xs font-bold text-[#20231f]">
                        ★ {venue.rating.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-[#818680] mt-0.5 line-clamp-1">
                      {venue.location} · {venue.category}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1 text-xs">
                      <span className="font-heading font-extrabold text-sm text-[#20231f]">
                        S/ {venue.price.toLocaleString("es-PE")}
                      </span>
                      <span className="text-[#8c918a] text-[11px]">/ evento desde</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#e9ebe7] py-6 px-4 sm:px-9 bg-white text-xs text-[#8a8e88] text-center">
        © 2026 LOKEATE · Todos los derechos reservados. Locales para eventos en Lima y provincias de Perú.
      </footer>
    </div>
  );
}
