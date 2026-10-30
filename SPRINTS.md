# SPRINTS.md — Plan de Implementación de LOKEATE (20 Sprints)

> **ESTADO DEL DOCUMENTO:** REVISADO, AUDITADO Y SINCRONIZADO (Fase 0 — Documentación Maestra)  
> **PROPÓSITO:**  
> Este documento detalla la hoja de ruta técnica y funcional en 20 sprints secuenciales para construir, verificar y desplegar la versión Beta de **LOKEATE**.  
> **Regla de Ejecución:** Cada sprint debe ejecutarse de forma individual y no se puede avanzar al siguiente sin haber cumplido todos los criterios de aceptación, pruebas y condiciones de cierre, previa autorización del usuario.

---

## Resumen de la Planificación en 20 Sprints

```
[Sprint 01-02] Cimientos: Arquitectura, Herramientas, Perfiles Segregados y RLS No Recursivo
      │
[Sprint 03-04] Gestión de Espacios: Moderación, Ubicación Segregada y Múltiples Planes
      │
[Sprint 05-06] Descubrimiento y Cotización: Marketplace, Búsqueda y Motor RealPrice
      │
[Sprint 07-09] Core Transaccional: Calendarios, Concurrencia Bidireccional y RPCs de Reserva
      │
[Sprint 10]    Hito Intermedio: Paneles de Control y Beta Cerrada
      │
[Sprint 11-14] Operativa Post-Confirmación: Modificaciones, Cancelaciones, Inventarios y Actas
      │
[Sprint 15-18] Servicios Complementarios: Documentos PDF, iCal Entrante/Saliente, Reseñas y Soporte
      │
[Sprint 19-20] Maduración y Lanzamiento: Analítica, Suite de Regresión Integral y Salida a Producción
```

---

## Detalle de Sprints

### Sprint 01: Arquitectura y Configuración Inicial
- **Objetivo:** Inicializar el proyecto con Next.js App Router, TypeScript estricto, Tailwind CSS, shadcn/ui, Supabase local, Vitest y Playwright, estableciendo la estructura modular del repositorio.
- **Historias de Usuario:**
  - `HU-01.1`: Como desarrollador, dispongo de un entorno local con Next.js, linter, typecheck y Tailwind configurados para escribir código seguro.
  - `HU-01.2`: Como desarrollador, dispongo de un entorno local de Supabase con migraciones reproducibles y soporte para tipos TypeScript autogenerados.
- **Tareas Técnicas:**
  - Inicializar repositorio Git y `.gitignore` estandarizado.
  - Inicializar Next.js con TypeScript estricto y App Router.
  - Configurar Tailwind CSS, `@/components/ui` con shadcn/ui y Lucide Icons.
  - Configurar Supabase CLI (`supabase init`, configuración local).
  - Configurar Vitest con Testing Library y Playwright para E2E.
  - Implementar estructura de carpetas modular en `src/modules/`.
- **Dependencias:** Ninguna (Sprint inicial de cimientos).
- **Entregables:** Repositorio estructurado y compilando, scripts de prueba en `package.json`, layout base funcional.
- **Pruebas Necesarias:** Prueba unitaria de humo en Vitest, prueba E2E de carga de página inicial con Playwright.
- **Criterios de Aceptación:**
  - `pnpm build` y `pnpm typecheck` ejecutan con 0 errores y 0 advertencias.
  - `pnpm test` y `pnpm test:e2e` pasan al 100%.
- **Condiciones de Cierre:** Repositorio limpio, pipelines verificados y registro en `MEMORY.md`.

---

### Sprint 02: Autenticación, Perfiles Segregados y RLS No Recursivo
- **Objetivo:** Implementar el flujo de autenticación mediante Supabase Auth con perfiles híbridos, segregación física de datos personales (`profile_private_details`), RLS no recursivo mediante `is_superadmin()` y triggers anti-elevación de privilegios.
- **Historias de Usuario:**
  - `HU-02.1`: Como usuario nuevo, puedo registrarme con correo y contraseña especificando mi DNI/CE y teléfono, los cuales quedan resguardados de forma confidencial.
  - `HU-02.2`: Como usuario autenticado, puedo alternar entre mi vista de Cliente y Anfitrión sin exponer mi documento de identidad a otros usuarios.
