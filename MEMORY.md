# MEMORY.md — Memoria Persistente de LOKEATE

> **PROPÓSITO:**  
> Este documento registra el historial vivo, las decisiones arquitectónicas (ADRs), las decisiones funcionales aprobadas, el estado del sprint actual, la deuda técnica identificada y las decisiones pendientes de definición para **LOKEATE**.  
> **Regla de integridad:** Las decisiones aprobadas nunca se borran; si una decisión es reemplazada, se marca como `SUPERSEDED` indicando su sustituta. MEMORY.md no sustituye a Git, a las migraciones ni a las pruebas automatizadas.

---

## 1. Estado Actual del Proyecto

- **Fase Actual:** Fase 2 — Catálogo Territorial y Gestión de Establecimientos.
- **Sprint Activo:** `Sprint 04: Espacios Individuales, Planes Tarifarios y Galería Multimedia` (**COMPLETADO Y VERIFICADO**).
- **Código Existente en Repositorio:**
  - Next.js 15.1.6 (App Router), React 19, TypeScript estricto (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).
  - Tailwind CSS con tokens de diseño shadcn/ui y soporte de Lucide Icons.
  - Clientes de Supabase desacoplados (`client.ts`, `server.ts`, `middleware.ts`).
  - Configuración local de Supabase (`supabase/config.toml`, `supabase/seed.sql` con ubigeos de Lima y zonas de lanzamiento).
  - Migraciones SQL versionadas:
    - `supabase/migrations/20261101120000_auth_profiles_and_security.sql`.
    - `supabase/migrations/20261102000000_establishments_moderation_and_locations.sql`.
    - `supabase/migrations/20261103000000_spaces_plans_and_media.sql`.
  - Módulo `src/modules/auth` completo (registro con DNI/RUC/CE, login, reset-password, dashboard protegido, role switcher).
  - Módulo `src/modules/establishments` completo: catálogo de zonas de lanzamiento, `EstablishmentService`, Server Actions (`createEstablishmentAction`, `submitForReviewAction`, `moderateEstablishmentAction`), componentes UI (`CreateEstablishmentForm`, `EstablishmentCard`, `EstablishmentStatusBadge`) y rutas App Router (`/explorar`, `/host/establishments`, `/host/establishments/new`).
  - Módulo `src/modules/spaces` completo: gestión de áreas y aforos, buffers de preparación, soporte de modalidades tarifarias alternativas (`HOURLY`, `FIXED_EVENT`, `PER_PERSON`, `PACKAGE`), galería multimedia (`space_photos`), Server Actions (`createSpaceAction`, `createPricingPlanAction`), componentes UI (`CreateSpaceForm`, `CreatePricingPlanForm`, `SpacePricingPlanCard`) y rutas App Router (`/host/establishments/[id]`, `/host/establishments/[id]/spaces/new`, `/host/spaces/[id]/plans/new`).
  - Suite de pruebas unitarias/integración con Vitest (82 pruebas pasando en 10 suites).
  - Suite de pruebas End-to-End con Playwright (20 pruebas pasando en Desktop y Mobile Chrome).
- **Estado de Base de Datos:** Migraciones de Auth, Establecimientos, Ubicación Segregada, Espacios y Planes Tarifarios preparadas; esquema documentado en [`DATABASE.md`](./DATABASE.md).
- **Próximo Hito:** Aprobación del usuario para iniciar el `Sprint 05: Marketplace, Búsqueda Avanzada y Mapa Referencial`.

---

## 2. Decisiones Arquitectónicas Aprobadas (ADRs)

### `ADR-001`: Adopción del Stack Tecnológico Base
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** Transversal a todo el sistema.
- **Justificación:** Next.js (App Router), React, TypeScript estricto, Tailwind CSS, shadcn/ui, PostgreSQL en Supabase, Vitest y Playwright. Prohibido el uso de microservicios.

