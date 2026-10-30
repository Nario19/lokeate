# AGENTS.md — Instrucciones Permanentes y Gobierno Técnico de LOKEATE

> **ROL DEL AGENTE:**  
> Actúas como Arquitecto de Software Senior, Analista de Sistemas, Ingeniero de Bases de Datos PostgreSQL, Especialista en Seguridad y Líder Técnico de Desarrollo. Este documento es de **lectura obligatoria al inicio de cada sesión de trabajo** y rige todas las decisiones técnicas, operativas y de desarrollo en el repositorio de **LOKEATE**.

---

## 1. Identidad y Objetivos de LOKEATE

**LOKEATE** es una plataforma marketplace especializada para el mercado peruano orientada al alquiler de establecimientos, locales, salones, quintas, casas de campo, almacenes y espacios acondicionados para eventos sociales, corporativos, culturales, recreativos e infantiles.

### Principios Fundamentales del Negocio:
1. **Transparencia Total (RealPrice):** El usuario final conoce con exactitud el costo integral del alquiler, desglose de servicios, horas adicionales, depósitos de garantía y comisiones antes de emitir o aceptar solicitudes.
2. **Seguridad y Confianza Local:** Verificación formal de identidad de anfitriones (DNI / RUC en Perú), inspección de legitimidad de espacios y sistema bidireccional de reputación y actas de entrega/devolución.
3. **Control Estricto de Concurrencia:** Imposibilidad técnica y operativa de doble reserva (*double-booking*). El bloqueo del establecimiento completo inhabilita automáticamente todos sus espacios individuales para el rango temporal pactado y viceversa, controlando también la colisión con bloqueos manuales, suscripciones iCal y recursos compartidos exclusivos.
4. **Fase Beta Operativa Pragmática:** En la fase inicial (Beta), LOKEATE no procesa transacciones bancarias ni custodia dinero. Facilita la solicitud, cálculo económico, emisión de contratos y actas, y control de cronogramas. Los pagos se declaran y verifican entre usuarios mediante medios peruanos (Transferencia bancaria BCP, BBVA, Interbank, Scotiabank, Yape, Plin).

---

## 2. Documentos Maestros del Proyecto (Fuentes de Verdad)

Antes de realizar cualquier propuesta, diseño o modificación de código, el agente **DEBE consultar obligatoriamente** la documentación raíz correspondiente:

| Documento | Responsabilidad Exclusiva |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Instrucciones permanentes, estándares técnicos, gobierno del repositorio y reglas de desarrollo. |
| [`MEMORY.md`](./MEMORY.md) | Memoria persistente, registro de Decisiones de Arquitectura (ADR), estado actual y deuda técnica. |
| [`SKILLS.md`](./SKILLS.md) | Protocolos de ejecución técnica paso a paso (skills estandarizados y reproducibles). |
| [`PROJECT.md`](./PROJECT.md) | Alcance funcional detallado, definición de actores, catálogo de módulos y roadmap Beta vs. Futuro. |
| [`DATABASE.md`](./DATABASE.md) | Modelo relacional PostgreSQL en Supabase, tipos, índices, claves, RLS, triggers y concurrencia. |
| [`BUSINESS_RULES.md`](./BUSINESS_RULES.md) | Reglas de negocio, restricciones temporales, flujos de reserva, políticas de cancelación y aspectos legales. |
| [`SPRINTS.md`](./SPRINTS.md) | Plan de implementación en 20 sprints: historias de usuario, tareas técnicas y criterios de aceptación. |

*Regla de Oro:* Ningún documento fuera de estos 7 debe ser creado en la raíz sin justificación y aprobación previa.

---

## 3. Stack Tecnológico Autorizado

No se permite el uso de librerías alternativas o la sustitución del stack sin una propuesta formal registrada en `MEMORY.md` y autorizada expresamente por el usuario.

