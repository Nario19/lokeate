/**
 * Tipos TypeScript de Base de Datos para LOKEATE.
 * Generados en base al diseño físico en DATABASE.md.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "CLIENT" | "HOST" | "SUPERADMIN";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type DocumentType = "DNI" | "CE" | "RUC" | "PASSPORT";
export type EstablishmentType =
  | "COUNTRY_HOUSE"
  | "HALL"
  | "ROOFTOP"
  | "MANOR"
  | "INDUSTRIAL_WAREHOUSE"
  | "GARDEN"
  | "BEACH_HOUSE"
  | "OTHER";
export type PublishingStatus =
  | "DRAFT"
  | "SUBMITTED_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
export type PricingMode = "HOURLY" | "FIXED_EVENT" | "PER_PERSON" | "PACKAGE";
export type TaxCondition =
  | "TAX_EXEMPT_OR_NOT_APPLICABLE"
  | "TAX_INCLUDED_18_IGV"
  | "TAX_ADDITIONAL_18_IGV";
export type EventType =
  | "WEDDING"
  | "FIFTEEN_YEARS"
  | "BIRTHDAY"
  | "CORPORATE"
  | "BABY_SHOWER"
  | "ANNIVERSARY"
  | "PHOTO_SHOOT"
  | "OTHER";
export type ReservationStatus =
  | "DRAFT"
  | "REQUESTED"
  | "ACCEPTED_WAITING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_CORRECTION_PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED_BY_HOST"
  | "EXPIRED_NO_RESPONSE"
  | "EXPIRED_NO_PAYMENT"
  | "CANCELLED_BY_CLIENT"
  | "CANCELLED_BY_HOST"
  | "CLOSED_ADMINISTRATIVELY";
export type DisputeStatus =
  | "NONE"
  | "DISPUTED"
  | "UNDER_ARBITRATION"
  | "RESOLVED_SETTLED"
  | "RESOLVED_DISMISSED";
export type BlockType = "HOST_MANUAL" | "MAINTENANCE" | "ICAL_EXTERNAL" | "ADMIN_BLOCK";
export type InstallmentStatus = "PENDING" | "DECLARED" | "VERIFIED" | "OVERDUE";
export type PaymentMethod =
  | "BCP"
  | "BBVA"
  | "INTERBANK"
  | "SCOTIABANK"
  | "YAPE"
  | "PLIN"
  | "OTHER_TRANSFER";
export type PaymentStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED_OBSERVED";
export type CancellationPolicy = "FLEXIBLE" | "MODERATE" | "STRICT";

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          code: string;
          name: string;
        };
        Insert: {
          code: string;
          name: string;
        };
        Update: {
          code?: string;
          name?: string;
        };
        Relationships: [];
      };
      provinces: {
        Row: {
          code: string;
          department_code: string;
          name: string;
        };
        Insert: {
          code: string;
          department_code: string;
          name: string;
        };
        Update: {
          code?: string;
          department_code?: string;
          name?: string;
        };
        Relationships: [];
      };
      districts: {
        Row: {
          ubigeo_code: string;
          province_code: string;
          name: string;
          is_launch_zone: boolean;
          launch_phase: string;
        };
        Insert: {
          ubigeo_code: string;
          province_code: string;
          name: string;
          is_launch_zone?: boolean;
          launch_phase?: string;
        };
        Update: {
          ubigeo_code?: string;
          province_code?: string;
          name?: string;
          is_launch_zone?: boolean;
          launch_phase?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          role: UserRole;
          is_host_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_host_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_host_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profile_private_details: {
        Row: {
          user_id: string;
          document_type: DocumentType;
          document_number: string;
          phone: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          document_type?: DocumentType;
          document_number: string;
          phone: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          document_type?: DocumentType;
          document_number?: string;
          phone?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      establishments: {
        Row: {
          id: string;
          host_id: string;
          name: string;
          slug: string;
          description: string;
          establishment_type: EstablishmentType;
          ubigeo_code: string;
          approximate_latitude: number;
          approximate_longitude: number;
          approximate_location?: unknown;
          noise_curfew_time: string | null;
          house_rules: string | null;
          publishing_status: PublishingStatus;
          is_active: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          name: string;
          slug: string;
          description: string;
          establishment_type: EstablishmentType;
          ubigeo_code: string;
          approximate_latitude: number;
          approximate_longitude: number;
          approximate_location?: unknown;
          noise_curfew_time?: string | null;
          house_rules?: string | null;
          publishing_status?: PublishingStatus;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          establishment_type?: EstablishmentType;
          ubigeo_code?: string;
          approximate_latitude?: number;
          approximate_longitude?: number;
          approximate_location?: unknown;
          noise_curfew_time?: string | null;
          house_rules?: string | null;
          publishing_status?: PublishingStatus;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      establishment_locations_private: {
        Row: {
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
        };
        Insert: {
          id?: string;
          establishment_id: string;
          exact_address: string;
          address_reference?: string | null;
          postal_code?: string | null;
          host_contact_phone: string;
          host_contact_email?: string | null;
          access_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          exact_address?: string;
          address_reference?: string | null;
          postal_code?: string | null;
          host_contact_phone?: string;
          host_contact_email?: string | null;
          access_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spaces: {
        Row: {
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
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description: string;
          is_entire_establishment?: boolean;
          area_m2: number;
          standing_capacity: number;
          seated_capacity: number;
          setup_buffer_minutes?: number;
          cleanup_buffer_minutes?: number;
          cancellation_policy?: CancellationPolicy;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string;
          is_entire_establishment?: boolean;
          area_m2?: number;
          standing_capacity?: number;
          seated_capacity?: number;
          setup_buffer_minutes?: number;
          cleanup_buffer_minutes?: number;
          cancellation_policy?: CancellationPolicy;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      space_pricing_plans: {
        Row: {
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
        };
        Insert: {
          id?: string;
          space_id: string;
          plan_name: string;
          description?: string | null;
          pricing_mode: PricingMode;
          base_price_weekday: number;
          base_price_weekend: number;
          extra_hour_price?: number;
          minimum_rental_hours?: number;
          minimum_billable_guests?: number;
          cleaning_fee?: number;
          security_deposit?: number;
          required_advance_percentage?: number;
          included_amenities_ids?: string[] | null;
          tax_condition?: TaxCondition;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          plan_name?: string;
          description?: string | null;
          pricing_mode?: PricingMode;
          base_price_weekday?: number;
          base_price_weekend?: number;
          extra_hour_price?: number;
          minimum_rental_hours?: number;
          minimum_billable_guests?: number;
          cleaning_fee?: number;
          security_deposit?: number;
          required_advance_percentage?: number;
          included_amenities_ids?: string[] | null;
          tax_condition?: TaxCondition;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      space_photos: {
        Row: {
          id: string;
          space_id: string;
          storage_path: string;
          caption: string | null;
          display_order: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          storage_path: string;
          caption?: string | null;
          display_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          storage_path?: string;
          caption?: string | null;
          display_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      shared_resources: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          resource_type: string;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          resource_type: string;
          capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          resource_type?: string;
          capacity?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      space_shared_resources: {
        Row: {
          space_id: string;
          shared_resource_id: string;
          is_exclusive_during_event: boolean;
        };
        Insert: {
          space_id: string;
          shared_resource_id: string;
          is_exclusive_during_event?: boolean;
        };
        Update: {
          space_id?: string;
          shared_resource_id?: string;
          is_exclusive_during_event?: boolean;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          reservation_code: string;
          space_id: string;
          establishment_id: string;
          pricing_plan_id: string;
          client_id: string;
          host_id: string;
          current_snapshot_id: string | null;
          event_date: string;
          start_time: string;
          end_time: string;
          time_range: unknown;
          guest_count: number;
          event_type: EventType;
          special_requests: string | null;
          status: ReservationStatus;
          dispute_status: DisputeStatus;
          requested_at: string;
          host_response_deadline: string;
          accepted_at: string | null;
          payment_deadline: string | null;
          payment_submitted_at: string | null;
          host_verification_deadline: string | null;
          correction_deadline: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reservation_code: string;
          space_id: string;
          establishment_id: string;
          pricing_plan_id: string;
          client_id: string;
          host_id: string;
          current_snapshot_id?: string | null;
          event_date: string;
          start_time: string;
          end_time: string;
          time_range: unknown;
          guest_count: number;
          event_type: EventType;
          special_requests?: string | null;
          status?: ReservationStatus;
          dispute_status?: DisputeStatus;
          requested_at?: string;
          host_response_deadline: string;
          accepted_at?: string | null;
          payment_deadline?: string | null;
          payment_submitted_at?: string | null;
          host_verification_deadline?: string | null;
          correction_deadline?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reservation_code?: string;
          space_id?: string;
          establishment_id?: string;
          pricing_plan_id?: string;
          client_id?: string;
          host_id?: string;
          current_snapshot_id?: string | null;
          event_date?: string;
          start_time?: string;
          end_time?: string;
          time_range?: unknown;
          guest_count?: number;
          event_type?: EventType;
          special_requests?: string | null;
          status?: ReservationStatus;
          dispute_status?: DisputeStatus;
          requested_at?: string;
          host_response_deadline?: string;
          accepted_at?: string | null;
          payment_deadline?: string | null;
          payment_submitted_at?: string | null;
          host_verification_deadline?: string | null;
          correction_deadline?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_snapshots: {
        Row: {
          id: string;
          reservation_id: string;
          version: number;
          reason: string;
          pricing_plan_id: string;
          pricing_mode_applied: PricingMode;
          base_rental_price: number;
          extra_hours_count: number;
          extra_hours_price: number;
          cleaning_fee: number;
          seasonal_adjustments: Json | null;
          discounts_applied: Json | null;
          additional_services: Json | null;
          tax_condition_applied: TaxCondition;
          tax_amount: number;
          service_fee_platform: number;
          security_deposit: number;
          total_contract_price: number;
          required_advance_amount: number;
          pending_balance_amount: number;
          installments_schedule: Json;
          currency: string;
          cancellation_policy_applied: CancellationPolicy;
          snapshot_hash_sha256: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          version?: number;
          reason?: string;
          pricing_plan_id: string;
          pricing_mode_applied: PricingMode;
          base_rental_price: number;
          extra_hours_count?: number;
          extra_hours_price?: number;
          cleaning_fee?: number;
          seasonal_adjustments?: Json | null;
          discounts_applied?: Json | null;
          additional_services?: Json | null;
          tax_condition_applied: TaxCondition;
          tax_amount?: number;
          service_fee_platform?: number;
          security_deposit?: number;
          total_contract_price: number;
          required_advance_amount: number;
          pending_balance_amount: number;
          installments_schedule: Json;
          currency?: string;
          cancellation_policy_applied: CancellationPolicy;
          snapshot_hash_sha256: string;
          created_at?: string;
        };
        Update: never; // Inmutable: Append-only
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_superadmin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role_enum: UserRole;
      document_type_enum: DocumentType;
      verification_status_enum: VerificationStatus;
      establishment_type_enum: EstablishmentType;
      publishing_status_enum: PublishingStatus;
      pricing_mode_enum: PricingMode;
      tax_condition_enum: TaxCondition;
      event_type_enum: EventType;
      reservation_status_enum: ReservationStatus;
      dispute_status_enum: DisputeStatus;
      block_type_enum: BlockType;
      installment_status_enum: InstallmentStatus;
      payment_method_enum: PaymentMethod;
      payment_status_enum: PaymentStatus;
      cancellation_policy_enum: CancellationPolicy;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
