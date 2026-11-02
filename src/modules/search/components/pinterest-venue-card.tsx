"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Star, Users, Check } from "lucide-react";
import type { PinterestVenue } from "../types/venue-pinterest.types";

interface PinterestVenueCardProps {
  venue: PinterestVenue;
  isFavorite: boolean;
  onToggleFavorite: (id: number | string) => void;
  onClick: (venue: PinterestVenue) => void;
  compareMode: boolean;
  isCompared: boolean;
  onToggleCompare: (id: number | string) => void;
}

export function PinterestVenueCard({
  venue,
  isFavorite,
  onToggleFavorite,
  onClick,
  compareMode,
  isCompared,
  onToggleCompare,
}: PinterestVenueCardProps) {
  const formattedPrice = `S/ ${venue.price.toLocaleString("es-PE")}`;

  return (
    <article
      onClick={() => onClick(venue)}
      className="group block w-full mb-5 cursor-pointer break-inside-avoid select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e35b44] rounded-2xl"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(venue);
        }
      }}
    >
      {/* Contenedor de la Imagen — El elemento más resaltante */}
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

        {/* Gradiente sutil inferior para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badge Flotante Superior Izquierdo */}
        {venue.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[#20231f] text-[10px] font-black tracking-wide shadow-sm backdrop-blur-sm">
            {venue.badge}
          </span>
        )}

        {/* Botón Flotante de Favorito Superior Derecho */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(venue.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm backdrop-blur-sm ${
            isFavorite
              ? "bg-white text-[#e35b44]"
              : "bg-white/80 text-slate-700 hover:bg-white"
          }`}
          aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-[#e35b44] text-[#e35b44]" : ""}`} />
        </button>

        {/* Tag Flotante Inferior Izquierdo (Aforo / Capacidad) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1c2420]/80 text-white text-[10px] font-bold backdrop-blur-md">
          <Users className="w-3 h-3 text-white/80" />
          <span>Hasta {venue.capacity} personas</span>
        </div>
      </div>

      {/* Metadatos Claros y Elegantes */}
      <div className="pt-2.5 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-extrabold text-sm text-[#20231f] group-hover:text-[#e35b44] transition-colors line-clamp-1">
            {venue.name}
          </h3>
          <span className="flex items-center gap-1 text-xs font-bold text-[#20231f] flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {venue.rating.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-[#818680] mt-0.5 line-clamp-1">
          {venue.location} · {venue.category}
        </p>

        <div className="flex items-baseline gap-1 mt-1 text-xs">
          <span className="font-heading font-extrabold text-sm text-[#20231f]">
            {formattedPrice}
          </span>
          <span className="text-[#8c918a] text-[11px]">/ evento desde</span>
        </div>

        {/* Botón de Selección en Modo Comparar */}
        {compareMode && (
          <div className="mt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(venue.id);
              }}
              className={`w-full py-1.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isCompared
                  ? "bg-[#24362d] text-white"
                  : "bg-white border border-[#e4e7e0] text-[#20231f] hover:bg-slate-50"
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Seleccionado</span>
                </>
              ) : (
                <span>+ Comparar</span>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
