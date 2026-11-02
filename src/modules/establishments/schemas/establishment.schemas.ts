import { z } from "zod";
import { peruvianPhoneSchema } from "@/modules/auth/schemas/auth.schemas";

export const establishmentTypeSchema = z.enum(
  [
    "COUNTRY_HOUSE",
    "HALL",
    "ROOFTOP",
    "MANOR",
    "INDUSTRIAL_WAREHOUSE",
    "GARDEN",
    "BEACH_HOUSE",
    "OTHER",
  ],
  {
    required_error: "Selecciona el tipo de establecimiento",
  }
);

export const createEstablishmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre del establecimiento debe tener al menos 3 caracteres.")
    .max(150, "El nombre no puede exceder 150 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "La descripción debe tener al menos 20 caracteres para orientar a los clientes.")
    .max(3000, "La descripción no puede exceder 3000 caracteres."),
  establishmentType: establishmentTypeSchema,
  ubigeoCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El ubigeo debe tener exactamente 6 dígitos numéricos."),
  approximateLatitude: z
    .number({ invalid_type_error: "Latitud referencial inválida" })
    .min(-18.5, "La latitud debe corresponder al territorio peruano")
    .max(-0.0, "La latitud debe corresponder al territorio peruano"),
  approximateLongitude: z
    .number({ invalid_type_error: "Longitud referencial inválida" })
    .min(-81.5, "La longitud debe corresponder al territorio peruano")
    .max(-68.5, "La longitud debe corresponder al territorio peruano"),
  noiseCurfewTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora de silencio inválido (HH:mm)")
    .optional()
    .nullable(),
  houseRules: z
    .string()
    .max(2000, "Las reglas de convivencia no pueden exceder 2000 caracteres.")
    .optional()
    .nullable(),

  // Datos privados de ubicación exacta (Segregados físicamente en establishment_locations_private)
  exactAddress: z
    .string()
    .trim()
    .min(5, "La dirección exacta debe tener al menos 5 caracteres.")
    .max(250, "La dirección exacta no puede exceder 250 caracteres."),
  addressReference: z
    .string()
    .trim()
    .max(250, "La referencia no puede exceder 250 caracteres.")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .trim()
    .max(10, "El código postal no puede exceder 10 caracteres.")
    .optional()
    .nullable(),
  hostContactPhone: peruvianPhoneSchema,
  hostContactEmail: z
    .string()
    .trim()
    .email("Ingresa un correo de contacto operativo válido.")
    .optional()
    .nullable(),
  accessInstructions: z
    .string()
    .trim()
    .max(1000, "Las instrucciones de acceso no pueden exceder 1000 caracteres.")
    .optional()
    .nullable(),
});

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>;

/**
 * Esquema de Moderación Administrativa
 */
export const moderationSchema = z.object({
  establishmentId: z.string().uuid("ID de establecimiento inválido"),
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"], {
    required_error: "Selecciona un estado de moderación válido",
  }),
  rejectionReason: z.string().max(500).optional().nullable(),
});

export type ModerationInput = z.infer<typeof moderationSchema>;
