import type { EstablishmentType, PublishingStatus } from "@/types/database.types";

export interface Establishment {
  id: string;
  host_id: string;
  name: string;
  slug: string;
  description: string;
  establishment_type: EstablishmentType;
  ubigeo_code: string;
  approximate_latitude: number;
  approximate_longitude: number;
  noise_curfew_time: string | null;
  house_rules: string | null;
  publishing_status: PublishingStatus;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstablishmentLocationPrivate {
  id: string;
  establishment_id: string;
  exact_address: string;
  address_reference: string | null;
  postal_code: string | null;
  host_contact_phone: string;
  host_contact_email: string | null;
  access_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaunchDistrict {
  ubigeo_code: string;
  province_code: string;
  name: string;
  is_launch_zone: boolean;
  launch_phase: string;
}

export interface EstablishmentWithLocation extends Establishment {
  district?: LaunchDistrict;
  private_location?: EstablishmentLocationPrivate | null;
}