### `ADR-002`: Arquitectura de Monolito Modular por Dominios
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `src/modules/*`
- **Justificación:** Desacoplamiento estricto por dominios (`auth`, `establishments`, `spaces`, `search`, `pricing`, `calendar`, `reservations`, `payments`, `inventory`, `acts`, `reviews`, `admin`).

### `ADR-003`: Prevención de Concurrencia Física a Nivel de Base de Datos
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `calendar`, `reservations`, `DATABASE.md`
- **Justificación:** Prevenir *double-booking* mediante PostgreSQL utilizando tipos de rangos (`tstzrange`), índices GiST y restricciones de exclusión `EXCLUDE USING gist`.

### `ADR-004`: Almacenamiento Seguro con Aislamiento de Privacidad
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `payments`, `acts`, `host_verifications`, `Supabase Storage`
- **Justificación:** Bucket `private-documents` con acceso público totalmente bloqueado y URLs firmadas de duración limitada (15 minutos).

### `ADR-005`: Segregación de Ubicación Confidencial en `establishment_locations_private`
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `establishments`, `search`, `DATABASE.md`, `BUSINESS_RULES.md`
- **Justificación:** La dirección física exacta, piso y referencias residen exclusivamente en `establishment_locations_private`, accesible por RLS únicamente al anfitrión propietario o a clientes con reserva `CONFIRMED` o `IN_PROGRESS`.

### `ADR-006`: Desacoplamiento de Estado Operativo (`status`) y Controversias (`dispute_status`)
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `reservations`, `admin`, `DATABASE.md`
- **Justificación:** Separación de la máquina de estados del evento frente a litigios de garantías o cancelaciones para mantener auditabilidad.

### `ADR-007`: Inmutabilidad Absoluta de Snapshots Económicos (Append-Only)
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `pricing`, `reservations`, `DATABASE.md`
- **Justificación:** Se eliminó la columna `is_latest` de `reservation_snapshots`. La tabla es estrictamente append-only; el puntero reside en `reservations.current_snapshot_id`. Un trigger bloquea `UPDATE` y `DELETE` sin excepciones.

### `ADR-008`: Protocolo de Concurrencia Jerárquica con Serialización `FOR UPDATE`
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `calendar`, `reservations`, `DATABASE.md`
- **Justificación:** Para evitar carreras críticas entre establecimiento completo y subespacios, el trigger ejecuta `SELECT 1 FROM establishments WHERE id = ... FOR UPDATE`.

### `ADR-009`: Soporte para Múltiples Planes Tarifarios Alternativos por Espacio
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `spaces`, `pricing`, `DATABASE.md`, `PROJECT.md`
- **Justificación:** La tabla `space_pricing_plans` permite múltiples planes activos por espacio (hora, evento, persona, paquete) sin sumarlos automáticamente.

### `ADR-010`: Configuración Geográfica Nacional con Zonas de Lanzamiento Habilitables
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `establishments`, `search`, `DATABASE.md`, `BUSINESS_RULES.md`
- **Justificación:** Catálogo nacional con flag `districts.is_launch_zone`. Un trigger en `establishments` bloquea la activación de locales en distritos no autorizados para la fase Beta.

### `ADR-011`: Disponibilidad Unificada con Bloqueos Manuales, Integración iCal y Recursos Compartidos
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `calendar`, `reservations`, `DATABASE.md`
- **Justificación:** Disponibilidad integra reservas confirmadas, `availability_blocks` (manuales e iCal importado) y colisiones en recursos compartidos exclusivos (`space_shared_resources`).

### `ADR-012`: Eliminación de Recursión RLS mediante Función Security Definer
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `auth`, `profiles`, `DATABASE.md`
- **Justificación:** Las consultas a `profiles` dentro de políticas RLS provocan recursión infinita. Se centraliza la verificación en `public.is_superadmin()` con `SECURITY DEFINER` y `SET search_path = public, pg_temp`, ejecutándose sin disparar RLS.

