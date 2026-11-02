-- ==============================================================================
-- LOKEATE — Migración: 20261103000000_spaces_plans_and_media.sql
-- Sprint 04: Espacios Individuales, Planes Tarifarios y Galería Multimedia
-- ==============================================================================

-- 1. Tipos enumerados de Precios, Cancelaciones e Impuestos
DO $$ BEGIN
  CREATE TYPE pricing_mode_enum AS ENUM ('HOURLY', 'FIXED_EVENT', 'PER_PERSON', 'PACKAGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cancellation_policy_enum AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tax_condition_enum AS ENUM (
    'TAX_EXEMPT_OR_NOT_APPLICABLE',
    'TAX_INCLUDED_18_IGV',
    'TAX_ADDITIONAL_18_IGV'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla: spaces (Espacios Individuales o Establecimiento Completo)
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  is_entire_establishment BOOLEAN NOT NULL DEFAULT FALSE,
  area_m2 NUMERIC(8,2) NOT NULL CHECK (area_m2 > 0),
  standing_capacity INTEGER NOT NULL CHECK (standing_capacity > 0),
  seated_capacity INTEGER NOT NULL CHECK (seated_capacity > 0),
  setup_buffer_minutes INTEGER NOT NULL DEFAULT 60 CHECK (setup_buffer_minutes >= 0),
  cleanup_buffer_minutes INTEGER NOT NULL DEFAULT 60 CHECK (cleanup_buffer_minutes >= 0),
  cancellation_policy cancellation_policy_enum NOT NULL DEFAULT 'MODERATE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_spaces_establishment ON public.spaces(establishment_id);

-- 3. Tablas: shared_resources y space_shared_resources
CREATE TABLE IF NOT EXISTS public.shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.space_shared_resources (
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  shared_resource_id UUID NOT NULL REFERENCES public.shared_resources(id) ON DELETE CASCADE,
  is_exclusive_during_event BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (space_id, shared_resource_id)
);

-- 4. Tabla: space_pricing_plans (Múltiples Planes Tarifarios Alternativos por Espacio)
CREATE TABLE IF NOT EXISTS public.space_pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  plan_name VARCHAR(120) NOT NULL,
  description TEXT,
  pricing_mode pricing_mode_enum NOT NULL,
  
  base_price_weekday NUMERIC(12,2) NOT NULL CHECK (base_price_weekday >= 0),
  base_price_weekend NUMERIC(12,2) NOT NULL CHECK (base_price_weekend >= 0),
  extra_hour_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (extra_hour_price >= 0),
  
  minimum_rental_hours INTEGER NOT NULL DEFAULT 4 CHECK (minimum_rental_hours > 0),
  minimum_billable_guests INTEGER DEFAULT 1 CHECK (minimum_billable_guests >= 1),
  
  cleaning_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (cleaning_fee >= 0),
  security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (security_deposit >= 0),
  required_advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (required_advance_percentage BETWEEN 10.00 AND 100.00),
  
  included_amenities_ids UUID[],
  tax_condition tax_condition_enum NOT NULL DEFAULT 'TAX_EXEMPT_OR_NOT_APPLICABLE',
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pricing_plans_space ON public.space_pricing_plans(space_id, is_active);

-- 5. Tabla: space_photos (Galería Multimedia de Espacios)
CREATE TABLE IF NOT EXISTS public.space_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption VARCHAR(150),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_space_photos_space ON public.space_photos(space_id, display_order);

-- 6. Políticas de Seguridad RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_photos ENABLE ROW LEVEL SECURITY;

-- Políticas para spaces
DROP POLICY IF EXISTS spaces_select_rules ON public.spaces;
CREATE POLICY spaces_select_rules ON public.spaces
FOR SELECT USING (
  -- Visible públicamente si el espacio está activo y el establecimiento aprobado y activo
  (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.establishments e
      WHERE e.id = spaces.establishment_id
        AND e.publishing_status = 'APPROVED'
        AND e.is_active = TRUE
    )
  )
  OR
  -- Visible para el anfitrión propietario del establecimiento
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = spaces.establishment_id
      AND e.host_id = auth.uid()
  )
  OR
  public.is_superadmin()
);

DROP POLICY IF EXISTS spaces_insert_host ON public.spaces;
CREATE POLICY spaces_insert_host ON public.spaces
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = spaces.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);

DROP POLICY IF EXISTS spaces_update_host ON public.spaces;
CREATE POLICY spaces_update_host ON public.spaces
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = spaces.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = spaces.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);

-- Políticas para space_pricing_plans
DROP POLICY IF EXISTS pricing_plans_select_rules ON public.space_pricing_plans;
CREATE POLICY pricing_plans_select_rules ON public.space_pricing_plans
FOR SELECT USING (
  -- Visible si el plan está activo y el espacio visible
  (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.spaces s
      JOIN public.establishments e ON e.id = s.establishment_id
      WHERE s.id = space_pricing_plans.space_id
        AND s.is_active = TRUE
        AND e.publishing_status = 'APPROVED'
        AND e.is_active = TRUE
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.spaces s
    JOIN public.establishments e ON e.id = s.establishment_id
    WHERE s.id = space_pricing_plans.space_id
      AND e.host_id = auth.uid()
  )
  OR
  public.is_superadmin()
);

DROP POLICY IF EXISTS pricing_plans_insert_host ON public.space_pricing_plans;
CREATE POLICY pricing_plans_insert_host ON public.space_pricing_plans
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spaces s
    JOIN public.establishments e ON e.id = s.establishment_id
    WHERE s.id = space_pricing_plans.space_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);

DROP POLICY IF EXISTS pricing_plans_update_host ON public.space_pricing_plans;
CREATE POLICY pricing_plans_update_host ON public.space_pricing_plans
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.spaces s
    JOIN public.establishments e ON e.id = s.establishment_id
    WHERE s.id = space_pricing_plans.space_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spaces s
    JOIN public.establishments e ON e.id = s.establishment_id
    WHERE s.id = space_pricing_plans.space_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);

-- Políticas para space_photos
DROP POLICY IF EXISTS space_photos_select ON public.space_photos;
CREATE POLICY space_photos_select ON public.space_photos
FOR SELECT USING (true); -- Las fotos públicas de espacios son legibles por todos

DROP POLICY IF EXISTS space_photos_manage_host ON public.space_photos;
CREATE POLICY space_photos_manage_host ON public.space_photos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.spaces s
    JOIN public.establishments e ON e.id = s.establishment_id
    WHERE s.id = space_photos.space_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);