- **Tareas Técnicas:**
  - Función `public.is_superadmin()` con `SECURITY DEFINER` y `SET search_path = public, pg_temp` para eliminar recursión en políticas RLS.
  - Migración SQL de tablas `profiles` y `profile_private_details` con políticas RLS no permisivas.
  - Trigger `protect_profile_fields` que bloquea la mutación de `role` e `is_host_active` por usuarios comunes.
  - Server Actions para registro, inicio de sesión, cierre de sesión y recuperación de clave.
  - Formulario de registro con React Hook Form y validación de DNI peruano con Zod (8 dígitos numéricos).
  - Middleware de Next.js para protección de sesiones y rutas privadas (`/dashboard/*`).
- **Dependencias:** Sprint 01.
- **Entregables:** Módulo `src/modules/auth` completo con vistas, componentes y middleware activo.
- **Pruebas Necesarias:**
  - `test/security/rls-recursion.test.ts`: Verificar que las políticas de `profiles` no disparan recursión infinita.
  - `test/security/profile-privacy.test.ts`: Verificar que un usuario no puede leer `profile_private_details` de una contraparte.
  - `test/security/privilege-escalation.test.ts`: Verificar que un cliente no puede autoasignarse el rol `SUPERADMIN` (error 42501).
- **Criterios de Aceptación:**
  - Registro funcional con datos personales aislados.
  - Cero exposición de DNI entre usuarios.
- **Condiciones de Cierre:** Suite de pruebas verde y checklist de seguridad RLS verificado.

---

### Sprint 03: Catálogo Territorial, Moderación de Establecimientos y Ubicación Segregada
- **Objetivo:** Diseñar y construir el catálogo territorial con zonas de lanzamiento habilitables, el flujo de moderación de establecimientos (`publishing_status = 'APPROVED'`) y la segregación física de la dirección exacta en `establishment_locations_private`.
- **Historias de Usuario:**
  - `HU-03.1`: Como anfitrión, puedo dar de alta un establecimiento en un distrito habilitado para la fase de lanzamiento (Lima Metropolitana / Zonas Campestres).
  - `HU-03.2`: Como anfitrión, registro la dirección exacta sabiendo que solo se revelará a clientes con reserva confirmada.
  - `HU-03.3`: Como superadministrador, puedo moderar y aprobar locales antes de que se hagan visibles en el marketplace.
- **Tareas Técnicas:**
  - Migración SQL de tablas `departments`, `provinces`, `districts` con flag `is_launch_zone`.
  - Migración SQL de `establishments` y `establishment_locations_private`.
  - Trigger `check_establishment_publication_eligibility` que impide activar locales fuera de zonas de lanzamiento o sin aprobación previa.
  - Políticas RLS estrictas en `establishment_locations_private` denegando lectura pública.
  - Server Actions y formularios de registro de inmuebles con georreferenciación referencial perturbada (~500m).
- **Dependencias:** Sprint 02.
- **Entregables:** Módulo `src/modules/establishments` con gestión territorial, moderación y resguardo de ubicación.
- **Pruebas Necesarias:**
  - `test/security/establishment-publishing.test.ts`: Verificar que un anfitrión no puede autoaprobar su local (código 42501).
  - `test/security/location-privacy.test.ts`: Verificar que la dirección exacta retorna 0 filas a usuarios anónimos o clientes no confirmados.
- **Criterios de Aceptación:**
  - Un local no aprobado jamás aparece en búsquedas públicas.
- **Condiciones de Cierre:** Pruebas al 100% y documentación en `MEMORY.md`.

---

### Sprint 04: Espacios, Recursos Compartidos y Múltiples Planes Tarifarios
- **Objetivo:** Permitir a los anfitriones crear espacios individuales o la opción de "Establecimiento Completo", configurar recursos compartidos exclusivos y definir múltiples planes tarifarios alternativos por espacio.
- **Historias de Usuario:**
  - `HU-04.1`: Como anfitrión, puedo crear un espacio definiendo aforos, buffers de montaje/desmontaje y si alquila la propiedad completa.
  - `HU-04.2`: Como anfitrión, puedo publicar múltiples planes de precios para el mismo espacio (por hora, paquete integral, por persona o turno fijo).
  - `HU-04.3`: Como anfitrión, puedo asociar recursos compartidos (ej. piscina o cocina) indicando si su uso es exclusivo durante el evento.
