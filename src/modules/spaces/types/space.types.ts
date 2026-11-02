import type {
  CancellationPolicy,
  PricingMode,
  TaxCondition,
} from "@/types/database.types";

export interface Space {
  id: string;
  establishment_id: string;
  name: string;
  description: string;
  is_entire_establishment: boolean;
  area_m2: number;
  standing_capacity: number;
  seated_capacity: number;
  setup_buffer_minutes: number;
  cleanup_buffer_minutes: number;
  cancellation_policy: CancellationPolicy;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpacePricingPlan {
  id: string;
  space_id: string;
  plan_name: string;
  description: string | null;
  pricing_mode: PricingMode;
  base_price_weekday: number;
  base_price_weekend: number;
  extra_hour_price: number;
  minimum_rental_hours: number;
  minimum_billable_guests: number;
  cleaning_fee: number;
  security_deposit: number;
  required_advance_percentage: number;
  included_amenities_ids: string[] | null;
  tax_condition: TaxCondition;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpacePhoto {
  id: string;
  space_id: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface SharedResource {
  id: string;
  establishment_id: string;
  name: string;
  resource_type: string;
  capacity: number | null;
  created_at: string;
}

export interface SpaceWithDetails extends Space {
  pricing_plans: SpacePricingPlan[];
  photos: SpacePhoto[];
  establishment_name?: string;
}
