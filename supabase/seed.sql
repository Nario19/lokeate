-- ========================================================
-- LOKEATE - Semilla de Datos Inicial (Seed)
-- Configuración Geográfica Oficial INEI para Lima y Zonas de Lanzamiento
-- ========================================================

-- Departamento de Lima
INSERT INTO public.departments (code, name) VALUES
  ('15', 'Lima')
ON CONFLICT (code) DO NOTHING;

-- Provincia de Lima
INSERT INTO public.provinces (code, department_code, name) VALUES
  ('1501', '15', 'Lima')
ON CONFLICT (code) DO NOTHING;

-- Distritos de Lima y Habilitación de Zonas de Lanzamiento Beta
INSERT INTO public.districts (ubigeo_code, province_code, name, is_launch_zone, launch_phase) VALUES
  -- Zonas Campestres Prioritarias para Eventos
  ('150110', '1501', 'Cieneguilla', TRUE, 'PHASE_BETA_LIMA'),
  ('150123', '1501', 'Pachacamac', TRUE, 'PHASE_BETA_LIMA'),
  ('150119', '1501', 'Lurín', TRUE, 'PHASE_BETA_LIMA'),
  ('150107', '1501', 'Chaclacayo', TRUE, 'PHASE_BETA_LIMA'),
  ('150118', '1501', 'Lurigancho-Chosica', TRUE, 'PHASE_BETA_LIMA'),

  -- Zonas Urbanas y Costeras para Terrazas y Salones
  ('150122', '1501', 'Miraflores', TRUE, 'PHASE_BETA_LIMA'),
  ('150104', '1501', 'Barranco', TRUE, 'PHASE_BETA_LIMA'),
  ('150131', '1501', 'San Isidro', TRUE, 'PHASE_BETA_LIMA'),
  ('150140', '1501', 'Santiago de Surco', TRUE, 'PHASE_BETA_LIMA'),
  ('150114', '1501', 'La Molina', TRUE, 'PHASE_BETA_LIMA'),
  ('150108', '1501', 'Chorrillos', TRUE, 'PHASE_BETA_LIMA'),
  ('150130', '1501', 'San Borja', TRUE, 'PHASE_BETA_LIMA'),

  -- Distritos en Reserva para Expansión Futura
  ('150101', '1501', 'Lima Cercado', FALSE, 'PHASE_EXPANSION_LIMA'),
  ('150133', '1501', 'San Miguel', FALSE, 'PHASE_EXPANSION_LIMA'),
  ('150120', '1501', 'Magdalena del Mar', FALSE, 'PHASE_EXPANSION_LIMA')
ON CONFLICT (ubigeo_code) DO NOTHING;
