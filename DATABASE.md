# DATABASE.md — Diseño Integral de Base de Datos PostgreSQL de LOKEATE

> **ESTADO DEL DOCUMENTO:** REVISIÓN TÉCNICA CORREGIDA — ESPECIFICACIÓN NO EJECUTABLE SIN VALIDACIÓN LOCAL  
> **MOTOR DE BASE DE DATOS:** PostgreSQL 15+ administrado en Supabase  
> **RESPONSABILIDAD:** Arquitectura física, esquemas relacionales, seguridad RLS no recursiva, funciones transaccionales atómicas de cambio de estado y control bidireccional de concurrencia.  
> **Aviso:** Los bloques SQL son diseño de referencia, no una migración ejecutable aprobada. Deben ordenarse por dependencias, probarse en PostgreSQL local y superar pruebas RLS, integridad y concurrencia antes de utilizarse. Las funciones SECURITY DEFINER requieren dueño de confianza, search_path endurecido y permisos EXECUTE explícitos.

---

## 1. Extensiones de PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- Identificadores únicos universales v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Criptografía y hash SHA256
CREATE EXTENSION IF NOT EXISTS "btree_gist";      -- Restricciones de exclusión GiST combinando escalares y rangos
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Almacenamiento geoespacial y cálculo de distancias
```

---

## 2. Tipos Enumerados del Sistema (Enums)

```sql
-- Roles de usuario
CREATE TYPE user_role_enum AS ENUM ('CLIENT', 'HOST', 'SUPERADMIN');

-- Verificación de identidad (KYC de anfitrión)
CREATE TYPE verification_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- Documentos de identidad oficiales en el Perú
CREATE TYPE document_type_enum AS ENUM ('DNI', 'CE', 'RUC', 'PASSPORT');

-- Tipologías de establecimientos
CREATE TYPE establishment_type_enum AS ENUM (
  'COUNTRY_HOUSE', 'HALL', 'ROOFTOP', 'MANOR', 
  'INDUSTRIAL_WAREHOUSE', 'GARDEN', 'BEACH_HOUSE', 'OTHER'
);

-- Estado de publicación y moderación de establecimientos
CREATE TYPE publishing_status_enum AS ENUM (
  'DRAFT',                  -- En confección por el anfitrión
  'SUBMITTED_FOR_REVIEW',   -- Enviado a moderación
  'APPROVED',               -- Aprobado por el Superadministrador (habilita publicación)
  'REJECTED',               -- Rechazado por incumplimiento de estándares
  'SUSPENDED'               -- Pausado por denuncia o sanción administrativa
);

-- Modalidades de precio aprobadas (excluyentes dentro de un mismo plan)
CREATE TYPE pricing_mode_enum AS ENUM ('HOURLY', 'FIXED_EVENT', 'PER_PERSON', 'PACKAGE');

-- Condición tributaria del anfitrión frente al IGV (18% en Perú)
CREATE TYPE tax_condition_enum AS ENUM (
  'TAX_EXEMPT_OR_NOT_APPLICABLE', -- Personas naturales (1ra/2da categoría SUNAT)
  'TAX_INCLUDED_18_IGV',          -- Precio publicado ya contiene IGV
  'TAX_ADDITIONAL_18_IGV'         -- Factura comercial suma 18% al subtotal
);

-- Tipos de eventos
CREATE TYPE event_type_enum AS ENUM (
  'WEDDING', 'FIFTEEN_YEARS', 'BIRTHDAY', 'CORPORATE', 
  'BABY_SHOWER', 'ANNIVERSARY', 'PHOTO_SHOOT', 'OTHER'
);

-- Estado operativo del ciclo de vida de la reserva
CREATE TYPE reservation_status_enum AS ENUM (
  'DRAFT',                       -- Borrador del cliente
  'REQUESTED',                   -- Solicitud enviada (reloj anfitrión: 24h)
  'ACCEPTED_WAITING_PAYMENT',    -- Aceptada; en espera de anticipo (reloj cliente: 24h)
  'PAYMENT_SUBMITTED',           -- Comprobante cargado (reloj anfitrión: 12h)
  'PAYMENT_CORRECTION_PENDING',  -- Comprobante observado (reloj subsanación: 12h)
  'CONFIRMED',                   -- Anticipo verificado; reserva firme
  'IN_PROGRESS',                 -- Evento en ejecución (Check-in suscrito)
  'COMPLETED',                   -- Evento finalizado (Check-out suscrito)
  'REJECTED_BY_HOST',            -- Solicitud rechazada por el anfitrión
  'EXPIRED_NO_RESPONSE',         -- Anfitrión no respondió en 24h
  'EXPIRED_NO_PAYMENT',          -- Cliente no presentó anticipo/subsanación a tiempo
  'CANCELLED_BY_CLIENT',         -- Cancelada por el cliente bajo política
  'CANCELLED_BY_HOST',           -- Cancelada por el anfitrión (con penalidad)
  'CLOSED_ADMINISTRATIVELY'      -- Cierre forzoso ejecutado por el Superadministrador
);

-- Estado desacoplado de controversias y disputas
CREATE TYPE dispute_status_enum AS ENUM (
  'NONE',                        -- Sin controversias
  'DISPUTED',                    -- Controversia abierta por cliente o anfitrión
  'UNDER_ARBITRATION',           -- Mediación activa del Superadministrador
  'RESOLVED_SETTLED',            -- Resuelto mediante acuerdo entre partes
  'RESOLVED_DISMISSED'           -- Reclamo desestimado por improcedencia
);

