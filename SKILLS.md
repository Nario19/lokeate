# SKILLS.md — Procedimientos Técnicos Reutilizables de LOKEATE

> **ESTADO DEL DOCUMENTO:** REVISADO, AUDITADO Y SINCRONIZADO (Fase 0 — Documentación Maestra)  
> **PROPÓSITO:**  
> Este documento estandariza los procedimientos técnicos que cualquier desarrollador o agente debe seguir para ejecutar tareas comunes en **LOKEATE**. Seguir rigurosamente estas skills garantiza la coherencia arquitectónica, la estabilidad del código, la seguridad de los datos y la ausencia de regresiones.

---

## Índice de Skills

- [SKILL-01: Crear una funcionalidad nueva](#skill-01-crear-una-funcionalidad-nueva)
- [SKILL-02: Modificar una funcionalidad existente](#skill-02-modificar-una-funcionalidad-existente)
- [SKILL-03: Crear o modificar la base de datos](#skill-03-crear-o-modificar-la-base-de-datos)
- [SKILL-04: Pruebas automatizadas y regresión continua](#skill-04-pruebas-automatizadas-y-regresión-continua)
- [SKILL-05: Auditoría de seguridad](#skill-05-auditoría-de-seguridad)
- [SKILL-06: Diagnóstico y corrección de errores](#skill-06-diagnóstico-y-corrección-de-errores)
- [SKILL-07: Cierre de sprint](#skill-07-cierre-de-sprint)

---

## SKILL-01: Crear una funcionalidad nueva

### Cuándo se utiliza:
Al implementar una nueva historia de usuario o capacidad técnica dentro del sprint activo, respetando los alcances de [`PROJECT.md`](./PROJECT.md) y [`SPRINTS.md`](./SPRINTS.md).

### Pasos a seguir:
1. **Análisis de Requisitos y Dependencias:**
   - Consultar la historia de usuario en `SPRINTS.md` y sus reglas de negocio en `BUSINESS_RULES.md`.
   - Identificar a qué módulo de `src/modules/{domain}/` pertenece o si debe crearse un nuevo dominio.
   - Verificar si requiere entidades de base de datos existentes en `DATABASE.md` o si requiere invocar la `SKILL-03`.
2. **Definición de Tipos y Esquemas de Validación (Zod):**
   - Crear los tipos TypeScript en `src/modules/{domain}/types/`.
   - Crear los esquemas de validación con Zod en `src/modules/{domain}/schemas/` para validar entradas de usuario tanto en el cliente como en el servidor.
3. **Capa de Servicio y Lógica de Negocio:**
   - Crear o extender el servicio en `src/modules/{domain}/services/` utilizando el cliente de Supabase tipado.
   - Para mutaciones críticas de estado en reservas, invocar exclusivamente las RPCs transaccionales (`rpc_accept_reservation`, `rpc_verify_payment_and_confirm`, etc.) definidas en `DATABASE.md`.
4. **Capa de Mutación (Server Actions):**
   - Crear la Server Action en `src/modules/{domain}/actions/` protegiéndola con comprobación de sesión y autorización por rol.
   - Validar los argumentos con el esquema Zod respectivo antes de interactuar con la base de datos.
5. **Capa de Interfaz de Usuario (UI):**
   - Construir los componentes React en `src/modules/{domain}/components/` utilizando componentes de `src/components/ui/` (shadcn/ui) y Tailwind CSS.
   - Manejar formularios mediante `React Hook Form` con resolver de Zod.
   - Proveer estados visuales de carga (*loading skeleton*), error y retroalimentación accesible (toasts).
6. **Implementación de Pruebas:**
   - Seguir `SKILL-04` para escribir pruebas unitarias de funciones de cálculo y pruebas de integración del flujo.
7. **Documentación del Estado:**
   - Registrar la funcionalidad en la lista de características completadas en `MEMORY.md`.

---

## SKILL-02: Modificar una funcionalidad existente

### Cuándo se utiliza:
Al ajustar reglas de negocio, refactorizar componentes o actualizar flujos existentes de la aplicación.

### Pasos a seguir:
1. **Evaluación de Impacto:**
   - Localizar todos los puntos de importación y uso del componente, función o Server Action a modificar.
   - Revisar las pruebas existentes asociadas al archivo.
2. **Ejecución Previa de Pruebas:**
   - Ejecutar la suite de pruebas del módulo antes de tocar código: `pnpm test src/modules/{domain}` para asegurar un punto de partida verde.
3. **Modificación Controlada:**
   - Aplicar el cambio mínimo necesario respetando `AGENTS.md` y las reglas protegidas.
   - Si la firma de una función o Server Action cambia, actualizar todas sus referencias y esquemas Zod asociados.
4. **Actualización de Pruebas:**
   - Ajustar las aserciones de pruebas existentes si el comportamiento esperado cambió de forma justificada.
   - Si el cambio responde a un nuevo caso de borde, agregar una prueba específica que lo valide.
5. **Ejecución de Regresión:**
   - Ejecutar no solo las pruebas del módulo, sino las pruebas de los módulos dependientes y la suite de integración completa.

---

## SKILL-03: Crear o modificar la base de datos

### Cuándo se utiliza:
Cada vez que se requiera agregar una tabla, columna, restricción, índice, tipo enum o política RLS en PostgreSQL.

### Pasos a seguir:
1. **Diseño y Validación Teórica:**
   - Contrastar el cambio con el modelo integral documentado en [`DATABASE.md`](./DATABASE.md).
   - Verificar relaciones, tipos de datos (`NUMERIC(12,2)` para dinero, `TIMESTAMPTZ` para marcas de tiempo, UUID para identificadores).
2. **Creación del Archivo de Migración:**
   - Generar un nuevo archivo de migración versionado en `supabase/migrations/YYYYMMDDHHMMSS_descripcion_clara.sql`.
   - Incluir sentencias idempotentes (`IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
3. **Definición Obligatoria de Seguridad (RLS No Recursivo y No Permisivo):**
   - Incluir inmediatamente `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`.
   - **Prohibido el uso de `USING (true)` en tablas sensibles.**
   - Para comprobaciones administrativas, utilizar la función no recursiva `public.is_superadmin()`.
   - En `profiles`, segregar datos sensibles en `profile_private_details` (DNI y teléfono privados).
   - En `reservations`, vedar actualizaciones directas de `status` mediante PostgREST y asegurar la clave foránea compuesta `FOREIGN KEY (current_snapshot_id, id) REFERENCES reservation_snapshots(id, reservation_id)`.
4. **Protección de Inmutabilidad y Datos Confidenciales:**
   - Si la tabla almacena snapshots (`reservation_snapshots`), aplicar el trigger que bloquea `UPDATE` y `DELETE` sin excepciones (append-only).
   - Si la tabla almacena ubicación exacta, segregarla en `establishment_locations_private`.
5. **Optimización de Índices y Restricciones GiST:**
   - Crear índices GiST para columnas de tipo rango (`tstzrange`) en tablas con control de disponibilidad (`reservations`, `availability_blocks`).
6. **Prueba Local de Migración y Tipado:**
   - Aplicar la migración en Supabase local (`supabase db reset` o `supabase migration up`).
   - Generar los tipos TypeScript actualizados: `supabase gen types typescript --local > src/types/database.types.ts`.
7. **Actualización Documental:**
   - Actualizar `DATABASE.md` y registrar la migración en `MEMORY.md`.

---

## SKILL-04: Pruebas automatizadas y regresión continua

### Cuándo se utiliza:
Obligatoria de manera transversal en cada funcionalidad nueva, corrección de bug, integración y previo al cierre de cada sprint.

### Batería Obligatoria de Pruebas Automatizadas:

1. **Pruebas de No Recursión RLS (`test/security/rls-recursion.test.ts`):**
   - Ejecutar `SELECT * FROM profiles` con múltiples identidades autenticadas.
   - *Aserción:* Cero errores de recursión (`infinite recursion detected`).
2. **Pruebas de Privacidad de Perfiles (`test/security/profile-privacy.test.ts`):**
   - Un usuario intenta consultar `profile_private_details` de una contraparte de reserva.
   - *Aserción:* Cero filas retornadas por RLS; el DNI jamás se expone.
3. **Pruebas Anti-Elevación de Privilegios (`test/security/privilege-escalation.test.ts`):**
   - Un cliente ejecuta `UPDATE profiles SET role = 'SUPERADMIN' WHERE id = auth.uid()`.
   - *Aserción:* Fallo bloqueado por trigger `protect_profile_fields` con código `42501`.
4. **Pruebas de Moderación y Publicación (`test/security/establishment-publishing.test.ts`):**
   - Un anfitrión intenta autoactivar un establecimiento sin aprobación de la administración (`is_active = TRUE`, `publishing_status = 'APPROVED'`).
   - *Aserción:* Fallo bloqueado por trigger `check_establishment_publication_eligibility` con código `42501`.
5. **Pruebas de Integridad de Snapshots (`test/integrity/snapshot-foreign-key.test.ts`):**
   - Intentar asignar `reservations.current_snapshot_id` con un snapshot perteneciente a OTRA reserva distinta.
   - *Aserción:* Rechazo inmediato por Foreign Key compuesta (`fk_reservations_current_snapshot`).
6. **Pruebas de Inmutabilidad de Snapshots (`test/integrity/snapshots-immutability.test.ts`):**
   - Intentar ejecutar `UPDATE` o `DELETE` sobre una fila de `reservation_snapshots`.
   - *Aserción:* Rechazo con código de excepción `27000`.
7. **Pruebas de Concurrencia Bidireccional (`test/concurrency/hierarchical-conflicts.test.ts`):**
   - Transacción A intenta confirmar el Establecimiento Completo mientras Transacción B intenta confirmar un Subespacio en el mismo horario.
   - *Aserción:* Una transacción es aceptada; la segunda es rechazada con código `23P01`.
8. **Pruebas de Recursos Compartidos (`test/concurrency/shared-resources.test.ts`):**
   - Dos subespacios intentan reservar un recurso compartido exclusivo (ej. cocina o piscina) en horarios que se solapan.
   - *Aserción:* Rechazo inmediato con código `23P01`.
9. **Pruebas de Transiciones de Estado vía RPC (`test/transactions/state-transitions.test.ts`):**
   - Intentar transicionar estados fuera de las funciones transaccionales (rechazado por RLS).
   - Ejecutar `rpc_accept_reservation` tras expirar la ventana de 24h (expirado con código `22023`).
   - Ejecutar `rpc_verify_payment_and_confirm` (éxito y transición atómica a `CONFIRMED`).

### Reglas Inviolables de Testing:
- **PROHIBIDO ELIMINAR O COMENTAR PRUEBAS:** Si una prueba falla tras un cambio de código, el código debe corregirse. Modificar la aserción de la prueba solo es válido si el requerimiento de negocio formalmente cambió.
- **PROHIBIDO USAR MOCKS ENGAÑOSOS:** No simular retornos exitosos en la base de datos para omitir errores de RLS o de restricciones de clave foránea en pruebas de integración.

---

## SKILL-05: Auditoría de seguridad

### Cuándo se utiliza:
Antes de liberar cualquier módulo que involucre pagos, reservas, almacenamiento de archivos, autenticación o antes de cerrar un sprint.

### Pasos a seguir:
1. **Inspección de RLS:**
   - Confirmar que ninguna tabla en `public` tiene RLS desactivado:
     ```sql
     SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
     ```
   - El resultado debe ser estrictamente cero filas.
2. **Inspección de Políticas Permisivas:**
   - Verificar que ninguna política sensible utilice `USING (true)` en tablas privadas (`profile_private_details`, `reservations`, `establishment_locations_private`, `payment_declarations`).
3. **Inspección de Buckets de Almacenamiento (Supabase Storage):**
   - Verificar que el bucket `private-documents` esté marcado como `public = false`.
   - Confirmar que las descargas de comprobantes o actas utilicen exclusivamente URLs firmadas de duración $\le 15$ minutos.
4. **Revisión de Secretos y Variables de Entorno:**
   - Asegurar que `SUPABASE_SERVICE_ROLE_KEY` o credenciales administrativas no aparezcan en código cliente ni lleven prefijo `NEXT_PUBLIC_`.
5. **Auditoría de Inyección y Validación de Entradas:**
   - Confirmar que todas las Server Actions validen exhaustivamente las entradas mediante esquemas Zod estrictos.

---

## SKILL-06: Diagnóstico y corrección de errores

### Cuándo se utiliza:
Al detectar un fallo en pruebas, reporte de error o comportamiento anómalo en el flujo del sistema.

### Pasos a seguir:
1. **Reproducción Sistemática:**
   - Identificar las precondiciones, rol de usuario, parámetros de entrada y estado previo del sistema.
   - Escribir una prueba automatizada (unitaria o de integración) que reproduzca el fallo exacto. Esta prueba **debe fallar** inicialmente (*Red*).
2. **Identificación de la Causa Raíz:**
   - Analizar el flujo de datos: ¿El error ocurre en validación (Zod), lógica de negocio, políticas de RLS, restricción de base de datos o renderizado de UI?
   - No aplicar parches superficiales que solo silencien el síntoma.
3. **Corrección Mínima y Focalizada:**
   - Modificar únicamente el código necesario para resolver la causa raíz identificada.
4. **Verificación de la Solución (*Green*):**
   - Ejecutar la prueba creada en el paso 1; debe pasar satisfactoriamente.
5. **Comprobación de Regresión:**
   - Ejecutar la suite completa de pruebas del módulo y las pruebas globales.
6. **Registro en MEMORY.md:**
   - Si el error reveló una ambigüedad o un problema arquitectónico, registrar el aprendizaje en la sección de problemas o decisiones en `MEMORY.md`.

---

## SKILL-07: Cierre de sprint

### Cuándo se utiliza:
Al finalizar todas las historias de usuario y tareas técnicas programadas para un sprint en [`SPRINTS.md`](./SPRINTS.md).

### Pasos a seguir:
1. **Revisión de Criterios de Aceptación:**
   - Contrastar cada Historia de Usuario del sprint contra sus criterios de aceptación en `SPRINTS.md`.
2. **Ejecución Completa de la Suite de Calidad:**
   - Comprobación de tipos: `pnpm typecheck` (0 errores).
   - Análisis estático: `pnpm lint` (0 errores críticos).
   - Pruebas unitarias e integración: `pnpm test` (100% aprobadas).
   - Pruebas E2E relevantes: `pnpm test:e2e` (100% aprobadas).
3. **Auditoría de Seguridad Rápida:**
   - Aplicar los puntos clave de `SKILL-05` sobre las tablas o componentes tocados en el sprint.
4. **Documentación de Cierre en MEMORY.md:**
   - Actualizar la tabla de sprints en `MEMORY.md` marcando el sprint como `COMPLETADO`.
   - Registrar las funcionalidades completadas en la sección correspondiente.
   - Listar cualquier deuda técnica o decisión pendiente detectada durante el desarrollo.
5. **Verificación de Estado Limpio de Git:**
   - Confirmar que todos los cambios estén comprometidos con mensajes de commit semánticos y sin archivos temporales o no rastreados indebidos.
6. **Presentación de Evidencia al Usuario:**
   - Entregar un informe conciso que detalle las pruebas ejecutadas, la evidencia de éxito y la solicitud de autorización para avanzar al siguiente sprint.


## SKILL-08: Certificación local de seguridad y concurrencia antes de habilitar reservas

1. Preparar una base local desechable con migraciones ordenadas y semilla mínima.
2. Probar roles anónimo, cliente A/B, anfitrión A/B y administrador con tokens distintos; verificar `SELECT`, `INSERT`, `UPDATE`, `DELETE` y `EXECUTE` en cada tabla y RPC.
3. Probar dos conexiones concurrentes: reserva completa vs espacio; reserva vs bloqueo manual; bloqueo vs reserva; espacio vs recurso exclusivo; iCal vs reserva. Asegurar que una operación incompatible falle sin perder reservas válidas.
4. Probar creación y modificación de establecimientos, expiración idempotente, anticipo insuficiente, comprobante duplicado y snapshots cruzados.
5. Ejecutar lint, typecheck, build, tests unitarios, integración y E2E pertinentes. Guardar evidencia real de comandos y resultados en MEMORY.md.
6. Si falla un caso, no cerrar sprint ni afirmar integridad comprobada.