- **Tareas Técnicas:**
  - Migración SQL de tablas `spaces`, `space_pricing_plans`, `shared_resources`, `space_shared_resources` y `space_photos`.
  - Configuración del bucket `public-media` en Supabase Storage para galerías de fotos.
  - Formulario de alta de espacios y configuración de múltiples planes tarifarios.
- **Dependencias:** Sprint 03.
- **Entregables:** Módulo `src/modules/spaces` con soporte multi-plan y recursos compartidos.
- **Pruebas Necesarias:** Validación de que un espacio puede tener más de un plan tarifario activo; pruebas de validación Zod de horas mínimas y aforos.
- **Criterios de Aceptación:**
  - Espacio creado con al menos un plan tarifario configurado y galería visible.
- **Condiciones de Cierre:** Pruebas aprobadas y registro de cambios en `MEMORY.md`.

---

### Sprint 05: Marketplace y Búsqueda
- **Objetivo:** Desarrollar el portal público de exploración de espacios con filtros avanzados por ubicación en zonas activas, aforo, tipo de evento y mapa interactivo.
- **Historias de Usuario:**
  - `HU-05.1`: Como visitante, puedo buscar espacios filtrando por distrito, fecha proyectada, número de invitados y tipo de evento.
  - `HU-05.2`: Como visitante, puedo ver la ficha pública de un espacio con su galería, aforo, servicios, planes tarifarios y precio referencial.
- **Tareas Técnicas:**
  - Módulo `src/modules/search` con Server Components para renderizado optimizado por SEO.
  - Filtros URL reactivos (`useSearchParams`) y paginación.
  - Tarjetas de espacios con badges de aforo, planes tarifarios disponibles y servicios destacados.
- **Dependencias:** Sprint 04.
- **Entregables:** Página de inicio (`/`) y página de catálogo (`/explorar`) con filtros activos.
- **Pruebas Necesarias:** Pruebas unitarias de filtrado; prueba E2E de búsqueda y apertura de detalle de espacio.
- **Criterios de Aceptación:**
  - Búsqueda por distrito retorna únicamente locales de esa zona.
  - La dirección exacta no se expone en la ficha pública.
- **Condiciones de Cierre:** Suite de pruebas verde y aprobación del diseño de tarjetas.

---

### Sprint 06: Motor RealPrice y Cotizaciones Formales
- **Objetivo:** Construir el motor de cálculo exacto de RealPrice en Soles (PEN) según el plan tarifario seleccionado, tarifas estacionales, descuentos e impuestos configurables, soportando la emisión de cotizaciones formales.
- **Historias de Usuario:**
  - `HU-06.1`: Como cliente, selecciono un plan tarifario (por hora, paquete, persona o evento) y veo el desglose exacto de RealPrice en tiempo real.
  - `HU-06.2`: Como cliente, puedo solicitar una cotización formal que congele los términos económicos por un plazo determinado.
- **Tareas Técnicas:**
  - Módulo `src/modules/pricing` con funciones puras de cálculo matemático en `NUMERIC(12,2)` para las 4 modalidades aprobadas.
  - Lógica de aplicación de recargos por feriados peruanos (`space_seasonal_tariffs`) y cupones (`space_discounts`).
  - Migración y lógica de `quotations` (cotizaciones formales).
- **Dependencias:** Sprint 05.
- **Entregables:** Motor de cálculo universal y widget interactivo de cotización formal.
- **Pruebas Necesarias:** Batería exhaustiva de pruebas unitarias (`test/pricing.test.ts`) cubriendo las 4 modalidades y asegurando que no se sumen indebidamente.
- **Criterios de Aceptación:**
  - El cálculo coincide al centavo con la suma de conceptos y no existen cargos ocultos.
- **Condiciones de Cierre:** Cobertura de pruebas unitarias superior al 95% en `src/modules/pricing`.

---

### Sprint 07: Calendario, Concurrencia Bidireccional y Bloqueos
- **Objetivo:** Implementar la visualización de calendarios interactivos, gestión de bloqueos manuales, sincronización iCal saliente/entrante y control estricto de concurrencia bidireccional a nivel de base de datos.
- **Historias de Usuario:**
  - `HU-07.1`: Como cliente, veo en el calendario qué fechas y turnos están libres u ocupados en tiempo real.
  - `HU-07.2`: Como anfitrión, puedo bloquear fechas manualmente o conectar mi calendario de Airbnb/Google vía iCal.