-- Tipo de bloqueo de disponibilidad
CREATE TYPE block_type_enum AS ENUM ('HOST_MANUAL', 'MAINTENANCE', 'ICAL_EXTERNAL', 'ADMIN_BLOCK');

-- Estado de cuotas de pago
CREATE TYPE installment_status_enum AS ENUM ('PENDING', 'DECLARED', 'VERIFIED', 'OVERDUE');

-- Métodos de pago bancarios fuera de plataforma (Fase Beta)
CREATE TYPE payment_method_enum AS ENUM ('BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'YAPE', 'PLIN', 'OTHER_TRANSFER');

-- Estado de comprobantes declarados
CREATE TYPE payment_status_enum AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED_OBSERVED');

-- Políticas de cancelación parametrizadas
CREATE TYPE cancellation_policy_enum AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');

-- Estado de reclamos de garantía por daños
CREATE TYPE claim_resolution_status_enum AS ENUM ('OPEN', 'SETTLED', 'ARBITRATED', 'CLOSED');

-- Severidad y estado de tickets de soporte
CREATE TYPE ticket_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE ticket_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
```

---

## 3. Funciones Base de Seguridad Anti-Recursión RLS

> **Solución Definitiva a la Recursión RLS:**  
> Ninguna política de RLS debe ejecutar `SELECT ... FROM public.profiles` directamente. Toda comprobación de permisos de administración se delega a la función `public.is_superadmin()`, marcada con `SECURITY DEFINER` y `SET search_path = public, pg_temp`, ejecutándose con privilegios del sistema e impidiendo la recursión infinita.

```sql
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'SUPERADMIN'
  );
