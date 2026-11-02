"use client";

import * as React from "react";
import { CATEGORIES_CONFIG } from "../data/sample-venues";
import type { VenueCategory } from "../types/venue-pinterest.types";

interface PinterestCategoryBarProps {
  activeCategory: VenueCategory;
  onSelectCategory: (cat: VenueCategory) => void;
}

export function PinterestCategoryBar({
  activeCategory,
  onSelectCategory,
}: PinterestCategoryBarProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth">
      {CATEGORIES_CONFIG.map(({ label, icon }) => {
        const isActive = activeCategory === label;
        return (
          <button
            key={label}
            onClick={() => onSelectCategory(label)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              isActive
                ? "bg-[#24362d] text-white shadow-sm"
                : "bg-white border border-[#e8e9e6] text-[#626860] hover:bg-[#f6f6f3] hover:text-[#20231f]"
            }`}
          >
            <span className="text-sm leading-none">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