- **Tareas Técnicas:**
  - Módulo `src/modules/calendar`.
  - Migración de `availability_blocks`, `calendar_feeds` y `external_calendar_subscriptions`.
  - Restricción de exclusión física GiST (`EXCLUDE USING gist`) en `reservations` y `availability_blocks`.
  - Función atómica `check_bidirectional_availability_conflicts` con serialización pesimista (`FOR UPDATE`) verificando:
    1. Bloqueos manuales y calendarios externos.
    2. Establecimiento completo vs. subespacios (bidireccional).
    3. Recursos compartidos exclusivos entre subespacios.
- **Dependencias:** Sprint 06.
- **Entregables:** Calendario visual reactivo con protección física contra solapamientos.
- **Pruebas Necesarias:**
  - `test/concurrency/hierarchical-conflicts.test.ts`: Dos transacciones simultáneas compitiendo (una es rechazada con código `23P01`).
  - `test/concurrency/shared-resources.test.ts`: Dos subespacios compitiendo por un recurso exclusivo compartido.
  - `test/concurrency/availability-blocks.test.ts`: Intento de reserva sobre fecha con bloqueo iCal externo.
- **Criterios de Aceptación:**
  - Es físicamente imposible insertar dos reservas solapadas en la base de datos.
- **Condiciones de Cierre:** Cero colisiones en pruebas concurrentes.

---

### Sprint 08: Solicitudes, Snapshots con Integridad Relacional y RPCs de Aceptación
- **Objetivo:** Desarrollar el flujo formal de envío de solicitudes de reserva, la generación de snapshots económicos estrictamente inmutables con clave foránea compuesta, y la función transaccional `rpc_accept_reservation`.
- **Historias de Usuario:**
  - `HU-08.1`: Como cliente, puedo enviar una solicitud de reserva detallando mi evento y plan tarifario elegido.
  - `HU-08.2`: Como anfitrión, puedo revisar la solicitud y aceptarla en un plazo de 24 horas mediante la RPC segura.
- **Tareas Técnicas:**
  - Módulo `src/modules/reservations` con creación de registros en estado `REQUESTED`.
  - Creación del snapshot en `reservation_snapshots` y asignación de `reservations.current_snapshot_id`.
  - Clave foránea compuesta `FOREIGN KEY (current_snapshot_id, id) REFERENCES reservation_snapshots(id, reservation_id)`.
  - Trigger `validate_reservation_entities_integrity` (valida coherencia de espacio, anfitrión y plan).
  - Función transaccional `rpc_accept_reservation` (bloquea preventivamente y fija ventana de 24h para el anticipo).
  - Desactivación de `UPDATE` directo desde cliente en PostgREST.
- **Dependencias:** Sprint 07.
- **Entregables:** Flujo de solicitud y aceptación blindado por RPC y snapshots inmutables.
- **Pruebas Necesarias:**
  - `test/integrity/snapshot-foreign-key.test.ts`: Intento de asignar un snapshot ajeno (violación de FK).
  - `test/integrity/snapshots-immutability.test.ts`: Intento de mutar un snapshot existente (código `27000`).
  - `test/transactions/state-transitions.test.ts`: Ejecución de `rpc_accept_reservation` verificando ventanas y roles.
- **Criterios de Aceptación:**
  - Al aceptar, la reserva pasa a `ACCEPTED_WAITING_PAYMENT` y bloquea preventivamente la fecha.
- **Condiciones de Cierre:** Pruebas superadas y documentación en `MEMORY.md`.

---

### Sprint 09: Anticipos, Subsanación y Confirmación por RPC
- **Objetivo:** Implementar la carga del comprobante de anticipo por el cliente (ventana 24h), la verificación y confirmación mediante `rpc_verify_payment_and_confirm`, y la ventana de subsanación (12h).
- **Historias de Usuario:**
  - `HU-09.1`: Como cliente, subo mi comprobante bancario (BCP/BBVA/Yape/Plin) dentro de las 24 horas posteriores a la aceptación.
  - `HU-09.2`: Como anfitrión, valido el abono en mi cuenta en 12h mediante RPC transaccional para confirmar la reserva.
  - `HU-09.3`: Como cliente, dispongo de 12 horas para subsanar un comprobante observado antes de que la reserva expire.
