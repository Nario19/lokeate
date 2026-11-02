export interface PinterestVenue {
  id: number | string;
  name: string;
  location: string;
  category: string;
  price: number;
  capacity: number;
  rating: number;
  image: string;
  badge: string;
  aspectRatio: number; // e.g. 0.8 for tall portrait, 1.3 for landscape
  features: string[];
  host: string;
  description: string;
  isEntireEstablishment?: boolean;
}

export type VenueCategory =
  | "Todos"
  | "Bodas"
  | "Terrazas"
  | "Casas & Quintas"
  | "Campo & Naturaleza"
  | "Salones"
  | "Corporativos";

export interface SearchFilters {
  location: string;
  date: string;
  guests: number;
  category: VenueCategory;
  maxPrice: number;
  sortBy: "featured" | "low" | "high" | "rating";
  onlyFavorites: boolean;
}
