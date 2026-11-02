"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Heart, Plus, User, Building2 } from "lucide-react";

interface PinterestHeaderProps {
  locationValue: string;
  onLocationChange: (val: string) => void;
  dateValue: string;
  onDateChange: (val: string) => void;
  guestsValue: number | "";
  onGuestsChange: (val: number | "") => void;
  onSearch: () => void;
  favoritesCount: number;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
}

export function PinterestHeader({
  locationValue,
  onLocationChange,
  dateValue,
  onDateChange,
  guestsValue,
  onGuestsChange,
  onSearch,
  favoritesCount,
  onlyFavorites,
  onToggleFavorites,
}: PinterestHeaderProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e9ebe7] transition-all">
      <div className="max-w-[1530px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-9 h-[74px]">
        {/* Brand Logo */}
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

        {/* Capsule Search Bar (Airbnb / Pinterest style) */}
        <div className="hidden md:flex items-center bg-white border border-[#e5e5e2] rounded-full shadow-[0_4px_18px_rgba(28,33,27,0.06)] pl-2 pr-1.5 py-1.5 max-w-[650px] w-full">
          {/* Ubicación */}
          <div className="flex-1 px-4 border-r border-[#e9e9e6]">
            <label className="block text-[10px] font-extrabold tracking-wider text-[#20231f] uppercase cursor-pointer">
              ¿Dónde?
            </label>
            <input
              type="text"
              value={locationValue}
              onChange={(e) => onLocationChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pachacámac, Miraflores..."
              className="w-full text-xs text-slate-700 placeholder:text-slate-400 bg-transparent outline-none truncate"
            />
          </div>

          {/* Fecha */}
          <div className="w-[140px] px-3 border-r border-[#e9e9e6]">
            <label className="block text-[10px] font-extrabold tracking-wider text-[#20231f] uppercase cursor-pointer">
              ¿Cuándo?
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xs text-slate-600 bg-transparent outline-none cursor-pointer"
            />
          </div>

          {/* Invitados */}
          <div className="w-[130px] px-3">
            <label className="block text-[10px] font-extrabold tracking-wider text-[#20231f] uppercase cursor-pointer">
              ¿Invitados?
            </label>
            <input
              type="number"
              min={1}
              value={guestsValue === "" ? "" : guestsValue}
              onChange={(e) => onGuestsChange(e.target.value ? Number(e.target.value) : "")}
              onKeyDown={handleKeyDown}
              placeholder="Personas"
              className="w-full text-xs text-slate-700 placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>

          {/* Botón Buscar */}
          <button
            onClick={onSearch}
            className="w-10 h-10 rounded-full bg-[#e35b44] hover:bg-[#cf4832] text-white flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 shadow-sm"
            aria-label="Buscar espacios"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Acciones del Menú */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onToggleFavorites}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors ${
              onlyFavorites
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-white border-[#e9ebe7] text-[#20231f] hover:bg-[#f6f6f3]"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-rose-600 text-rose-600" : "text-[#e35b44]"}`} />
            <span>Favoritos</span>
            {favoritesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black">
                {favoritesCount}
              </span>
            )}
          </button>

          <Link
            href="/host/establishments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white border border-[#e9ebe7] text-[#20231f] hover:bg-[#f6f6f3] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#e35b44]" />
            <span className="hidden sm:inline">Publica tu espacio</span>
            <span className="sm:hidden">Publicar</span>
          </Link>

          <Link
            href="/auth/login"
            className="w-10 h-10 rounded-full bg-[#24362d] text-white flex items-center justify-center font-bold text-xs hover:bg-[#1a2922] transition-colors"
            title="Ingresar a tu cuenta"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Barra de Búsqueda Móvil */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center bg-white border border-[#e5e5e2] rounded-full shadow-sm pl-4 pr-1.5 py-1.5">
          <input
            type="text"
            value={locationValue}
            onChange={(e) => onLocationChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿A dónde quieres ir? (Lima, Pachacámac...)"
            className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
          />
          <button
            onClick={onSearch}
            className="w-8 h-8 rounded-full bg-[#e35b44] text-white flex items-center justify-center active:scale-95 flex-shrink-0"
            aria-label="Buscar"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
