import { z } from "zod";

export const cancellationPolicySchema = z.enum(["FLEXIBLE", "MODERATE", "STRICT"], {
  required_error: "Selecciona una política de cancelación",
});

export const pricingModeSchema = z.enum(
  ["HOURLY", "FIXED_EVENT", "PER_PERSON", "PACKAGE"],
  {
    required_error: "Selecciona la modalidad de cobro del plan",
  }
);

export const taxConditionSchema = z.enum(
  [
    "TAX_EXEMPT_OR_NOT_APPLICABLE",
    "TAX_INCLUDED_18_IGV",
    "TAX_ADDITIONAL_18_IGV",
  ],
  {
    required_error: "Selecciona la condición frente al IGV",
  }
);

/**
 * Esquema de Creación de Espacio Individual o Establecimiento Completo
 */
export const createSpaceSchema = z
  .object({
    establishmentId: z.string().uuid("ID de establecimiento inválido"),
    name: z
      .string()
      .trim()
      .min(3, "El nombre del espacio debe tener al menos 3 caracteres.")
      .max(150, "El nombre no puede exceder 150 caracteres."),
    description: z
      .string()
      .trim()
      .min(10, "La descripción del espacio debe tener al menos 10 caracteres.")
      .max(2000, "La descripción no puede exceder 2000 caracteres."),
    isEntireEstablishment: z.boolean().default(false),
    areaM2: z
      .number({ invalid_type_error: "El área debe ser numérica" })
      .positive("El área debe ser mayor a 0 m²."),
    standingCapacity: z
      .number({ invalid_type_error: "El aforo de pie debe ser numérico" })
      .int("El aforo debe ser un número entero.")
      .positive("El aforo de pie debe ser mayor a 0 personas."),
    seatedCapacity: z
      .number({ invalid_type_error: "El aforo sentado debe ser numérico" })
      .int("El aforo debe ser un número entero.")
      .positive("El aforo sentado debe ser mayor a 0 personas."),
    setupBufferMinutes: z
      .number({ invalid_type_error: "El buffer de montaje debe ser numérico" })
      .int()
      .min(0, "El tiempo de montaje no puede ser negativo.")
      .default(60),
    cleanupBufferMinutes: z
      .number({ invalid_type_error: "El buffer de limpieza debe ser numérico" })
      .int()
      .min(0, "El tiempo de desmontaje no puede ser negativo.")
      .default(60),
    cancellationPolicy: cancellationPolicySchema.default("MODERATE"),
  })
  .refine((data) => data.standingCapacity >= data.seatedCapacity, {
    message: "El aforo de pie debe ser igual o mayor al aforo sentado.",
    path: ["standingCapacity"],
  });

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

/**
 * Esquema de Creación de Plan Tarifario para un Espacio
 */
export const createPricingPlanSchema = z.object({
  spaceId: z.string().uuid("ID de espacio inválido"),
  planName: z
    .string()
    .trim()
    .min(3, "El nombre del plan debe tener al menos 3 caracteres (ej. Tarifa Estándar por Hora).")
    .max(120, "El nombre del plan no puede exceder 120 caracteres."),
  description: z.string().trim().max(1000).optional().nullable(),
  pricingMode: pricingModeSchema,
  basePriceWeekday: z
    .number({ invalid_type_error: "El precio entre semana debe ser un importe numérico" })
    .min(0, "El precio entre semana no puede ser negativo."),
  basePriceWeekend: z
    .number({ invalid_type_error: "El precio de fin de semana debe ser un importe numérico" })
    .min(0, "El precio de fin de semana no puede ser negativo."),
  extraHourPrice: z
    .number({ invalid_type_error: "El precio por hora extra debe ser numérico" })
    .min(0, "El precio por hora extra no puede ser negativo.")
    .default(0),
  minimumRentalHours: z
    .number({ invalid_type_error: "Las horas mínimas deben ser un número entero" })
    .int()
    .positive("El alquiler mínimo debe ser de al menos 1 hora.")
    .default(4),
  minimumBillableGuests: z
    .number({ invalid_type_error: "El mínimo de invitados debe ser numérico" })
    .int()
    .min(1, "El mínimo de invitados facturables debe ser al menos 1.")
    .default(1),
  cleaningFee: z
    .number({ invalid_type_error: "La tarifa de limpieza debe ser numérica" })
    .min(0, "La tarifa de limpieza no puede ser negativa.")
    .default(0),
  securityDeposit: z
    .number({ invalid_type_error: "El depósito de garantía debe ser numérico" })
    .min(0, "El depósito de garantía no puede ser negativo.")
    .default(0),
  requiredAdvancePercentage: z
    .number({ invalid_type_error: "El porcentaje de anticipo debe ser numérico" })
    .min(10, "El anticipo mínimo requerido debe ser al menos 10%.")
    .max(100, "El anticipo no puede exceder el 100%.")
    .default(50),
  taxCondition: taxConditionSchema.default("TAX_EXEMPT_OR_NOT_APPLICABLE"),
  currency: z.literal("PEN").default("PEN"),
});

export type CreatePricingPlanInput = z.infer<typeof createPricingPlanSchema>;

/**
 * Esquema para Agregar Fotos a la Galería
 */
export const addSpacePhotoSchema = z.object({
  spaceId: z.string().uuid("ID de espacio inválido"),
  storagePath: z.string().min(5, "Ruta de almacenamiento requerida"),
  caption: z.string().trim().max(150).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export type AddSpacePhotoInput = z.infer<typeof addSpacePhotoSchema>;