- **Tareas Técnicas:**
  - Módulo `src/modules/payments` con tablas `reservation_installments` y `payment_declarations`.
  - Configuración del bucket privado `private-documents` con URLs firmadas temporales (15 min).
  - Función transaccional `rpc_verify_payment_and_confirm` (confirma la reserva y valida el comprobante atómicamente).
  - Al confirmarse la reserva, la política RLS de `establishment_locations_private` habilita automáticamente la visualización de la dirección exacta al cliente.
- **Dependencias:** Sprint 08.
- **Entregables:** Circuito cerrado de confirmación de reserva con validación de pagos en la Beta.
- **Pruebas Necesarias:**
  - Verificación de que la dirección exacta se revela al cliente únicamente tras alcanzar el estado `CONFIRMED`.
  - Prueba de flujo de subsanación de comprobante en 12 horas.
- **Criterios de Aceptación:**
  - Tras la verificación del anfitrión, la reserva pasa a `CONFIRMED` y el calendario queda bloqueado en firme.
- **Condiciones de Cierre:** Cero brechas en el bucket privado y suite de pruebas verde.

---

### Sprint 10: Paneles de Control y Beta Limitada
- **Objetivo:** Integrar los paneles de control de Cliente y Anfitrión, y desplegar la primera versión funcional para pruebas en Beta cerrada en Lima.
- **Historias de Usuario:**
  - `HU-10.1`: Como cliente, tengo un panel con la lista de mis reservas activas, solicitudes pendientes y cronograma de saldos.
  - `HU-10.2`: Como anfitrión, tengo un panel consolidado con mi calendario, ingresos proyectados y alertas de acciones urgentes.
- **Tareas Técnicas:**
  - Dashboard del cliente (`/dashboard/client`).
  - Dashboard del anfitrión (`/dashboard/host`).
  - Despliegue en entorno de Staging en Vercel con Supabase configurado.
- **Dependencias:** Sprints 01 al 09.
- **Entregables:** Hito de producto completo: versión Beta navegable y funcional de extremo a extremo.
- **Pruebas Necesarias:** Suite completa de regresión (Vitest + Playwright) sobre todo el flujo principal.
- **Criterios de Aceptación:**
  - Un usuario puede registrarse, listar un espacio con múltiples planes, buscarlo, solicitarlo, cargar voucher y confirmarlo en staging.
- **Condiciones de Cierre:** Reporte de pruebas completo y aprobación del hito Beta en `MEMORY.md`.

---

### Sprint 11: Modificaciones de Reservas con Versionamiento de Snapshots
- **Objetivo:** Permitir a clientes y anfitriones proponer cambios de fechas o servicios sobre reservas confirmadas preservando los acuerdos previos y generando un nuevo snapshot versionado si se aprueba.
- **Historias de Usuario:**
  - `HU-11.1`: Como cliente o anfitrión, puedo proponer un cambio de fecha u horario para una reserva confirmada.
  - `HU-11.2`: Como contraparte, puedo aceptar la propuesta sabiendo que se genera un nuevo snapshot económico, o rechazarla manteniendo la reserva previa.