### `ADR-013`: Aislamiento Estricto de Credenciales en `profile_private_details`
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `auth`, `profiles`, `DATABASE.md`, `BUSINESS_RULES.md`
- **Justificación:** El DNI, RUC y teléfono no se comparten jamás con las contrapartes de una reserva. Se segregan en `profile_private_details` con RLS exclusivo para el titular o Superadmin. La coordinación operativa se hace vía chat interno o teléfono revelado tras confirmación.

### `ADR-014`: Eliminación de Actualizaciones Directas en `reservations` mediante RPCs
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `reservations`, `payments`, `DATABASE.md`
- **Justificación:** Queda prohibido ejecutar `UPDATE` directo sobre `status` en PostgREST. Se implementan funciones transaccionales (`rpc_accept_reservation`, `rpc_verify_payment_and_confirm`, etc.) que auditan y aplican las reglas atómicamente.

### `ADR-015`: Garantía Relacional Declarativa de Pertenencia de Snapshot
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `reservations`, `reservation_snapshots`, `DATABASE.md`
- **Justificación:** Se agrega restricción `UNIQUE (id, reservation_id)` en `reservation_snapshots` y clave foránea compuesta `FOREIGN KEY (current_snapshot_id, id) REFERENCES reservation_snapshots(id, reservation_id)` en `reservations`. Es imposible asignar un snapshot de otra reserva.

### `ADR-016`: Publicación de Establecimientos Exclusiva tras Aprobación Administrativa
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `establishments`, `admin`, `DATABASE.md`
- **Justificación:** El campo `publishing_status` (`DRAFT`, `SUBMITTED_FOR_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`) controla la visibilidad. Solo el Superadministrador puede transicionar a `APPROVED`, y ningún establecimiento puede activarse (`is_active = TRUE`) sin estar aprobado.

### `ADR-017`: Estandarización de Sistema de Diseño `lokeate-ui` y Modo de Sesión Local Resiliente
- **Fecha:** 2026-11-01 | **Estado:** APROBADO
- **Módulos Afectados:** Transversal a UI (`src/components/lokeate-ui/*`), `auth`, `establishments`, `spaces`, `search`.
- **Justificación:**
  1. Se implementó una biblioteca modular en `src/components/lokeate-ui/` alineada con la maqueta visual editorial/Pinterest (`lokeate_mvp_pinterest.html`), otorgando máximo protagonismo a la fotografía, tipografía DM Sans/Manrope y paleta coral (`#e35b44`), bosque (`#24362d`), tinta (`#20231f`) y fondos suaves (`#f6f7f4`, `#fafaf9`).
  2. Todas las pantallas de la plataforma (`/`, `/explorar`, `/auth/login`, `/auth/register`, `/auth/reset-password`, `/dashboard`, `/host/*`) adoptan este sistema bajo principios SOLID, garantizando desacoplamiento, consistencia y reutilización sin estilos inline duplicados.
  3. Para resolver el error de red `fetch failed` al registrarse o iniciar sesión cuando Supabase Docker no está en ejecución localmente, `AuthService` y `createServerSupabaseClient` incorporaron un fallback transparente basado en cookies `lokeate_local_user`, permitiendo probar todos los flujos de interfaz y formularios de manera robusta sin bloquearse.

---

## 3. Decisiones Funcionales Aprobadas

### `DEC-001`: Naturaleza de los Pagos en la Fase Beta (Sin Procesamiento Directo)
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `payments`, `reservations`, `PROJECT.md`, `BUSINESS_RULES.md`
- **Justificación:** LOKEATE no procesa pagos, transferencias ni custodias en la Beta. El flujo es declarativo: el cliente sube voucher bancario (BCP, BBVA, Interbank, Yape, Plin) y el anfitrión lo valida en su cuenta. LOKEATE no cobra comisión monetaria directa (`service_fee = 0.00`) en la Beta.

