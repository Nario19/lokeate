"use client";

import * as React from "react";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { INITIAL_VENUES } from "../data/sample-venues";
import type { PinterestVenue, VenueCategory } from "../types/venue-pinterest.types";
import { PinterestHeader } from "./pinterest-header";
import { PinterestHero } from "./pinterest-hero";
import { PinterestCategoryBar } from "./pinterest-category-bar";
import { PinterestGallery } from "./pinterest-gallery";
import { PinterestDetailModal } from "./pinterest-detail-modal";
import { PinterestCompareBar, PinterestCompareModal } from "./pinterest-compare-bar";
import { PinterestFiltersModal } from "./pinterest-filters-modal";

interface PinterestMarketplaceProps {
  initialEstablishmentsCount?: number;
}

export function PinterestMarketplace({
  initialEstablishmentsCount,
}: PinterestMarketplaceProps) {
  // Estado de Datos
  const [venues, setVenues] = React.useState<PinterestVenue[]>(INITIAL_VENUES);
  const [favorites, setFavorites] = React.useState<(number | string)[]>([]);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Filtros de Búsqueda
  const [locationQuery, setLocationQuery] = React.useState("");
  const [dateQuery, setDateQuery] = React.useState("");
  const [guestsQuery, setGuestsQuery] = React.useState<number | "">("");
  const [activeCategory, setActiveCategory] = React.useState<VenueCategory>("Todos");
  const [maxPrice, setMaxPrice] = React.useState<number>(10000);
  const [sortBy, setSortBy] = React.useState<"featured" | "low" | "high" | "rating">("featured");
  const [onlyFavorites, setOnlyFavorites] = React.useState(false);

  // Estados de Interacción
  const [selectedVenue, setSelectedVenue] = React.useState<PinterestVenue | null>(null);
  const [compareMode, setCompareMode] = React.useState(false);
  const [comparedIds, setComparedIds] = React.useState<(number | string)[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = React.useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = React.useState(false);

  // Cargar favoritos de localStorage
  React.useEffect(() => {
    try {
      const savedFavs = JSON.parse(localStorage.getItem("lokeate_favs") || "[]");
      if (Array.isArray(savedFavs)) {
        setFavorites(savedFavs);
      }
    } catch {
      // Ignorar fallback si localStorage no está disponible
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleToggleFavorite = (id: number | string) => {
    const isFav = favorites.includes(id);
    const updated = isFav ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem("lokeate_favs", JSON.stringify(updated));
    } catch {
      // noop
    }
    showToast(isFav ? "Eliminado de tus favoritos" : "Guardado en tus favoritos ❤️");
  };

  const handleToggleCompare = (id: number | string) => {
    if (comparedIds.includes(id)) {
      setComparedIds(comparedIds.filter((x) => x !== id));
    } else {
      if (comparedIds.length >= 3) {
        showToast("Puedes comparar hasta 3 espacios a la vez.");
        return;
      }
      setComparedIds([...comparedIds, id]);
    }
  };

  const handleResetFilters = () => {
    setLocationQuery("");
    setDateQuery("");
    setGuestsQuery("");
    setActiveCategory("Todos");
    setMaxPrice(10000);
    setOnlyFavorites(false);
    showToast("Filtros restablecidos");
  };

  // Filtrado y Ordenamiento
  const filteredVenues = React.useMemo(() => {
    let list = venues.filter((v) => {
      // Filtro de Favoritos
      if (onlyFavorites && !favorites.includes(v.id)) {
        return false;
      }
      // Filtro de Categoría
      if (activeCategory !== "Todos" && v.category !== activeCategory) {
        return false;
      }
      // Filtro de Ubicación
      if (locationQuery.trim()) {
        const query = locationQuery.toLowerCase();
        if (!v.location.toLowerCase().includes(query) && !v.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Filtro de Capacidad
      if (guestsQuery && guestsQuery > 0) {
        if (v.capacity < guestsQuery) {
          return false;
        }
      }
      // Filtro de Precio
      if (v.price > maxPrice) {
        return false;
      }
      return true;
    });

    // Ordenamiento
    list.sort((a, b) => {
      if (sortBy === "low") return a.price - b.price;
      if (sortBy === "high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return Number(a.id) - Number(b.id);
    });

    return list;
  }, [venues, favorites, onlyFavorites, activeCategory, locationQuery, guestsQuery, maxPrice, sortBy]);

  const comparedVenues = React.useMemo(() => {
    return venues.filter((v) => comparedIds.includes(v.id));
  }, [venues, comparedIds]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header Fijo con Estilo Cápsula */}
      <PinterestHeader
        locationValue={locationQuery}
        onLocationChange={setLocationQuery}
        dateValue={dateQuery}
        onDateChange={setDateQuery}
        guestsValue={guestsQuery}
        onGuestsChange={setGuestsQuery}
        onSearch={() => {
          showToast(`Mostrando ${filteredVenues.length} espacios encontrados`);
        }}
        favoritesCount={favorites.length}
        onlyFavorites={onlyFavorites}
        onToggleFavorites={() => {
          setOnlyFavorites(!onlyFavorites);
          showToast(!onlyFavorites ? "Mostrando tus favoritos" : "Mostrando todos los espacios");
        }}
      />

      <main className="flex-1 max-w-[1530px] w-full mx-auto px-4 sm:px-9">
        {/* Hero Section */}
        <PinterestHero
          onOpenFilters={() => setIsFiltersModalOpen(true)}
          compareMode={compareMode}
          onToggleCompare={() => {
            setCompareMode(!compareMode);
            if (compareMode) setComparedIds([]);
            showToast(!compareMode ? "Modo comparación activado: Elige hasta 3 espacios" : "Modo comparación desactivado");
          }}
        />

        {/* Fila de Categorías con Scroll Horizontal */}
        <PinterestCategoryBar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setOnlyFavorites(false);
          }}
        />

        {/* Barra de Herramientas y Conteo */}
        <div className="flex items-center justify-between gap-3 pt-3 pb-4 text-xs">
          <p className="text-[#7d817c]">
            <strong className="text-[#20231f] font-extrabold text-sm">
              {filteredVenues.length} espacios
            </strong>{" "}
            para celebrar a tu manera {onlyFavorites ? "· en tus favoritos" : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFiltersModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e9ebe7] bg-white text-[#20231f] hover:bg-slate-50 font-bold"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filtros</span>
            </button>

            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "low" | "high" | "rating")}
                className="appearance-none bg-white border border-[#e9ebe7] rounded-full px-3 py-1.5 pr-7 text-xs font-bold text-[#20231f] cursor-pointer focus:outline-none"
                aria-label="Ordenar resultados"
              >
                <option value="featured">Destacados</option>
                <option value="low">Menor precio</option>
                <option value="high">Mayor precio</option>
                <option value="rating">Mejor valorados</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Galería Masonry — Las imágenes son las protagonistas */}
        <PinterestGallery
          venues={filteredVenues}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onSelectVenue={setSelectedVenue}
          compareMode={compareMode}
          comparedIds={comparedIds}
          onToggleCompare={handleToggleCompare}
          onResetFilters={handleResetFilters}
        />
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-[#e9ebe7] py-6 px-4 sm:px-9 bg-white text-xs text-[#8a8e88]">
        <div className="max-w-[1530px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>
            © 2026 LOKEATE · Encuentra tu lugar. Transparencia RealPrice en alquiler de locales para eventos.
          </span>
          <span className="text-[11px] text-slate-400">
            Los resúmenes y confirmaciones emitidos por LOKEATE son de carácter privado y no sustituyen comprobantes tributarios SUNAT.
          </span>
        </div>
      </footer>

      {/* Modal de Detalle con Cotizador RealPrice */}
      <PinterestDetailModal
        venue={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        isFavorite={selectedVenue ? favorites.includes(selectedVenue.id) : false}
        onToggleFavorite={handleToggleFavorite}
        initialDate={dateQuery}
        initialGuests={guestsQuery}
        onBookingSuccess={(bookingId) => {
          setSelectedVenue(null);
          showToast(`¡Solicitud ${bookingId} registrada con éxito! El anfitrión te contactará.`);
        }}
      />

      {/* Barra y Modal de Comparación Flotante */}
      <PinterestCompareBar
        comparedVenues={comparedVenues}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onClearCompare={() => setComparedIds([])}
      />

      <PinterestCompareModal
        venues={comparedVenues}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onSelectVenue={setSelectedVenue}
      />

      {/* Modal de Filtros Avanzados */}
      <PinterestFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onReset={handleResetFilters}
        onApply={() => {
          showToast("Filtros aplicados");
        }}
      />

      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#24362d] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold max-w-sm animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