- **Tareas Técnicas:**
  - Tabla `reservation_modifications` con control de estados (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`).
  - Validación de que la nueva fecha propuesta esté totalmente libre de conflictos en el calendario y recursos compartidos.
  - Generación de snapshot $v_{n+1}$ en `reservation_snapshots` y actualización del puntero `reservations.current_snapshot_id`.
- **Dependencias:** Sprint 10.
- **Entregables:** Flujo de modificación formal sin anulación intempestiva de contratos.
- **Pruebas Necesarias:** Pruebas unitarias de preservación de estado; pruebas de conflicto de fechas en propuestas.
- **Criterios de Aceptación:**
  - Si una propuesta se rechaza, la reserva previa sigue confirmada sin alteraciones.
- **Condiciones de Cierre:** Pruebas aprobadas y registradas en `MEMORY.md`.

---

### Sprint 12: Cancelaciones y Devoluciones Informativas
- **Objetivo:** Implementar la lógica de cancelación según las políticas Flexible, Moderada y Estricta (parametrizadas), calculando importes a reembolsar.
- **Historias de Usuario:**
  - `HU-12.1`: Como cliente, puedo cancelar una reserva conociendo el porcentaje de devolución aplicable según la anticipación.
  - `HU-12.2`: Como anfitrión, puedo registrar la constancia bancaria de la devolución efectuada al cliente en caso de cancelación aplicable.
- **Tareas Técnicas:**
  - Lógica matemática de cálculo de penalidades y retenciones según días de anticipación al evento.
  - Transición de estados a `CANCELLED_BY_CLIENT` o `CANCELLED_BY_HOST`.
  - Creación de registro en `refund_records` y liberación inmediata del calendario.
- **Dependencias:** Sprint 10.
- **Entregables:** Módulo de cancelaciones con liquidación informativa de devoluciones.
- **Pruebas Necesarias:** Pruebas unitarias para todas las matrices de cancelación (30 días, 15 días, 7 días).
- **Criterios de Aceptación:**
  - El sistema muestra el monto exacto a devolver y libera la fecha para nuevas reservas.
- **Condiciones de Cierre:** Suite de pruebas verde.

---

### Sprint 13: Inventario y Garantías por Daños
- **Objetivo:** Desarrollar el módulo de inventarios de bienes del local y la gestión del depósito en garantía ajustado a los plazos oficiales (48h reclamo / 72h respuesta / 7 días devolución).
- **Historias de Usuario:**
  - `HU-13.1`: Como anfitrión, puedo registrar el inventario de mi local (mobiliario, equipos, estado de conservación).
  - `HU-13.2`: Como anfitrión, dispongo de 48 horas post-evento para abrir un expediente de daños con fotos y cotización formal.
  - `HU-13.3`: Como cliente, dispongo de 72 horas para formular descargos ante un reclamo de garantía.
- **Tareas Técnicas:**
  - Migración SQL de tablas `inventories`, `inventory_items`, `security_deposits` y `damage_claims`.
  - Cronómetros automáticos para las ventanas de 48h (reclamo) y 72h (descargo).
  - Alerta de devolución obligatoria de garantía no controvertida a los 7 días calendario.
- **Dependencias:** Sprint 10.
- **Entregables:** Módulo `src/modules/inventory` y expediente digital de daños.
- **Pruebas Necesarias:** Pruebas de integración de apertura de reclamo de daños dentro de 48h y rechazo si es extemporáneo.
- **Criterios de Aceptación:**
  - Los plazos de garantía se cumplen con precisión de reloj en base de datos.
- **Condiciones de Cierre:** Pruebas aprobadas.

---

### Sprint 14: Ejecución y Cierre de Eventos (Actas Digitales)
- **Objetivo:** Implementar las Actas Digitales de Entrega (Check-in) y Devolución (Check-out) con checklist, fotos de evidencia y firmas digitales clickwrap.
- **Historias de Usuario:**
  - `HU-14.1`: Como anfitrión y cliente, completamos y firmamos digitalmente el Acta de Entrega al ingresar al local con fotos del estado inicial.
  - `HU-14.2`: Como anfitrión y cliente, completamos el Acta de Devolución al término del evento, certificando la conformidad para la devolución de la garantía.
- **Tareas Técnicas:**
  - Módulo `src/modules/acts` con tablas `delivery_acts` y `act_signatures`.
  - Captura de IP y User-Agent al firmar el acta digital.
  - Bloqueo inmutable (`is_locked = TRUE`) una vez firmada por ambas partes.
- **Dependencias:** Sprint 13.
- **Entregables:** Módulo de Actas operativas con trazabilidad de entrega y salida.
- **Pruebas Necesarias:** Pruebas de integración de registro de actas y bloqueo de edición una vez firmadas.
- **Criterios de Aceptación:**
  - Las actas firmadas quedan inmutables en el historial de la reserva.
- **Condiciones de Cierre:** Pruebas aprobadas y registradas en `MEMORY.md`.

---

### Sprint 15: Documentos PDF e Integración iCal Completa
- **Objetivo:** Generar resúmenes de reserva y contratos privados en PDF con descargo SUNAT obligatorio, exportación de calendarios iCal salientes e importación periódica de calendarios externos en la Beta.
- **Historias de Usuario:**
  - `HU-15.1`: Como cliente y anfitrión, descargo en PDF el Contrato Privado con el descargo legal tributario de SUNAT.
  - `HU-15.2`: Como anfitrión, obtengo mi feed iCal privado para sincronizar mis reservas en Google Calendar y registro URLs iCal externas de Airbnb para bloquear fechas en LOKEATE.
- **Tareas Técnicas:**
  - Generador de PDF en servidor con cálculo de hash SHA256 en `generated_documents`.
  - Inclusión obligatoria de la leyenda legal SUNAT en todos los documentos.
  - Endpoint de exportación `.ics` protegido por token privado (`calendar_feeds`).
  - Worker/Servicio de importación periódica de feeds externos (`external_calendar_subscriptions`) que genera `availability_blocks`.
- **Dependencias:** Sprint 10 y 14.
- **Entregables:** Descarga de contratos en PDF e integración iCal bidireccional (feed + importador).
- **Pruebas Necesarias:** Pruebas unitarias de generación de feed iCal e importación con bloqueo de disponibilidad.
- **Criterios de Aceptación:**
  - Los eventos externos bloquean con éxito el calendario de LOKEATE.
- **Condiciones de Cierre:** Documentos validados y pruebas verdes.

---

### Sprint 16: Reseñas, Favoritos y Promociones
- **Objetivo:** Desarrollar el sistema bidireccional de reseñas y calificaciones con publicación ciega tras la culminación del evento, y la lista de espacios favoritos.
- **Historias de Usuario:**
  - `HU-16.1`: Como cliente, puedo calificar el espacio y al anfitrión tras culminar mi evento (`COMPLETED`).
  - `HU-16.2`: Como visitante o cliente, puedo guardar espacios en mi lista personal de favoritos.
- **Tareas Técnicas:**
  - Módulo `src/modules/reviews` con tablas `reviews` y `review_responses`.
  - Lógica de publicación ciega (se publican al opinar ambos o a los 14 días).
  - Cálculo de promedio de calificación y actualización en la ficha del espacio.
- **Dependencias:** Sprint 14.
- **Entregables:** Sistema de reputación pública y gestión de favoritos.
- **Pruebas Necesarias:** Pruebas unitarias de elegibilidad (solo reservas `COMPLETED`); prueba de cálculo de promedios.
- **Criterios de Aceptación:**
  - Ningún usuario puede calificar un espacio si no completó una reserva en él.
- **Condiciones de Cierre:** Pruebas aprobadas.

---

### Sprint 17: Moderación, Apelaciones y Cierre Administrativo
- **Objetivo:** Construir herramientas para el Superadministrador para moderar espacios, verificar anfitriones, atender denuncias y ejecutar cierres administrativos (`CLOSED_ADMINISTRATIVELY`).
- **Historias de Usuario:**
  - `HU-17.1`: Como superadministrador, puedo revisar y aprobar/rechazar solicitudes de verificación de anfitriones (DNI/RUC).
  - `HU-17.2`: Como superadministrador, puedo mediar en controversias y ejecutar cierres administrativos fundamentados.
- **Tareas Técnicas:**
  - Módulo `src/modules/admin` con panel de moderación, denuncias (`reports`) y apelaciones (`dispute_appeals`).
  - Gestión del campo desacoplado `dispute_status`.
- **Dependencias:** Sprint 10.
- **Entregables:** Panel de administración y gestión de controversias.
- **Pruebas Necesarias:** Pruebas de integración de permisos (solo rol `SUPERADMIN` accede al módulo).
- **Criterios de Aceptación:**
  - Un espacio denunciado con causa puede ser pausado inmediatamente por el administrador.
- **Condiciones de Cierre:** Permisos estrictamente validados en pruebas de seguridad.

---

### Sprint 18: Soporte al Usuario y Privacidad (Ley N° 29733)
- **Objetivo:** Implementar centro de ayuda, gestión de solicitudes ARCO de privacidad y tickets de soporte al usuario.
- **Historias de Usuario:**
  - `HU-18.1`: Como usuario, accedo a una sección de preguntas frecuentes y normativa municipal sobre ruido y licencias en distritos de Lima.
  - `HU-18.2`: Como usuario, puedo ejercer mis derechos de acceso, rectificación y cancelación de mis datos personales.
- **Tareas Técnicas:**
  - Módulo de soporte con tablas `support_tickets` y `ticket_messages`.
  - Vistas informativas sobre normativa peruana de eventos.
  - Endpoint seguro para solicitud de baja y anonimización de datos de perfil.
- **Dependencias:** Sprint 17.
- **Entregables:** Centro de ayuda y políticas de privacidad activas.
- **Pruebas Necesarias:** Verificación de políticas de anonimización de datos sin romper integridad referencial en reservas históricas.
- **Criterios de Aceptación:**
  - Cumplimiento formal con directivas de la Autoridad Nacional de Protección de Datos Personales.
- **Condiciones de Cierre:** Pruebas aprobadas.

---

### Sprint 19: Analítica y Reportes Operativos
- **Objetivo:** Dotar a los anfitriones y administradores de métricas de ocupación, estacionalidad de eventos e ingresos brutos acumulados.
- **Historias de Usuario:**
  - `HU-19.1`: Como anfitrión, puedo consultar gráficos de mis fechas con mayor demanda, ingresos generados y tasa de conversión de solicitudes.
  - `HU-19.2`: Como superadministrador, visualizo el volumen total de transacciones declaradas y espacios activos por zona de lanzamiento.
- **Tareas Técnicas:**
  - Consultas analíticas optimizadas y agregaciones en PostgreSQL (`space_views_daily`, `analytics_daily_metrics`).
  - Gráficos interactivos en los paneles utilizando componentes visuales accesibles.
- **Dependencias:** Sprint 10 y 16.
- **Entregables:** Módulo de analítica y reportes de desempeño de locales.
- **Pruebas Necesarias:** Pruebas unitarias de agregación de métricas financieras y porcentajes de ocupación.
- **Criterios de Aceptación:**
  - Gráficos claros, exactos y renderizados sin penalizar el rendimiento del servidor.
- **Condiciones de Cierre:** Pruebas aprobadas y documentadas en `MEMORY.md`.

---

### Sprint 20: Pruebas Integrales, Auditoría de Seguridad y Lanzamiento Beta
- **Objetivo:** Auditoría de seguridad general, ejecución completa de la suite de regresión E2E, optimización de rendimiento y puesta en producción de la versión Beta en Lima.
- **Historias de Usuario:**
  - `HU-20.1`: Como equipo de LOKEATE, disponemos de una plataforma verificada, segura y lista para operar con usuarios reales en Lima.
- **Tareas Técnicas:**
  - Ejecución de `SKILL-05` (Auditoría de seguridad exhaustiva: RLS no recursivo, buckets privados, secretos, validación Zod).
  - Auditoría de accesibilidad y métricas Core Web Vitals (Lighthouse > 90 en páginas públicas).
  - Ejecución completa de la suite de pruebas E2E de Playwright sobre el entorno de producción.
  - Documentación de cierre del ciclo inicial de desarrollo y preparación de plan de soporte post-lanzamiento.
- **Dependencias:** Sprints 01 al 19 completados y aprobados.
- **Entregables:** Plataforma LOKEATE desplegada en producción (Vercel + Supabase), informe de auditoría de seguridad y suite de regresión 100% verde.
- **Pruebas Necesarias:** Suite de regresión integral completa.
- **Criterios de Aceptación:**
  - Cero vulnerabilidades críticas o altas.
  - Cero fallos en pruebas unitarias, de integración o E2E.
  - Todas las reglas de negocio verificadas con evidencia registrada.
- **Condiciones de Cierre:** Cierre formal del hito Beta en `MEMORY.md` y autorización de apertura al público.


## Condiciones adicionales de avance

- Sprint 01: configuración, pruebas de humo, CI y herramientas; no desplegar esquema de reservas como si estuviera validado.
- Sprint 02: matriz RLS de perfiles, pruebas anti-elevación y permisos reales de RPC.
- Sprint 07: bloqueo bidireccional con pruebas concurrentes reserva/bloqueo en ambas direcciones, establecimiento completo/subespacio, iCal y recursos exclusivos.
- Sprint 09: validación de anticipo, estado de comprobante, duplicados, plazos y conciliación manual con pruebas.
- Ningún sprint de reservas puede cerrarse basándose únicamente en los ejemplos SQL de DATABASE.md.