$$;
```

---

## 4. Configuración Geográfica y Zonas de Lanzamiento

```sql
CREATE TABLE public.departments (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE public.provinces (
  code VARCHAR(4) PRIMARY KEY,
  department_code VARCHAR(2) NOT NULL REFERENCES public.departments(code),
  name VARCHAR(100) NOT NULL
);

CREATE TABLE public.districts (
  ubigeo_code VARCHAR(6) PRIMARY KEY,
  province_code VARCHAR(4) NOT NULL REFERENCES public.provinces(code),
  name VARCHAR(100) NOT NULL,
  is_launch_zone BOOLEAN NOT NULL DEFAULT FALSE, -- Habilitación por fase
  launch_phase VARCHAR(50) NOT NULL DEFAULT 'PHASE_BETA_LIMA'
);
CREATE INDEX idx_districts_launch ON public.districts(is_launch_zone);
```

---

## 5. Esquema Físico Relacional por Dominio

### 5.1. Dominio: Usuarios, Perfiles Públicos y Credenciales Privadas Segregadas

> **Protección de Datos Personales (Ley N° 29733):**  
> Para impedir que las contrapartes de una reserva extraigan el DNI, RUC o datos confidenciales del usuario, se segregan los datos en dos tablas: `profiles` (identidad pública general) y `profile_private_details` (documento de identidad y teléfono). La contraparte **nunca** tiene acceso directo a `profile_private_details`; el teléfono de contacto operativo solo se revela a través de funciones transaccionales seguras cuando la reserva se encuentra en estado `CONFIRMED` o `IN_PROGRESS`.

#### Tabla: `profiles` (Identidad Pública General)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role user_role_enum NOT NULL DEFAULT 'CLIENT', -- Protegido
  is_host_active BOOLEAN NOT NULL DEFAULT FALSE, -- Protegido
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### Tabla: `profile_private_details` (Datos Personales Estrictamente Confidenciales)
```sql
CREATE TABLE public.profile_private_details (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type_enum NOT NULL DEFAULT 'DNI',
  document_number VARCHAR(20) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_private_details_doc ON public.profile_private_details(document_type, document_number);
```

#### Trigger Protector Anti-Elevación de Privilegios en `profiles`
```sql
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Violación de seguridad: No tiene permisos para modificar su rol de usuario.'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.is_host_active != OLD.is_host_active AND auth.uid() = OLD.id THEN
      -- Solo activable tras aprobación KYC
      NEW.is_host_active = OLD.is_host_active;
    END IF;
  END IF;
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER trg_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();
```

#### Tabla: `host_verifications` (KYC de Anfitriones)
```sql
CREATE TABLE public.host_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name VARCHAR(200),
  ruc VARCHAR(11),
  legal_representative_name VARCHAR(200),
  document_front_storage_path TEXT NOT NULL, -- Bucket privado
  document_back_storage_path TEXT,          -- Bucket privado
  ownership_proof_storage_path TEXT,        -- Copia literal o recibo en bucket privado
  status verification_status_enum NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_host_verifications_user ON public.host_verifications(user_id);
```

---

### 5.2. Dominio: Establecimientos, Moderación y Ubicación Segregada

#### Tabla: `establishments`
```sql
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  establishment_type establishment_type_enum NOT NULL,
  ubigeo_code VARCHAR(6) NOT NULL REFERENCES public.districts(ubigeo_code),
  approximate_location geography(Point, 4326) NOT NULL, -- Coordenada perturbada (~500m)
  noise_curfew_time TIME,
  house_rules TEXT,
  
  -- Moderación y publicación obligatoria
  publishing_status publishing_status_enum NOT NULL DEFAULT 'DRAFT',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_establishments_host ON public.establishments(host_id);
CREATE INDEX idx_establishments_ubigeo ON public.establishments(ubigeo_code);
CREATE INDEX idx_establishments_status ON public.establishments(publishing_status, is_active);
CREATE INDEX idx_establishments_location ON public.establishments USING GIST(approximate_location);
```

#### Trigger de Validación de Publicación Exclusiva tras Aprobación
```sql
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

  -- 2. El establecimiento solo puede tener is_active = TRUE si está APROBADO
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

CREATE TRIGGER trg_check_establishment_publication_eligibility
BEFORE INSERT OR UPDATE ON public.establishments
FOR EACH ROW EXECUTE FUNCTION public.check_establishment_publication_eligibility();
```

#### Tabla: `establishment_locations_private` (Dirección Confidencial Segregada)
```sql
CREATE TABLE public.establishment_locations_private (
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
```

---

### 5.3. Dominio: Espacios, Recursos Compartidos y Múltiples Planes Tarifarios

#### Tabla: `spaces`
```sql
CREATE TABLE public.spaces (
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
CREATE INDEX idx_spaces_establishment ON public.spaces(establishment_id);
```

#### Tablas: `shared_resources` y `space_shared_resources`
```sql
CREATE TABLE public.shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.space_shared_resources (
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  shared_resource_id UUID NOT NULL REFERENCES public.shared_resources(id) ON DELETE CASCADE,
  is_exclusive_during_event BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (space_id, shared_resource_id)
);
```

#### Tabla: `space_pricing_plans` (Múltiples Planes Tarifarios Alternativos por Espacio)
```sql
CREATE TABLE public.space_pricing_plans (
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
CREATE INDEX idx_pricing_plans_space ON public.space_pricing_plans(space_id, is_active);
```

#### Tablas: `space_photos`, `space_seasonal_tariffs` y `space_discounts`
```sql
CREATE TABLE public.space_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption VARCHAR(150),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_space_photos_space ON public.space_photos(space_id, display_order);

CREATE TABLE public.space_seasonal_tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  season_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier NUMERIC(4,2) DEFAULT 1.00 CHECK (price_multiplier > 0),
  fixed_surcharge NUMERIC(12,2) DEFAULT 0.00 CHECK (fixed_surcharge >= 0),
  is_recurring_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_seasonal_dates CHECK (end_date >= start_date)
);

CREATE TABLE public.space_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_advance_days INTEGER DEFAULT 0 CHECK (min_advance_days >= 0),
  applies_weekdays_only BOOLEAN NOT NULL DEFAULT FALSE,
  coupon_code VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 5.4. Dominio: Disponibilidad Unificada (Bloqueos e iCal)

```sql
CREATE TABLE public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  block_type block_type_enum NOT NULL DEFAULT 'HOST_MANUAL',
  time_range TSTZRANGE NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_availability_blocks_range ON public.availability_blocks USING GIST(space_id, time_range);

ALTER TABLE public.availability_blocks ADD CONSTRAINT exclude_availability_blocks_overlapping
EXCLUDE USING gist (
  space_id WITH =,
  time_range WITH &&
);

CREATE TABLE public.calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL UNIQUE REFERENCES public.spaces(id) ON DELETE CASCADE,
  feed_token VARCHAR(64) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.external_calendar_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  subscription_name VARCHAR(100) NOT NULL,
  feed_url TEXT NOT NULL,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (sync_interval_minutes >= 15),
  last_synced_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20) DEFAULT 'IDLE' CHECK (last_sync_status IN ('IDLE', 'SUCCESS', 'FAILED')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 5.5. Dominio: Reservas y Snapshots Inmutables con Garantía Relacional

> **Garantía Relacional Declarativa de Snapshots:**  
> Para certificar de forma indestructible que `reservations.current_snapshot_id` pertenezca obligatoriamente a la misma reserva y no a otra ajena, `reservation_snapshots` cuenta con `UNIQUE (id, reservation_id)`. Luego, `reservations` vincula una clave foránea compuesta `FOREIGN KEY (current_snapshot_id, id) REFERENCES reservation_snapshots(id, reservation_id)`. Es matemáticamente imposible apuntar a un snapshot de otra reserva.

#### Tabla: `reservations`
```sql
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_code VARCHAR(20) NOT NULL UNIQUE,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE RESTRICT,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
  pricing_plan_id UUID NOT NULL REFERENCES public.space_pricing_plans(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  
  -- Puntero al Snapshot Económico Activo
  current_snapshot_id UUID,
  
  -- Rango temporal total con buffers incluidos
  event_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  time_range TSTZRANGE NOT NULL,
  
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  event_type event_type_enum NOT NULL,
  special_requests TEXT,
  
  -- Estados desacoplados
  status reservation_status_enum NOT NULL DEFAULT 'REQUESTED',
  dispute_status dispute_status_enum NOT NULL DEFAULT 'NONE',
  
  -- Plazos
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  host_response_deadline TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  payment_deadline TIMESTAMPTZ,
  payment_submitted_at TIMESTAMPTZ,
  host_verification_deadline TIMESTAMPTZ,
  correction_deadline TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT check_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_reservations_space ON public.reservations(space_id);
CREATE INDEX idx_reservations_client ON public.reservations(client_id);
CREATE INDEX idx_reservations_host ON public.reservations(host_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_dispute ON public.reservations(dispute_status);

ALTER TABLE public.reservations ADD CONSTRAINT exclude_space_overlapping_reservations
EXCLUDE USING gist (
  space_id WITH =,
  time_range WITH &&
)
WHERE (status IN ('ACCEPTED_WAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING', 'CONFIRMED', 'IN_PROGRESS'));
```

#### Tabla: `reservation_snapshots` (Estrictamente Append-Only)
```sql
CREATE TABLE public.reservation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  reason VARCHAR(100) NOT NULL DEFAULT 'INITIAL_AGREEMENT',
  
  pricing_plan_id UUID NOT NULL REFERENCES public.space_pricing_plans(id),
  pricing_mode_applied pricing_mode_enum NOT NULL,
  base_rental_price NUMERIC(12,2) NOT NULL,
  extra_hours_count NUMERIC(4,1) NOT NULL DEFAULT 0.0,
  extra_hours_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cleaning_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  
  seasonal_adjustments JSONB,
  discounts_applied JSONB,
  additional_services JSONB,
  
  tax_condition_applied tax_condition_enum NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  
  service_fee_platform NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  security_deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_contract_price NUMERIC(12,2) NOT NULL,
  required_advance_amount NUMERIC(12,2) NOT NULL,
  pending_balance_amount NUMERIC(12,2) NOT NULL,
  installments_schedule JSONB NOT NULL,
  
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  cancellation_policy_applied cancellation_policy_enum NOT NULL,
  snapshot_hash_sha256 TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_reservation_snapshot_version UNIQUE (reservation_id, version),
  CONSTRAINT uq_snapshot_id_reservation UNIQUE (id, reservation_id) -- Permite FK compuesta
);
CREATE INDEX idx_snapshots_reservation ON public.reservation_snapshots(reservation_id, version);

-- Declaración de la Foreign Key Compuesta que Garantiza Pertenencia
ALTER TABLE public.reservations 
ADD CONSTRAINT fk_reservations_current_snapshot 
FOREIGN KEY (current_snapshot_id, id) REFERENCES public.reservation_snapshots(id, reservation_id);

-- Inmutabilidad Absoluta
CREATE OR REPLACE FUNCTION public.prevent_snapshot_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operación denegada: Los snapshots económicos son registros legales estrictamente inmutables (append-only).'
    USING ERRCODE = '27000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_snapshot_modification
BEFORE UPDATE OR DELETE ON public.reservation_snapshots
FOR EACH ROW EXECUTE FUNCTION public.prevent_snapshot_modification();
```

#### Trigger de Validación de Integridad de Entidades en `reservations`
Garantiza que el espacio, establecimiento, anfitrión y plan tarifario coincidan exactamente:
```sql
CREATE OR REPLACE FUNCTION public.validate_reservation_entities_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_space_establishment_id UUID;
  v_establishment_host_id UUID;
  v_plan_space_id UUID;
BEGIN
  -- 1. Validar que el espacio pertenezca al establecimiento declarado
  SELECT establishment_id INTO v_space_establishment_id 
  FROM public.spaces WHERE id = NEW.space_id;
  
  IF v_space_establishment_id IS NULL OR v_space_establishment_id != NEW.establishment_id THEN
    RAISE EXCEPTION 'Inconsistencia relacional: El espacio no pertenece al establecimiento indicado.'
      USING ERRCODE = '23503';
  END IF;

  -- 2. Validar que el anfitrión sea el legítimo propietario del establecimiento
  SELECT host_id INTO v_establishment_host_id 
  FROM public.establishments WHERE id = NEW.establishment_id;
  
  IF v_establishment_host_id IS NULL OR v_establishment_host_id != NEW.host_id THEN
    RAISE EXCEPTION 'Inconsistencia relacional: El anfitrión indicado no es el propietario del establecimiento.'
      USING ERRCODE = '23503';
  END IF;

  -- 3. Validar que el plan tarifario pertenezca al espacio
  SELECT space_id INTO v_plan_space_id 
  FROM public.space_pricing_plans WHERE id = NEW.pricing_plan_id;
  
  IF v_plan_space_id IS NULL OR v_plan_space_id != NEW.space_id THEN
    RAISE EXCEPTION 'Inconsistencia relacional: El plan tarifario no corresponde al espacio contratado.'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_reservation_entities_integrity
BEFORE INSERT OR UPDATE OF space_id, establishment_id, host_id, pricing_plan_id ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_entities_integrity();
```

---

### 5.6. Control Bidireccional de Concurrencia y Recursos Compartidos

```sql
CREATE OR REPLACE FUNCTION public.check_bidirectional_availability_conflicts(
  p_space_id UUID,
  p_establishment_id UUID,
  p_time_range TSTZRANGE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_is_entire BOOLEAN;
  v_conflict_count INTEGER;
BEGIN
  -- 1. Bloqueo de fila sobre el establecimiento para serializar transacciones concurrentes
  PERFORM 1 FROM public.establishments WHERE id = p_establishment_id FOR UPDATE;

  -- 2. Colisión con bloqueos manuales o calendarios externos (availability_blocks)
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.availability_blocks ab
  JOIN public.spaces blocked_space ON blocked_space.id = ab.space_id
  JOIN public.spaces requested_space ON requested_space.id = p_space_id
  WHERE ab.establishment_id = p_establishment_id
    AND ab.time_range && p_time_range
    AND (
      ab.space_id = p_space_id
      OR blocked_space.is_entire_establishment
      OR requested_space.is_entire_establishment
      OR EXISTS (
        SELECT 1 FROM public.space_shared_resources a
        JOIN public.space_shared_resources b
          ON b.shared_resource_id = a.shared_resource_id
        WHERE a.space_id = p_space_id AND b.space_id = ab.space_id
          AND (a.is_exclusive_during_event OR b.is_exclusive_during_event)
      )
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Conflicto de disponibilidad: El espacio se encuentra bloqueado por mantenimiento o calendario externo para ese horario.'
      USING ERRCODE = '23P01';
  END IF;

  -- 3. Identificar si el espacio es el Establecimiento Completo
  SELECT is_entire_establishment INTO v_is_entire
  FROM public.spaces WHERE id = p_space_id;

  IF v_is_entire THEN
    -- CASO A: Establecimiento Completo contra CUALQUIER subespacio del establecimiento
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.reservations r
    WHERE r.establishment_id = p_establishment_id
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND r.status IN ('ACCEPTED_WAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND r.time_range && p_time_range;

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Conflicto jerárquico: No se puede reservar el establecimiento completo porque ya existen subespacios reservados en ese rango horario.'
        USING ERRCODE = '23P01';
    END IF;

  ELSE
    -- CASO B: Subespacio individual contra el Establecimiento Completo
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.reservations r
    JOIN public.spaces s ON r.space_id = s.id
    WHERE r.establishment_id = p_establishment_id
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND s.is_entire_establishment = TRUE
      AND r.status IN ('ACCEPTED_WAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND r.time_range && p_time_range;

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Conflicto jerárquico: No se puede reservar este subespacio porque el establecimiento completo ya está reservado para ese horario.'
        USING ERRCODE = '23P01';
    END IF;

    -- CASO C: Recursos compartidos exclusivos entre subespacios
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.reservations r
    JOIN public.space_shared_resources ssr_other ON r.space_id = ssr_other.space_id
    JOIN public.space_shared_resources ssr_new ON ssr_new.shared_resource_id = ssr_other.shared_resource_id
    WHERE ssr_new.space_id = p_space_id
      AND (ssr_new.is_exclusive_during_event = TRUE OR ssr_other.is_exclusive_during_event = TRUE)
      AND r.establishment_id = p_establishment_id
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
      AND r.status IN ('ACCEPTED_WAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND r.time_range && p_time_range;

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Conflicto de recursos compartidos: Este espacio comparte un recurso exclusivo que ya está en uso por otro subespacio en ese horario.'
        USING ERRCODE = '23P01';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trg_check_hierarchical_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ACCEPTED_WAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING', 'CONFIRMED', 'IN_PROGRESS') THEN
    PERFORM public.check_bidirectional_availability_conflicts(
      NEW.space_id,
      NEW.establishment_id,
      NEW.time_range,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservations_concurrency_check
BEFORE INSERT OR UPDATE OF status, time_range, space_id, establishment_id ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.trg_check_hierarchical_conflicts();
```

---

### 5.7. Dominio: Cuotas, Pagos Declarados, Modificaciones y Devoluciones

```sql
CREATE TABLE public.reservation_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
  description VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status installment_status_enum NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_reservation_installment UNIQUE (reservation_id, installment_number)
);

CREATE TABLE public.payment_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES public.reservation_installments(id),
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_declared NUMERIC(12,2) NOT NULL CHECK (amount_declared > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  payment_method payment_method_enum NOT NULL,
  operation_number VARCHAR(50) NOT NULL,
  proof_storage_path TEXT NOT NULL,
  
  status payment_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
  declared_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verification_deadline TIMESTAMPTZ NOT NULL,
  
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_payment_declarations_reservation ON public.payment_declarations(reservation_id);

CREATE TABLE public.reservation_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  
  proposed_start_time TIMESTAMPTZ NOT NULL,
  proposed_end_time TIMESTAMPTZ NOT NULL,
  proposed_time_range TSTZRANGE NOT NULL,
  proposed_guest_count INTEGER NOT NULL CHECK (proposed_guest_count > 0),
  proposed_services JSONB,
  
  price_difference NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.refund_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  cancellation_reason TEXT NOT NULL,
  
  calculated_refund_amount NUMERIC(12,2) NOT NULL CHECK (calculated_refund_amount >= 0),
  retained_penalty_amount NUMERIC(12,2) NOT NULL CHECK (retained_penalty_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_HOST_TRANSFER' 
    CHECK (status IN ('PENDING_HOST_TRANSFER', 'TRANSFERRED_BY_HOST', 'VERIFIED_BY_CLIENT', 'DISPUTED')),
  host_proof_storage_path TEXT,
  deadline_transfer_date DATE NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 5.8. Dominio: Garantías, Daños, Inventario y Actas Digitales

```sql
CREATE TABLE public.security_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE REFERENCES public.reservations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_DEPOSIT' 
    CHECK (status IN ('PENDING_DEPOSIT', 'HELD_BY_HOST', 'CLAIM_IN_PROCESS', 'RETURNED_FULL', 'RETURNED_PARTIAL', 'RETAINED_TOTAL', 'DISPUTED')),
  
  deadline_claim_timestamp TIMESTAMPTZ NOT NULL,
  deadline_return_date DATE NOT NULL,
  
  returned_amount NUMERIC(12,2) DEFAULT 0.00,
  retained_amount NUMERIC(12,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.damage_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.profiles(id),
  
  description TEXT NOT NULL,
  claimed_amount NUMERIC(12,2) NOT NULL CHECK (claimed_amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  
  repair_quote_storage_path TEXT,
  photographic_evidence_paths TEXT[] NOT NULL,
  
  client_response_deadline TIMESTAMPTZ NOT NULL,
  client_response_status VARCHAR(20) DEFAULT 'PENDING' CHECK (client_response_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTER_OFFER')),
  client_response_notes TEXT,
  
  resolution_status claim_resolution_status_enum NOT NULL DEFAULT 'OPEN',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'Inventario General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventories(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  initial_condition VARCHAR(50) NOT NULL DEFAULT 'GOOD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.delivery_acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  act_type VARCHAR(20) NOT NULL CHECK (act_type IN ('CHECK_IN', 'CHECK_OUT')),
  act_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  meter_readings JSONB,
  checklist_results JSONB NOT NULL,
  photos_storage_paths TEXT[],
  general_observations TEXT,
  
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.act_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_act_id UUID NOT NULL REFERENCES public.delivery_acts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES public.profiles(id),
  signer_role VARCHAR(10) NOT NULL CHECK (signer_role IN ('HOST', 'CLIENT')),
  signature_type VARCHAR(30) NOT NULL DEFAULT 'DIGITAL_CLICKWRAP',
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_act_signature_per_role UNIQUE (delivery_act_id, signer_role)
);
```

---

### 5.9. Dominio: Documentos, Mensajería, Reseñas, Soporte y Auditoría Inmutable

```sql
CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('RESERVATION_SUMMARY', 'RENTAL_CONTRACT', 'DELIVERY_ACT', 'DAMAGE_REPORT')),
  version INTEGER NOT NULL DEFAULT 1,
  file_storage_path TEXT NOT NULL,
  document_hash_sha256 TEXT NOT NULL,
  sunat_disclaimer_included BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message_text TEXT NOT NULL,
  attachments_storage_paths TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL')),
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
  
  rating_cleanliness INTEGER CHECK (rating_cleanliness BETWEEN 1 AND 5),
  rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
  rating_accuracy INTEGER CHECK (rating_accuracy BETWEEN 1 AND 5),
  rating_rules_compliance INTEGER CHECK (rating_rules_compliance BETWEEN 1 AND 5),
  overall_rating NUMERIC(3,2) NOT NULL CHECK (overall_rating BETWEEN 1.00 AND 5.00),
  
  public_comment TEXT,
  private_feedback TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_review_per_reservation_user UNIQUE (reservation_id, reviewer_id)
);

CREATE TABLE public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL UNIQUE REFERENCES public.reviews(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response_comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.favorite_spaces (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, space_id)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  reported_space_id UUID REFERENCES public.spaces(id),
  reported_user_id UUID REFERENCES public.profiles(id),
  reason VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  evidence_storage_paths TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'INVESTIGATING', 'ACTION_TAKEN', 'DISMISSED')),
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.dispute_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  appellant_id UUID NOT NULL REFERENCES public.profiles(id),
  appeal_reason TEXT NOT NULL,
  evidence_storage_paths TEXT[],
  superadmin_decision TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reservation_id UUID REFERENCES public.reservations(id),
  subject VARCHAR(150) NOT NULL,
  priority ticket_priority_enum NOT NULL DEFAULT 'MEDIUM',
  status ticket_status_enum NOT NULL DEFAULT 'OPEN',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.space_views_daily (
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  view_date DATE NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 1 CHECK (view_count > 0),
  unique_visitors_count INTEGER NOT NULL DEFAULT 1 CHECK (unique_visitors_count > 0),
  PRIMARY KEY (space_id, view_date)
);

CREATE TABLE public.analytics_daily_metrics (
  metric_date DATE NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_value NUMERIC(14,2) NOT NULL,
  PRIMARY KEY (metric_date, metric_name, dimensions)
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_audit_logs_record ON public.audit_logs(table_name, record_id);

CREATE TRIGGER trg_prevent_audit_logs_modification
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_snapshot_modification();
```

---

## 6. Funciones Transaccionales para Transiciones Seguras de Estado (RPCs)

> **Eliminación de Actualizaciones Directas Inseguras:**  
> Las transiciones críticas de estado en `reservations` quedan completamente vedadas a consultas `UPDATE` directas del cliente en PostgREST. Se ejecutan exclusivamente mediante funciones transaccionales `SECURITY DEFINER` que validan la sesión (`auth.uid()`), el rol, las ventanas temporales y la concurrencia.

### 6.1. Función: Aceptar Solicitud de Reserva (`rpc_accept_reservation`)
```sql
CREATE OR REPLACE FUNCTION public.rpc_accept_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
  v_res RECORD;
BEGIN
  -- 1. Obtener datos de la reserva con bloqueo FOR UPDATE
  SELECT * INTO v_res 
  FROM public.reservations 
  WHERE id = p_reservation_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validar que quien ejecuta sea el anfitrión propietario legítimo
  IF v_res.host_id != auth.uid() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'No autorizado: Solo el anfitrión asignado puede aceptar la solicitud.' USING ERRCODE = '42501';
  END IF;

  -- 3. Validar estado previo
  IF v_res.status != 'REQUESTED' THEN
    RAISE EXCEPTION 'Transición inválida: Solo solicitudes en REQUESTED pueden ser aceptadas.' USING ERRCODE = '22023';
  END IF;

  -- 4. Validar que la ventana de 24 horas no haya expirado
  IF timezone('utc'::text, now()) > v_res.host_response_deadline THEN
    -- No actualizar y luego RAISE: la excepción revierte el UPDATE.
    -- El job de expiración transaccional marca EXPIRED_NO_RESPONSE por separado.
    RAISE EXCEPTION 'Plazo expirado: la solicitud debe expirar mediante el job idempotente.' USING ERRCODE = '22023';
  END IF;

  -- 5. Validar ausencia de conflictos concurrentes antes de bloquear preventivamente
  PERFORM public.check_bidirectional_availability_conflicts(
    v_res.space_id, v_res.establishment_id, v_res.time_range, v_res.id
  );

  -- 6. Transicionar de estado y fijar la ventana de pago del cliente (24 horas)
  UPDATE public.reservations
  SET status = 'ACCEPTED_WAITING_PAYMENT',
      accepted_at = timezone('utc'::text, now()),
      payment_deadline = timezone('utc'::text, now()) + INTERVAL '24 hours',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

### 6.2. Función: Verificar Comprobante y Confirmar Reserva (`rpc_verify_payment_and_confirm`)
```sql
CREATE OR REPLACE FUNCTION public.rpc_verify_payment_and_confirm(
  p_reservation_id UUID,
  p_declaration_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_res RECORD;
  v_dec RECORD;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF v_res.host_id != auth.uid() AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'No autorizado: Solo el anfitrión puede verificar el pago.' USING ERRCODE = '42501';
  END IF;

  IF v_res.status NOT IN ('PAYMENT_SUBMITTED', 'PAYMENT_CORRECTION_PENDING') THEN
    RAISE EXCEPTION 'Transición inválida: No hay comprobante pendiente de verificación.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_dec FROM public.payment_declarations WHERE id = p_declaration_id FOR UPDATE;
  IF NOT FOUND OR v_dec.reservation_id != p_reservation_id THEN
    RAISE EXCEPTION 'Comprobante no corresponde a la reserva.' USING ERRCODE = '22023';
  END IF;

  -- Reglas mínimas para la verificación; completar validación de importe contra
  -- reservation_snapshots.required_advance_amount y conciliación de declaraciones.
  IF v_res.status <> 'PAYMENT_SUBMITTED' OR v_dec.status <> 'PENDING_VERIFICATION' THEN
    RAISE EXCEPTION 'No existe comprobante pendiente válido.' USING ERRCODE = '22023';
  END IF;
  IF v_dec.amount < (SELECT required_advance_amount
                     FROM public.reservation_snapshots
                     WHERE id = v_res.current_snapshot_id) THEN
    RAISE EXCEPTION 'Anticipo declarado insuficiente.' USING ERRCODE = '22023';
  END IF;
  -- Verificar además plazos y abonos acumulados antes de aprobar en la migración.
  -- 1. Marcar comprobante verificado
  UPDATE public.payment_declarations
  SET status = 'VERIFIED',
      verified_by = auth.uid(),
      verified_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_declaration_id;

  -- 2. Confirmar reserva en firme
  UPDATE public.reservations
  SET status = 'CONFIRMED',
      confirmed_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

---

## 7. Políticas de Seguridad por Fila (RLS) No Recursivas con Mínimo Privilegio

```sql
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_locations_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_seasonal_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.act_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_views_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

### 7.1. Políticas para `profiles` y `profile_private_details` (Cero Recursión)
```sql
-- Perfil público: Visible para cualquier usuario autenticado (datos no sensibles)
CREATE POLICY profiles_select_authenticated ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Detalles privados (DNI, Teléfono): Exclusivo para el titular o Superadmin
CREATE POLICY private_details_select_self ON public.profile_private_details
FOR SELECT USING (
  auth.uid() = user_id OR public.is_superadmin()
);

CREATE POLICY private_details_insert_self ON public.profile_private_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY private_details_update_self ON public.profile_private_details
FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
```

### 7.2. Políticas para `establishments` y `establishment_locations_private`
```sql
-- Catálogo de establecimientos: Público solo si está APROBADO y ACTIVO; o el anfitrión propietario; o Superadmin
CREATE POLICY establishments_select_rules ON public.establishments
FOR SELECT USING (
  (publishing_status = 'APPROVED' AND is_active = TRUE)
  OR host_id = auth.uid()
  OR public.is_superadmin()
);

CREATE POLICY establishments_insert_host ON public.establishments
FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY establishments_update_host ON public.establishments
FOR UPDATE USING (host_id = auth.uid() OR public.is_superadmin())
WITH CHECK (host_id = auth.uid() OR public.is_superadmin());

-- Ubicación confidencial segregada
CREATE POLICY location_private_select ON public.establishment_locations_private
FOR SELECT USING (
  -- 1. Anfitrión propietario
  EXISTS (
    SELECT 1 FROM public.establishments e 
    WHERE e.id = establishment_locations_private.establishment_id 
      AND e.host_id = auth.uid()
  )
  OR
  -- 2. Clientes con reserva CONFIRMED o IN_PROGRESS
  EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.establishment_id = establishment_locations_private.establishment_id
      AND r.client_id = auth.uid()
      AND r.status IN ('CONFIRMED', 'IN_PROGRESS')
  )
  OR
  -- 3. Superadministrador
  public.is_superadmin()
);
```

### 7.3. Políticas para `reservations` (Blindaje contra Mutaciones Directas)
```sql
-- Lectura: Solo partes de la reserva o Superadmin
CREATE POLICY reservations_select_parties ON public.reservations
FOR SELECT USING (
  client_id = auth.uid() OR host_id = auth.uid() OR public.is_superadmin()
);

-- Creación: Solo clientes autenticados en estado REQUESTED
CREATE POLICY reservations_insert_client ON public.reservations
FOR INSERT WITH CHECK (
  client_id = auth.uid() AND status = 'REQUESTED'
);

-- Ninguna política UPDATE para authenticated/anon: denegación por defecto.
-- NO crear reservations_update_guarded. El RLS no compara OLD/NEW y no protege columnas.
-- En migración: REVOKE UPDATE ON public.reservations FROM anon, authenticated;
-- Las mutaciones se ejecutan únicamente mediante RPC SECURITY DEFINER autorizadas,
-- con verificaciones de auth.uid(), pertenencia, estado, vigencia y auditoría.
-- El rol propietario de esas RPC debe ser controlado, no expuesto a clientes.
```

---

## 8. Protocolo de Pruebas Automatizadas Obligatorias

Para certificar la seguridad, integridad y concurrencia sin asumir éxito sin evidencia, se especifican las pruebas que se ejecutarán en `Vitest` contra el entorno local de Supabase:

1. **`test/security/rls-recursion.test.ts`:**
   - Ejecución de `SELECT * FROM profiles` con múltiples usuarios autenticados.
   - *Aserción:* Cero errores de recursión (`infinite recursion detected`).
2. **`test/security/profile-privacy.test.ts`:**
   - El Usuario A (Cliente) intenta consultar `profile_private_details` del Usuario B (Anfitrión).
   - *Aserción:* 0 filas retornadas por RLS. El DNI y teléfono personal jamás son expuestos.
3. **`test/security/privilege-escalation.test.ts`:**
   - Un cliente ejecuta `UPDATE profiles SET role = 'SUPERADMIN' WHERE id = auth.uid()`.
   - *Aserción:* Fallo bloqueado por trigger `protect_profile_fields` con código `42501`.
4. **`test/security/establishment-publishing.test.ts`:**
   - Un anfitrión intenta ejecutar `UPDATE establishments SET is_active = TRUE, publishing_status = 'APPROVED'`.
   - *Aserción:* Fallo bloqueado por trigger `check_establishment_publication_eligibility` con código `42501`.
5. **`test/integrity/snapshot-foreign-key.test.ts`:**
   - Intento de actualizar `reservations.current_snapshot_id` con un snapshot perteneciente a OTRA reserva distinta.
   - *Aserción:* Rechazo inmediato por violación de Foreign Key compuesta (`fk_reservations_current_snapshot`).
6. **`test/concurrency/hierarchical-conflicts.test.ts`:**
   - Transacción concurrente 1: Acepta reserva del Establecimiento Completo.
   - Transacción concurrente 2: Acepta reserva de un Subespacio en el mismo rango.
   - *Aserción:* Transacción 2 recibe excepción con código de PostgreSQL `23P01`.
7. **`test/concurrency/shared-resources.test.ts`:**
   - Dos subespacios distintos que comparten una cocina exclusiva intentan ser reservados en el mismo horario.
   - *Aserción:* Rechazo por colisión de recurso compartido exclusivo (código `23P01`).
8. **`test/transactions/state-transitions.test.ts`:**
   - Un cliente intenta llamar a `rpc_accept_reservation` (no autorizado).
   - El anfitrión intenta llamar a `rpc_accept_reservation` tras expirar la ventana de 24h (expirado).
   - El anfitrión confirma la reserva llamando a `rpc_verify_payment_and_confirm` (éxito y transición atómica a `CONFIRMED`).


---

## 9. Correcciones de seguridad y condiciones de implementación (revisión 2026-10-30)

**Esta sección prevalece cuando un ejemplo SQL anterior no cubra una condición. No significa que las migraciones estén listas.**

1. **Disponibilidad bidireccional:** tanto INSERT/UPDATE de reservas que ocupen tiempo como INSERT/UPDATE de `availability_blocks` deben bloquear primero la fila del establecimiento (`FOR UPDATE`) y comprobar conflictos en ambos sentidos, incluyendo espacios completos, subespacios, buffers, iCal y recursos exclusivos. La comprobación se hace con la misma transacción. DELETE de bloqueos requiere autorización, pero no genera una nueva colisión. Se debe implementar un trigger de bloqueo (no está implementado en los ejemplos precedentes) y probar transacciones simultáneas en conexiones independientes.
2. **Reservas:** denegar `UPDATE` directo a `anon` y `authenticated`; las RPC privilegiadas, con propietario confiable, validarán `auth.uid()`, estados y plazos. El diseño debe contemplar permisos de `INSERT` de solicitudes, su integridad y evitar manipulación de campos protegidos en la inserción. Un `WITH CHECK` no compara la fila anterior.
3. **RLS:** `ENABLE ROW LEVEL SECURITY` sin políticas no es funcionalidad completa. Antes de cada sprint implementar matrices de permisos SELECT/INSERT/UPDATE/DELETE por tabla y por actor; comprobar acceso con JWT real, no solo rol administrador. Revocar acceso público a funciones auxiliares, limitar `EXECUTE` de RPC, y evitar que el dueño de una función `SECURITY DEFINER` pueda ser controlado por usuarios finales. Usar `SET search_path = ''` y referencias calificadas en funciones nuevas; auditar todas las funciones existentes.
4. **Expiración:** un `RAISE EXCEPTION` revierte los cambios previos de la misma transacción. Un job idempotente separado actualizará estados expirados con bloqueo y auditoría. Una RPC de aceptación rechaza solicitudes vencidas sin intentar persistir una expiración y lanzar excepción a la vez.
5. **Comprobantes:** comprobar propiedad, monto exigible, comprobante pendiente, plazo de presentación y reglas de subsanación, no duplicidad de verificación y registro de quién y cuándo verificó. Los plazos de 12 h son obligaciones operativas; definir qué ocurre si el anfitrión no responde sin inventar cancelaciones.
6. **Integridad:** implementar FK compuestas o triggers transaccionales para garantizar coherencia de `availability_blocks(space_id, establishment_id)` y recursos compartidos del mismo establecimiento; no basta con confiar en datos del cliente.
7. **SQL de referencia:** la documentación contiene fragmentos SQL que dependen de tablas declaradas en otras secciones y no está ordenada como migración. No ejecutar concatenando bloques Markdown. Las migraciones deben ser atómicas, ordenadas y verificadas con `supabase db reset` **solo en entorno local desechable**.
8. **Impuestos:** no inferir exoneración ni obligación de IGV exclusivamente de DNI/RUC o tipo de cliente; requiere revisión tributaria peruana. Garantía reembolsable debe mostrarse separada del costo no reembolsable en RealPrice.
9. **Aceptación técnica:** no declarar este diseño 'blindado' ni 'auditado mediante pruebas' sin resultados reproducibles de SQL, RLS, concurrencia y regresión.
