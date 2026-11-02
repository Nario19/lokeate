"use client";

import * as React from "react";
import { SlidersHorizontal, Columns2 } from "lucide-react";

interface PinterestHeroProps {
  onOpenFilters: () => void;
  compareMode: boolean;
  onToggleCompare: () => void;
}

export function PinterestHero({
  onOpenFilters,
  compareMode,
  onToggleCompare,
}: PinterestHeroProps) {
  return (
    <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-6 pb-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#e35b44]">
          ESPACIOS EXTRAORDINARIOS, MOMENTOS INOLVIDABLES
        </p>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-[#20231f] mt-1.5 mb-2 leading-[1.12]">
          El lugar perfecto <br className="hidden sm:inline" />
          para <span className="italic font-normal text-[#e35b44]">tu gran momento.</span>
        </h1>
        <p className="text-sm text-[#7d817c] max-w-xl">
          Explora quintas campestres, terrazas panorámicas y salones en Lima. Conoce el costo total con <strong className="text-[#20231f] font-bold">RealPrice Transparente</strong> antes de reservar.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 pt-2 sm:pt-0">
        <button
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-white border border-[#e9ebe7] text-[#20231f] hover:bg-[#f6f6f3] shadow-sm transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
          <span>Filtros avanzados</span>
        </button>

        <button
          onClick={onToggleCompare}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border shadow-sm transition-colors ${
            compareMode
              ? "bg-[#24362d] border-[#24362d] text-white"
              : "bg-white border-[#e9ebe7] text-[#20231f] hover:bg-[#f6f6f3]"
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>{compareMode ? "Comparación activa" : "Comparar"}</span>
        </button>
      </div>
    </section>
  );
}
