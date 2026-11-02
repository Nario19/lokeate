"use client";

import * as React from "react";
import { X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { CATEGORIES_CONFIG } from "../data/sample-venues";
import type { VenueCategory } from "../types/venue-pinterest.types";

interface PinterestFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxPrice: number;
  onMaxPriceChange: (val: number) => void;
  activeCategory: VenueCategory;
  onSelectCategory: (cat: VenueCategory) => void;
  onReset: () => void;
  onApply: () => void;
}

export function PinterestFiltersModal({
  isOpen,
  onClose,
  maxPrice,
  onMaxPriceChange,
  activeCategory,
  onSelectCategory,
  onReset,
  onApply,
}: PinterestFiltersModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#e9ebe7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#e35b44]" />
            <h2 className="font-heading font-extrabold text-lg text-[#20231f]">
              Personaliza tu búsqueda
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Slider de Presupuesto */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold uppercase tracking-wider text-[#20231f]">
                Presupuesto máximo por evento
              </span>
              <span className="font-heading font-black text-sm text-[#e35b44]">
                S/ {maxPrice.toLocaleString("es-PE")}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={10000}
              step={100}
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              className="w-full accent-[#e35b44] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>S/ 500</span>
              <span>S/ 5,000</span>
              <span>S/ 10,000+</span>
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#20231f]">
              Tipo de espacio
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_CONFIG.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectCategory(label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    activeCategory === label
                      ? "bg-[#24362d] text-white border-[#24362d]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f6f7f4] text-xs text-[#7d817c] leading-relaxed">
            La fecha y la cantidad de invitados se pueden refinar en la barra de búsqueda superior. Los precios mostrados reflejan tarifas base verificadas con anfitriones.
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-[#e35b44] hover:bg-[#cf4832] text-white text-xs font-bold transition-colors shadow-sm"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
