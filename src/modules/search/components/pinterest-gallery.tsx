"use client";

import * as React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { PinterestVenueCard } from "./pinterest-venue-card";
import type { PinterestVenue } from "../types/venue-pinterest.types";

interface PinterestGalleryProps {
  venues: PinterestVenue[];
  favorites: (number | string)[];
  onToggleFavorite: (id: number | string) => void;
  onSelectVenue: (venue: PinterestVenue) => void;
  compareMode: boolean;
  comparedIds: (number | string)[];
  onToggleCompare: (id: number | string) => void;
  onResetFilters: () => void;
}

export function PinterestGallery({
  venues,
  favorites,
  onToggleFavorite,
  onSelectVenue,
  compareMode,
  comparedIds,
  onToggleCompare,
  onResetFilters,
}: PinterestGalleryProps) {
  if (venues.length === 0) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <SearchX className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-extrabold text-xl text-[#20231f]">
            No encontramos espacios con esos filtros
          </h2>
          <p className="text-xs text-[#7d817c] leading-relaxed">
            Prueba cambiando la ubicación, ajustando el presupuesto o la cantidad de invitados requerida.
          </p>
        </div>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border border-[#dfe2db] bg-white text-[#20231f] hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Limpiar filtros de búsqueda</span>
        </button>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 pt-2 pb-16">
      {venues.map((venue) => (
        <PinterestVenueCard
          key={venue.id}
          venue={venue}
          isFavorite={favorites.includes(venue.id)}
          onToggleFavorite={onToggleFavorite}
          onClick={onSelectVenue}
          compareMode={compareMode}
          isCompared={comparedIds.includes(venue.id)}
          onToggleCompare={onToggleCompare}
        />
      ))}
    </div>
  );
}
