-- ==============================================================================
-- LOKEATE — Migración: 20261101120000_auth_profiles_and_security.sql
-- Sprint 02: Autenticación, Perfiles Segregados y RLS No Recursivo
-- ==============================================================================

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos enumerados de Auth y Documentos Oficiales en el Perú
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('CLIENT', 'HOST', 'SUPERADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type_enum AS ENUM ('DNI', 'CE', 'RUC', 'PASSPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Función base de seguridad anti-recursión RLS (SECURITY DEFINER)
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

-- 4. Tabla: profiles (Identidad Pública General)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role user_role_enum NOT NULL DEFAULT 'CLIENT',
  is_host_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Tabla: profile_private_details (Datos Personales Confidenciales - Ley N° 29733)
CREATE TABLE IF NOT EXISTS public.profile_private_details (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type document_type_enum NOT NULL DEFAULT 'DNI',
  document_number VARCHAR(20) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_private_details_doc ON public.profile_private_details(document_type, document_number);

-- 6. Trigger protector anti-elevación de privilegios en profiles
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Violación de seguridad: No tiene permisos para modificar su rol de usuario.'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.is_host_active != OLD.is_host_active AND auth.uid() = OLD.id THEN
      -- Solo activable tras aprobación formal de moderación por el Superadministrador
      NEW.is_host_active = OLD.is_host_active;
    END IF;
  END IF;
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 7. Trigger de creación automática de perfil y detalles privados tras registro en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name VARCHAR(100);
  v_last_name VARCHAR(100);
  v_doc_type document_type_enum;
  v_doc_number VARCHAR(20);
  v_phone VARCHAR(20);
BEGIN
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_doc_type := COALESCE((NEW.raw_user_meta_data->>'document_type')::document_type_enum, 'DNI'::document_type_enum);
  v_doc_number := COALESCE(NEW.raw_user_meta_data->>'document_number', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  INSERT INTO public.profiles (id, first_name, last_name, role, is_host_active)
  VALUES (NEW.id, v_first_name, v_last_name, 'CLIENT', FALSE)
  ON CONFLICT (id) DO NOTHING;

  IF v_doc_number != '' THEN
    INSERT INTO public.profile_private_details (user_id, document_type, document_number, phone, email)
    VALUES (NEW.id, v_doc_type, v_doc_number, v_phone, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Políticas de Seguridad por Fila (RLS) No Recursivas con Mínimo Privilegio
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private_details ENABLE ROW LEVEL SECURITY;

-- Políticas en public.profiles
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Políticas en public.profile_private_details (Aislamiento de DNI y Teléfono)
DROP POLICY IF EXISTS private_details_select_self ON public.profile_private_details;
CREATE POLICY private_details_select_self ON public.profile_private_details
FOR SELECT USING (
  auth.uid() = user_id OR public.is_superadmin()
);

DROP POLICY IF EXISTS private_details_insert_self ON public.profile_private_details;
CREATE POLICY private_details_insert_self ON public.profile_private_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS private_details_update_self ON public.profile_private_details;
CREATE POLICY private_details_update_self ON public.profile_private_details
FOR UPDATE USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());