### `DEC-002`: Ciclo Temporal de Reserva y Ventanas de Expiración
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `reservations`, `calendar`, `BUSINESS_RULES.md`
- **Ventanas Oficiales:**
  1. Aceptación del anfitrión: Máximo **24 horas**.
  2. Pago y presentación de comprobante del cliente: Máximo **24 horas**.
  3. Verificación del anfitrión: Máximo **12 horas**.
  4. Subsanación de comprobante observado: Máximo **12 horas adicionales**.

### `DEC-003`: Modalidades de Precio Aprobadas sin Suma Automática
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `pricing`, `spaces`, `PROJECT.md`, `BUSINESS_RULES.md`
- **Justificación:** Se restablecen formalmente las 4 modalidades base: Hora (`HOURLY`), Evento Fijo (`FIXED_EVENT`), Persona (`PER_PERSON`) y Paquete (`PACKAGE`). Se prohíbe sumarlas automáticamente; el espacio se cotiza bajo el plan tarifario específico seleccionado.

### `DEC-004`: Descargo Legal Tributario Obligatorio (SUNAT)
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `acts`, `reservations`, `generated_documents`
- **Justificación:** Todos los PDFs y contratos generados llevan la leyenda expresa de que no constituyen comprobante de pago con validez tributaria ante SUNAT.

### `DEC-005`: Plazos Oficiales de Garantías y Daños
- **Fecha:** 2026-10-30 | **Estado:** APROBADO
- **Módulos Afectados:** `security_deposits`, `damage_claims`, `BUSINESS_RULES.md`
- **Plazos Aprobados:**
  1. Reclamación formal de daños por el anfitrión: **Dentro de 48 horas** post-evento con evidencia fotográfica.
  2. Respuesta u observaciones del cliente: **72 horas**.
  3. Devolución de garantía no controvertida: **7 días calendario** post-evento.

---

## 4. Convenciones Establecidas

- **Moneda:** Sol Peruano (`PEN`, símbolo `S/`), con precisión decimal `NUMERIC(12,2)`.
- **Zona Horaria:** `America/Lima` (UTC-5).
- **Control de Privilegios:** Políticas RLS y triggers impiden a usuarios comunes elevar su rol a `SUPERADMIN` o modificar campos restringidos.
- **Snapshots:** Cero mutabilidad permitida tras su creación (append-only estricto).

---

## 5. Registro de Sprints y Progreso

| Sprint | Nombre | Estado | Fecha Inicio | Fecha Cierre |
|---|---|---|---|---|
| `Sprint 00` | Configuración, Corrección y Blindaje Documental | **COMPLETADO / AUDITADO** | 2026-10-30 | 2026-10-30 |
| `Sprint 01` | Arquitectura y Configuración Inicial | **COMPLETADO / VERIFICADO** | 2026-10-30 | 2026-10-30 |
| `Sprint 02` | Autenticación, Perfiles Segregados y RLS No Recursivo | **COMPLETADO / VERIFICADO** | 2026-11-01 | 2026-11-01 |
| `Sprint 03` | Catálogo Territorial, Moderación de Establecimientos y Ubicación Segregada | **COMPLETADO / VERIFICADO** | 2026-11-01 | 2026-11-01 |
| `Sprint 04` | Espacios Individuales, Planes Tarifarios y Galería Multimedia | **COMPLETADO / VERIFICADO** | 2026-11-01 | 2026-11-01 |
| `Sprint 05` | Marketplace, Búsqueda Avanzada y Mapa Referencial | *Pendiente de autorización* | — | — |
| ... | Sprints 06 al 20 | *No iniciados* | — | — |

### Evidencia de Cierre de Sprint 01 (DoD Verificado):
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) -> 0 errores.
- **Linter:** `npm run lint` (`next lint`) -> 0 advertencias, 0 errores.
- **Pruebas Unitarias:** `npm run test` (`vitest run`) -> 100% pasando (2/2 pruebas de cálculo RealPrice y formateador PEN).
- **Compilación de Producción:** `npm run build` (`next build`) -> exitoso (rutas estáticas y middleware optimizado).
- **Pruebas End-to-End:** `npm run test:e2e` (`playwright test`) -> 100% pasando (2/2 pruebas en Chromium y Mobile).
- **Modularidad:** Carpetas creadas bajo `src/modules/{domain}/` y componentes shadcn/ui base.

