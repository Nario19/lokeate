-- ==============================================================================
-- LOKEATE — Migración: 20261102000000_establishments_moderation_and_locations.sql
-- Sprint 03: Catálogo Territorial, Moderación de Establecimientos y Ubicación Segregada
-- ==============================================================================

-- 1. Tipos enumerados de Establecimientos y Moderación
DO $$ BEGIN
  CREATE TYPE establishment_type_enum AS ENUM (
    'COUNTRY_HOUSE', 'HALL', 'ROOFTOP', 'MANOR', 
    'INDUSTRIAL_WAREHOUSE', 'GARDEN', 'BEACH_HOUSE', 'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE publishing_status_enum AS ENUM (
    'DRAFT',                  -- En confección por el anfitrión
    'SUBMITTED_FOR_REVIEW',   -- Enviado a moderación
    'APPROVED',               -- Aprobado por el Superadministrador (habilita publicación)
    'REJECTED',               -- Rechazado por incumplimiento de estándares
    'SUSPENDED'               -- Pausado por denuncia o sanción administrativa
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Catálogo Territorial Oficial de Zonas de Lanzamiento
CREATE TABLE IF NOT EXISTS public.departments (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.provinces (
  code VARCHAR(4) PRIMARY KEY,
  department_code VARCHAR(2) NOT NULL REFERENCES public.departments(code),
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.districts (
  ubigeo_code VARCHAR(6) PRIMARY KEY,
  province_code VARCHAR(4) NOT NULL REFERENCES public.provinces(code),
  name VARCHAR(100) NOT NULL,
  is_launch_zone BOOLEAN NOT NULL DEFAULT FALSE,
  launch_phase VARCHAR(50) NOT NULL DEFAULT 'PHASE_BETA_LIMA'
);

CREATE INDEX IF NOT EXISTS idx_districts_launch ON public.districts(is_launch_zone);

-- 3. Tabla: establishments (Información Pública y Ubicación Referencial Perturbada ~500m)
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  establishment_type establishment_type_enum NOT NULL,
  ubigeo_code VARCHAR(6) NOT NULL REFERENCES public.districts(ubigeo_code),
  approximate_latitude NUMERIC(10, 7) NOT NULL,
  approximate_longitude NUMERIC(10, 7) NOT NULL,
  noise_curfew_time TIME,
  house_rules TEXT,
  
  -- Moderación obligatoria por administración
  publishing_status publishing_status_enum NOT NULL DEFAULT 'DRAFT',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_establishments_host ON public.establishments(host_id);
CREATE INDEX IF NOT EXISTS idx_establishments_ubigeo ON public.establishments(ubigeo_code);
CREATE INDEX IF NOT EXISTS idx_establishments_status ON public.establishments(publishing_status, is_active);

-- 4. Trigger de Validación de Publicación Exclusiva tras Aprobación y Zona de Lanzamiento
CREATE OR REPLACE FUNCTION public.check_establishment_publication_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_is_launch_zone BOOLEAN;
BEGIN
  -- 1. Un anfitrión común no puede autoaprobar su establecimiento
  IF NOT public.is_superadmin() THEN
    IF NEW.publishing_status IN ('APPROVED', 'SUSPENDED') AND (TG_OP = 'INSERT' OR OLD.publishing_status IS DISTINCT FROM NEW.publishing_status) THEN
      RAISE EXCEPTION 'Violación de seguridad: La aprobación de un establecimiento requiere intervención de la administración.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- 2. El establecimiento solo puede tener is_active = TRUE si está formalmente APROBADO
  IF NEW.is_active = TRUE AND NEW.publishing_status != 'APPROVED' THEN
    RAISE EXCEPTION 'Restricción de negocio: Un establecimiento no puede activarse sin haber sido formalmente aprobado.'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Verificar que el distrito pertenezca a una zona de lanzamiento habilitada
  SELECT is_launch_zone INTO v_is_launch_zone 
  FROM public.districts 
  WHERE ubigeo_code = NEW.ubigeo_code;

  IF NEW.is_active = TRUE AND (v_is_launch_zone IS NULL OR v_is_launch_zone = FALSE) THEN
    RAISE EXCEPTION 'Restricción geográfica: El distrito seleccionado no forma parte de la zona de lanzamiento habilitada actualmente.'
      USING ERRCODE = '22023';
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_check_establishment_publication_eligibility ON public.establishments;
CREATE TRIGGER trg_check_establishment_publication_eligibility
BEFORE INSERT OR UPDATE ON public.establishments
FOR EACH ROW EXECUTE FUNCTION public.check_establishment_publication_eligibility();

-- 5. Tabla: establishment_locations_private (Dirección Confidencial Segregada)
CREATE TABLE IF NOT EXISTS public.establishment_locations_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL UNIQUE REFERENCES public.establishments(id) ON DELETE CASCADE,
  exact_address TEXT NOT NULL,
  address_reference TEXT,
  postal_code VARCHAR(10),
  host_contact_phone VARCHAR(20) NOT NULL,
  host_contact_email VARCHAR(100),
  access_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_locations_private_establishment ON public.establishment_locations_private(establishment_id);

-- 6. Políticas de Seguridad RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_locations_private ENABLE ROW LEVEL SECURITY;

-- Catálogo geográfico: Lectura pública para cualquier usuario
DROP POLICY IF EXISTS departments_select_all ON public.departments;
CREATE POLICY departments_select_all ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS provinces_select_all ON public.provinces;
CREATE POLICY provinces_select_all ON public.provinces FOR SELECT USING (true);

DROP POLICY IF EXISTS districts_select_all ON public.districts;
CREATE POLICY districts_select_all ON public.districts FOR SELECT USING (true);

-- Establecimientos: Visible solo si está APROBADO y ACTIVO, o si es el anfitrión propietario o Superadmin
DROP POLICY IF EXISTS establishments_select_rules ON public.establishments;
CREATE POLICY establishments_select_rules ON public.establishments
FOR SELECT USING (
  (publishing_status = 'APPROVED' AND is_active = TRUE)
  OR host_id = auth.uid()
  OR public.is_superadmin()
);

DROP POLICY IF EXISTS establishments_insert_host ON public.establishments;
CREATE POLICY establishments_insert_host ON public.establishments
FOR INSERT WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS establishments_update_host ON public.establishments;
CREATE POLICY establishments_update_host ON public.establishments
FOR UPDATE USING (host_id = auth.uid() OR public.is_superadmin())
WITH CHECK (host_id = auth.uid() OR public.is_superadmin());

-- Ubicación Confidencial Segregada:
-- 1. Anfitrión propietario
-- 2. Clientes con reserva CONFIRMED o IN_PROGRESS
-- 3. Superadministrador
DROP POLICY IF EXISTS location_private_select ON public.establishment_locations_private;
CREATE POLICY location_private_select ON public.establishment_locations_private
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.establishments e 
    WHERE e.id = establishment_locations_private.establishment_id 
      AND e.host_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.establishment_id = establishment_locations_private.establishment_id
      AND r.client_id = auth.uid()
      AND r.status IN ('CONFIRMED', 'IN_PROGRESS')
  )
  OR
  public.is_superadmin()
);

DROP POLICY IF EXISTS location_private_insert ON public.establishment_locations_private;
CREATE POLICY location_private_insert ON public.establishment_locations_private
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = establishment_locations_private.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);

DROP POLICY IF EXISTS location_private_update ON public.establishment_locations_private;
CREATE POLICY location_private_update ON public.establishment_locations_private
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = establishment_locations_private.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = establishment_locations_private.establishment_id
      AND e.host_id = auth.uid()
  )
  OR public.is_superadmin()
);