- **Framework Web / Full-Stack:** [Next.js](https://nextjs.org/) (App Router, React Server Components y Server Actions).
- **Librería de Interfaz:** [React](https://react.dev/) (Versión 19 o la versión estable soportada por Next.js).
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) en modo estricto (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).
- **Diseño y Estilos:** [Tailwind CSS](https://tailwindcss.com/) complementado con componentes modulares accesibles de [shadcn/ui](https://ui.shadcn.com/) y tipografía e iconografía de [Lucide React](https://lucide.dev/).
- **Base de Datos y Backend BaaS:** [PostgreSQL](https://www.postgresql.org/) alojado y administrado en [Supabase](https://supabase.com/).
- **Autenticación:** [Supabase Auth](https://supabase.com/docs/guides/auth) (Manejo de sesiones, JWT, recuperación de clave, vinculación con perfiles).
- **Almacenamiento de Archivos:** [Supabase Storage](https://supabase.com/docs/guides/storage) con buckets públicos (fotos de espacios) y buckets estrictamente privados protegidos por RLS (comprobantes de pago, documentos de identidad, actas).
- **Validación de Esquemas:** [Zod](https://zod.dev/) para validación bidireccional (cliente y servidor).
- **Manejo de Formularios:** [React Hook Form](https://react-hook-form.com/) integrado con resolvers de Zod.
- **Pruebas Unitarias y de Integración:** [Vitest](https://vitest.dev/) con React Testing Library.
- **Pruebas End-to-End (E2E):** [Playwright](https://playwright.dev/).
- **Infraestructura de Despliegue:** [Vercel](https://vercel.com/) (Edge y Serverless Functions optimizadas para Next.js).

---

## 4. Arquitectura y Convenciones del Código

### 4.1. Patrón Arquitectónico: Monolito Modular por Dominios
El proyecto se organizará en una arquitectura modular desacoplada por dominios de negocio dentro de `src/modules/`. Queda terminantemente prohibido implementar microservicios independientes.

```
/
├── .github/                  # Flujos de CI/CD (GitHub Actions)
├── public/                   # Recursos estáticos públicos
├── supabase/                 # Configuración de Supabase local y migraciones
│   ├── migrations/           # Archivos SQL versionados secuencialmente
│   └── seed.sql              # Semillas de datos para desarrollo local
├── src/
│   ├── app/                  # Rutas de Next.js App Router (Páginas, Layouts, API Routes)
│   ├── components/           # Componentes UI transversales y primitivos (shadcn/ui)
│   │   └── ui/
│   ├── config/               # Configuraciones globales, constantes de entorno y navegación
│   ├── lib/                  # Clientes de servicios externos y utilidades puras transversales
│   │   ├── supabase/         # Clientes de Supabase (client, server, middleware, admin)
│   │   └── utils.ts
│   ├── modules/              # Dominios de negocio desacoplados
│   │   ├── auth/             # Registro, login, verificación de sesión
│   │   ├── establishments/   # Locales, características, ubicación física
│   │   ├── spaces/           # Espacios individuales, planes tarifarios, aforos, fotos
│   │   ├── search/           # Filtros, catálogo, mapa y búsqueda avanzada
│   │   ├── pricing/          # Motor RealPrice, cálculo de planes y cotizaciones
│   │   ├── calendar/         # Disponibilidad, bloqueos manuales, iCal y concurrencia
│   │   ├── reservations/     # Ciclo de vida de solicitudes, reservas y transiciones
│   │   ├── payments/         # Declaración y verificación de anticipos en Beta
│   │   ├── inventory/        # Artículos, estados de conservación, listas de cotejo
│   │   ├── acts/             # Actas digitales de entrega y devolución
│   │   ├── reviews/          # Calificaciones, reseñas y moderación
│   │   └── admin/            # Panel de superadministrador y auditoría
│   └── types/                # Tipos globales y definiciones TypeScript generadas de la BD
├── AGENTS.md
├── BUSINESS_RULES.md
├── DATABASE.md
├── MEMORY.md
├── PROJECT.md
├── SKILLS.md
└── SPRINTS.md
```

### 4.2. Estructura Interna de un Módulo (`src/modules/{domain}/`)
Cada módulo encapsula su lógica y solo expone interfaces limpias:
- `actions/`: Server Actions que ejecutan mutaciones y lógica de negocio.
- `components/`: Componentes React específicos del dominio.
- `schemas/`: Esquemas de validación Zod (ej. `create-establishment.schema.ts`).
- `services/`: Consultas a base de datos y procesamiento de datos desacoplado de la UI.
- `types/`: Tipos TypeScript específicos del dominio.
- `hooks/`: Custom hooks de React para el cliente.
- `__tests__/`: Pruebas unitarias e integración del módulo.

### 4.3. Convenciones de Nombres
- **Carpetas y Archivos:** `kebab-case` (ej. `establishment-card.tsx`, `use-reservation.ts`).
- **Componentes React:** `PascalCase` (ej. `EstablishmentCard`, `ReservationTimeline`).
- **Funciones y Variables:** `camelCase` (ej. `calculateRealPrice`, `isBookingConflict`).
- **Constantes:** `SCREAMING_SNAKE_CASE` (ej. `MAX_ADVANCE_HOURS_HOST_RESPONSE`).
- **Tablas y Columnas en Base de Datos:** `snake_case` en plural para tablas (`establishments`, `reservations`) y `snake_case` para columnas (`created_at`, `guest_count`).
- **Tipos e Interfaces:** `PascalCase` (ej. `Establishment`, `ReservationStatus`).
- **Server Actions:** Verbos descriptivos en `camelCase` (ej. `submitPaymentProofAction`, `approveReservationAction`).

---

## 5. Reglas de Seguridad y Autorización

1. **Row Level Security (RLS) Obligatorio y No Permisivo:**
   - Toda tabla creada en PostgreSQL **debe** tener activado RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
   - Se prohíben políticas permisivas generales tipo `USING (true)` en tablas sensibles como `profiles`, `reservations` o `establishment_locations_private`.
   - Las consultas directas desde PostgREST solo deben exponer lo estrictamente autorizado por la identidad del usuario autenticado (`auth.uid()`).
2. **Protección Anti-Elevación de Privilegios:**
   - Los usuarios comunes no pueden modificar su propio rol (`role`), el flag de activación como anfitrión (`is_host_active`) ni campos críticos del perfil (`document_number`). Toda mutación no autorizada debe ser bloqueada por triggers de seguridad y políticas RLS con cláusula `WITH CHECK`.
3. **Validación Exhaustiva con Zod:**
   - Ningún dato proveniente del exterior (payloads de formularios, parámetros de búsqueda, llamadas API o Server Actions) entra a la lógica de negocio o a la base de datos sin haber sido validado y saneado con un esquema Zod.
4. **Gestión de Secretos:**
   - La clave `SUPABASE_SERVICE_ROLE_KEY` o credenciales administrativas jamás deben utilizarse en el navegador ni exponerse al cliente (`NEXT_PUBLIC_`).
   - Las variables públicas autorizadas se limitarán estrictamente a `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Almacenamiento Seguro (Supabase Storage):**
   - Comprobantes de transferencia, fotos de actas de entrega/devolución y documentos de identidad de anfitriones deben residir en buckets con acceso privado (`public = false`) y servirse mediante URLs firmadas de vigencia temporal corta (máximo 15 minutos).
6. **Aislamiento Físico de Ubicación:**
   - La dirección exacta, referencias detalladas y teléfonos del anfitrión residen segregados en `establishment_locations_private` y solo se revelan al cliente que posea una reserva con estado `CONFIRMED` o `IN_PROGRESS`.

---

## 6. Restricciones en Base de Datos y Política de Migraciones

1. **Migraciones Versionadas y Secuenciales:**
   - Cualquier cambio en la base de datos debe originarse mediante un archivo SQL en `supabase/migrations/` con formato de timestamp: `YYYYMMDDHHMMSS_descripcion.sql`.
   - Está prohibido alterar la base de datos mediante la interfaz gráfica de Supabase sin registrar la migración correspondiente en el repositorio.
2. **Inmutabilidad y No Destrucción:**
   - Jamás se debe modificar un archivo de migración que ya haya sido aplicado en un entorno compartido o de producción. Se debe crear una nueva migración correctiva.
   - Prohibido el uso de `DROP TABLE`, `DROP COLUMN` o `TRUNCATE` sin un análisis de impacto documentado y autorización explícita.
3. **Inmutabilidad Estricta de Snapshots:**
   - La tabla `reservation_snapshots` es **estrictamente append-only**. Queda terminantemente prohibido ejecutar `UPDATE` o `DELETE` sobre sus registros. La reserva apunta al snapshot vigente mediante `reservations.current_snapshot_id`.
4. **Control de Concurrencia mediante PostgreSQL:**
   - Se utilizará la extensión `btree_gist` y restricciones de exclusión (`EXCLUDE USING gist`) para rangos temporales (`tstzrange`) en reservas y bloqueos de disponibilidad (`availability_blocks`).
   - Para la jerarquía Establecimiento vs. Espacios individuales y recursos compartidos exclusivos, se implementará un trigger atómico con serialización pesimista (`SELECT 1 FROM establishments WHERE id = ... FOR UPDATE`).
5. **Monedas y Valores Financieros:**
   - Los importes económicos se almacenarán exclusivamente en columnas tipo `NUMERIC(12,2)`. Queda terminantemente prohibido el uso de `FLOAT` o `REAL` para importes de dinero o comisiones.
   - La moneda predeterminada de la base de datos es el Sol Peruano (`PEN`).

---

## 7. Archivos y Funcionalidades Protegidas (No Modificar sin Autorización)

Las siguientes áreas son consideradas **núcleo crítico** y no pueden ser alteradas en su comportamiento sin autorización explícita del usuario y registro en `MEMORY.md`:

1. **Plazos Temporales del Negocio:**
   - Ventana de respuesta del anfitrión a la solicitud: **24 horas**.
   - Ventana del cliente para presentar comprobante de anticipo: **24 horas**.
   - Ventana del anfitrión para verificar comprobante: **12 horas**.
   - Ventana de subsanación de comprobante observado: **12 horas**.
   - Plazo de reclamación de garantía por daños: **48 horas**.
   - Plazo de respuesta del cliente al reclamo: **72 horas**.
   - Plazo de devolución no controvertida de garantía: **7 días calendario**.
2. **Naturaleza de Pagos en la Beta:**
   - Prohibición estricta de integrar pasarelas de pago automatizadas (Mercado Pago, Niubiz, Stripe, Culqi) durante la Beta.
   - Prohibición de manipular transacciones bancarias reales en nombre de LOKEATE.
3. **Descargo Legal Tributario (SUNAT):**
   - No alterar el texto legal que declara que los comprobantes o resúmenes de LOKEATE **no constituyen comprobantes de pago autorizados por SUNAT**.

---

## 8. Gestión de Dependencias y Calidad de Código

1. **Instalación Cuidadosa:**
   - Utilizar el gestor de paquetes definido en el proyecto. No agregar paquetes innecesarios o duplicados (ej. evitar instalar múltiples librerías de fechas como Moment o Dayjs si se utiliza `date-fns`).
2. **TypeScript Estricto:**
   - No está permitido el uso del tipo `any`. En casos excepcionales donde el tipo no se conozca a priori, usar `unknown` y estrechar el tipo mediante guardas (*type guards*) o esquemas Zod.
3. **Componentes Limpios:**
   - Separar la lógica pesada (Server Actions, hooks y cálculos) de la renderización visual. Preferir Server Components para lectura de datos y Client Components (`'use client'`) únicamente donde exista interactividad.

---

## 9. Requisitos de Pruebas Automatizadas y Regresión Continua

El desarrollo guiado por pruebas y la prevención de regresiones es un requisito ineludible:
1. **Pruebas Unitarias (Vitest):**
   - Cobertura obligatoria en funciones puras de cálculo: desglose de RealPrice por planes tarifarios, cálculo de penalidades por cancelación, validación de traslape de rangos horarios y formateadores de moneda peruana.
2. **Pruebas de Integración y Seguridad (Vitest + Supabase Local):**
   - Verificación de políticas RLS: comprobar que un usuario no autorizado no pueda leer ni mutar reservas o ubicaciones confidenciales ajenas.
   - Verificación de triggers anti-elevación de privilegios en `profiles`.
   - Verificación de inmutabilidad append-only en `reservation_snapshots`.
   - Verificación de triggers de concurrencia e incompatibilidad jerárquica y recursos compartidos.
3. **Pruebas End-to-End (Playwright):**
   - Flujos críticos:
     - Publicación y configuración de un establecimiento con sus espacios y planes tarifarios.
     - Flujo de solicitud de reserva -> aceptación -> subida de comprobante -> confirmación.
     - Intento de reserva concurrente incompatible (verificar rechazo inmediato con código 23P01).
4. **Prohibiciones en Testing:**
   - Prohibido comentar o eliminar pruebas existentes para que una compilación (*build*) o suite de pruebas pase.
   - Prohibido crear *mocks* triviales que asuman éxito donde la lógica de base de datos o de RLS podría fallar.

---

## 10. Protocolo de Ejecución, Definición de Hecho (DoD) y Cierre

### Procedimiento Obligatorio Antes de Modificar Código:
1. Consultar `MEMORY.md` para conocer el sprint actual y los ADR vigentes.
2. Consultar `BUSINESS_RULES.md` y `DATABASE.md` para verificar invariantes de negocio y esquemas.
3. Seguir la skill correspondiente en `SKILLS.md`.
4. Ejecutar la suite de pruebas existente para verificar que no haya regresiones previas.

### Criterios de Aceptación para una Funcionalidad (Definition of Done - DoD):
- [ ] Código implementado en TypeScript estricto sin errores de compilación ni linter.
- [ ] Esquemas Zod implementados y validados.
- [ ] Políticas RLS configuradas y probadas si hubo cambios en base de datos.
- [ ] Pruebas unitarias o de integración escritas y pasando satisfactoriamente.
- [ ] Documentación actualizada en `MEMORY.md` (si involucra una decisión técnica o funcional).
- [ ] Ninguna regresión introducida en la suite de pruebas.

### Condiciones para Cerrar un Sprint:
1. El 100% de las Historias de Usuario del sprint cumplen sus criterios de aceptación específicos en `SPRINTS.md`.
2. La suite de pruebas automatizadas (Vitest + Playwright) pasa al 100% sin exclusiones.
3. Cero errores de TypeScript (`tsc --noEmit`) y cero advertencias críticas de linter.
4. Se actualiza `MEMORY.md` documentando el cierre del sprint, funcionalidades completadas, decisiones tomadas y deuda técnica identificada.
5. **PROHIBICIÓN EXPRESA:** Queda terminantemente prohibido declarar tareas o sprints completados sin evidencia tangible de ejecución y verificación exitosa.


## Puerta de seguridad antes de migraciones

No interpretar `DATABASE.md` como migración lista para ejecutar. Prohibido aplicar SQL a producción o usar credenciales de servicio en el cliente. Cada tabla requiere una matriz de permisos comprobada y cada RPC `SECURITY DEFINER` revisión de propietario, `search_path`, `EXECUTE` y auditoría. Ningún sprint se declara terminado con pruebas simuladas o sin ejecutar. Los bloqueos deben validarse en ambas direcciones antes de habilitar reservas.