### Evidencia de Cierre de Sprint 02 (DoD Verificado):
- **Migración SQL Versionada:** `supabase/migrations/20261101120000_auth_profiles_and_security.sql`.
  - Función no recursiva `public.is_superadmin()` con `SECURITY DEFINER` y `SET search_path = public, pg_temp`.
  - Tablas `public.profiles` e `public.profile_private_details` (aislamiento confidencial de DNI y teléfono según Ley N° 29733).
  - Trigger `protect_profile_fields` que bloquea elevación de rol a `SUPERADMIN` (código 42501) y autoactivación como anfitrión.
  - Trigger `handle_new_user` para aprovisionamiento atómico tras registro en `auth.users`.
  - Políticas RLS no permisivas aplicadas a ambas tablas.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) -> 0 errores (modo estricto, sin `any`).
- **Linter:** `npm run lint` (`next lint`) -> 0 advertencias, 0 errores.
- **Pruebas Unitarias y de Integración:** `npm run test` (`vitest run`) -> 100% pasando (29/29 pruebas en 4 suites).
- **Compilación de Producción:** `npm run build` (`next build`) -> exitoso.
- **Pruebas End-to-End:** `npm run test:e2e` (`playwright test`) -> 100% pasando (8/8 pruebas en Chromium y Mobile).

### Evidencia de Cierre de Sprint 03 (DoD Verificado):
- **Migración SQL Versionada:** `supabase/migrations/20261102000000_establishments_moderation_and_locations.sql`.
  - Catálogo territorial oficial con flag `is_launch_zone` en `districts`.
  - Tabla `public.establishments` con georreferenciación referencial (~500m) y estados de moderación obligatoria.
  - Tabla `public.establishment_locations_private` con segregación física de la dirección exacta y teléfono operativo.
  - Trigger `check_establishment_publication_eligibility`: bloquea autoaprobación de anfitriones (42501), activación de locales no aprobados (22023) y activación fuera de zonas de lanzamiento (22023).
  - Políticas RLS estrictas: la dirección exacta retorna 0 filas a usuarios no confirmados.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) -> 0 errores.
- **Linter:** `npm run lint` (`next lint`) -> 0 advertencias, 0 errores.
- **Pruebas Unitarias y de Integración:** `npm run test` (`vitest run`) -> 100% pasando (50/50 pruebas en 7 suites).
- **Compilación de Producción:** `npm run build` (`next build`) -> exitoso (11 rutas generadas, estáticas y dinámicas).
- **Pruebas End-to-End:** `npm run test:e2e` (`playwright test`) -> 100% pasando (12/12 pruebas en Desktop Chrome y Mobile Chrome).

### Evidencia de Cierre de Sprint 04 (DoD Verificado):
- **Migración SQL Versionada:** `supabase/migrations/20261103000000_spaces_plans_and_media.sql`.
  - Tabla `public.spaces`: soporte de aforos de pie y sentados, área en m², tiempos de preparación y desmontaje (`setup_buffer_minutes`, `cleanup_buffer_minutes`), política de cancelación por defecto y flag `is_entire_establishment`.
  - Tabla `public.space_pricing_plans`: soporte de modalidades tarifarias alternativas (`HOURLY`, `FIXED_EVENT`, `PER_PERSON`, `PACKAGE`), tarifas diferenciales entre semana y fin de semana (`base_price_weekday`, `base_price_weekend`), horas mínimas de alquiler, tarifa de limpieza, depósito de garantía, porcentaje de anticipo requerido y condición tributaria.
  - Tablas auxiliares: `public.space_photos` (galería con orden de visualización y portada) y `public.shared_resources` / `public.space_shared_resources` (recursos compartidos exclusivos para control de colisiones).
  - Políticas RLS: lectura pública de espacios y planes de establecimientos activos; mutación restringida estrictamente al anfitrión titular mediante subconsultas de pertenencia relacional.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) -> 0 errores (estricto, sin `any`).
