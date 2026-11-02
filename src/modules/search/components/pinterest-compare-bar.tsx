"use client";

import * as React from "react";
import { X, Columns2, Star, Users, ArrowRight } from "lucide-react";
import type { PinterestVenue } from "../types/venue-pinterest.types";

interface PinterestCompareBarProps {
  comparedVenues: PinterestVenue[];
  onOpenCompareModal: () => void;
  onClearCompare: () => void;
}

export function PinterestCompareBar({
  comparedVenues,
  onOpenCompareModal,
  onClearCompare,
}: PinterestCompareBarProps) {
  if (comparedVenues.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#24362d] text-white px-5 py-2.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] text-xs font-bold animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <Columns2 className="w-4 h-4 text-emerald-400" />
        <span>{comparedVenues.length}/3 espacios seleccionados</span>
      </div>

      <button
        onClick={onOpenCompareModal}
        className="px-4 py-1.5 rounded-full bg-white text-[#24362d] font-extrabold hover:bg-slate-100 transition-colors shadow-sm"
      >
        Comparar ahora
      </button>

      <button
        onClick={onClearCompare}
        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-slate-300 hover:text-white"
        aria-label="Cerrar comparación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface PinterestCompareModalProps {
  venues: PinterestVenue[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVenue: (venue: PinterestVenue) => void;
}

export function PinterestCompareModal({
  venues,
  isOpen,
  onClose,
  onSelectVenue,
}: PinterestCompareModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e9ebe7] px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-xl text-[#20231f]">
            Compara tus espacios favoritos
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="border border-[#e9ebe7] rounded-2xl p-4 space-y-3 bg-[#fdfdfd] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                    {venue.badge && (
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-black text-[#20231f]">
                        {venue.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-[#20231f]">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-[#7d817c]">{venue.location}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-extrabold text-base text-[#20231f]">
                      S/ {venue.price.toLocaleString("es-PE")}
                    </span>
                    <span className="text-[11px] text-[#7d817c]">/ evento desde</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#626860] pt-2 border-t border-[#e9ebe7]">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{venue.rating.toFixed(2)} estrellas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hasta {venue.capacity} invitados</span>
                    </div>
                    <div className="text-[11px] text-[#7d817c]">
                      Categoría: <strong>{venue.category}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e9ebe7]">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                      Servicios
                    </p>
                    <ul className="text-xs space-y-1 text-slate-600">
                      {venue.features.slice(0, 3).map((feat) => (
                        <li key={feat} className="line-clamp-1">
                          ✓ {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSelectVenue(venue);
                  }}
                  className="w-full mt-4 py-2.5 px-3 rounded-xl bg-[#24362d] hover:bg-[#1a2922] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Ver detalles y cotizar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