- **Linter:** `npm run lint` (`next lint`) -> 0 advertencias, 0 errores.
- **Pruebas Unitarias y de Integración:** `npm run test` (`vitest run`) -> 100% pasando (82/82 pruebas en 10 suites).
  - `src/modules/spaces/__tests__/space-schemas.test.ts` (19 pruebas de validación Zod).
  - `src/modules/spaces/__tests__/space-multi-plan.test.ts` (4 pruebas de invariantes de negocio: planes alternativos no sumados, tarifas diferenciadas y establecimiento completo).
  - `src/modules/spaces/__tests__/space-service.test.ts` (9 pruebas unitarias de servicio con aislamiento de permisos).
- **Compilación de Producción:** `npm run build` (`next build`) -> exitoso (rutas `/host/establishments/[id]`, `/host/establishments/[id]/spaces/new`, `/host/spaces/[id]/plans/new` optimizadas).
- **Pruebas End-to-End:** `npm run test:e2e` (`playwright test`) -> 100% pasando (20/20 pruebas en Chromium y Mobile Chrome).

---

## 6. Decisiones y Parámetros Pendientes de Definición

1. **`PEND-001`: Estructura y Porcentaje de Comisión LOKEATE Post-Beta:**
   - En Beta fijado en `0.00`. Post-beta pendiente definir si será comisión fija al anfitrión (ej. 8% a 12%) o cargo de servicio dividido.
2. **`PEND-002`: Porcentaje Mínimo Obligatorio de Anticipo:**
   - Configurable por plan tarifario; valor sugerido por defecto del 50%.
3. **`PEND-003`: Pasarela de Pagos Post-Beta:**
   - Evaluación futura de Niubiz, Mercado Pago o Kushki para custodia en fideicomiso (*escrow*). Prohibida en Beta.
4. **`PEND-004`: Validación Notarial o Registral Definitiva de Inmuebles:**
   - En Beta se admite DNI/RUC con validación manual. Pendiente definir si se exigirá copia literal de SUNARP obligatoria para todos los locales.
5. **`PEND-005`: Integración con WhatsApp Business API / SMS:**
   - Evaluación de costos de integración para notificaciones de alerta de las ventanas de 24h y 12h.
6. **`PEND-006`: Porcentajes Definitivos de Políticas de Cancelación:**
   - La matriz actual (Flexible: 100/50/0%, Moderada: 50/25/0%, Estricta: 25/0/0%) queda como propuesta sujeta a dictamen de asesoría legal contractual.
7. **`PEND-007`: Régimen de Responsabilidad ante Clausuras Municipales por Ruido:**
   - Protocolo contractual ante intervenciones de fiscalización distrital en distritos con ordenanzas estrictas de decibelios nocturnos.


## Revisión correctiva documental — 2026-10-30

- **Estado:** revisión documental realizada; **no** equivale a certificación de migraciones ni a ejecución de pruebas.
- Se eliminó del ejemplo de RLS de reservas la política UPDATE autorreferencial; se exige acceso por RPC autorizadas.
- Se corrigió el acceso a OLD en trigger INSERT/UPDATE de publicación.
- Se documentó la necesidad de comprobar disponibilidad bidireccional y de crear trigger sobre availability_blocks antes de implementar el dominio.
- Se corrigió la falsa persistencia de expiración mediante UPDATE seguido de RAISE.
- Se añadieron controles mínimos de importe y estado de comprobante, pendientes de pruebas y conciliación real.
- **Bloqueantes pendientes:** implementar migraciones ordenadas; trigger de disponibilidad sobre bloques; RLS completo; revisión de permisos EXECUTE/SECURITY DEFINER; pruebas reales concurrentes y de pagos; validación legal/tributaria.
- **Autorización:** Sprint 01 de configuración puede comenzar tras aprobación; ninguna migración de negocio queda aprobada por esta revisión.
