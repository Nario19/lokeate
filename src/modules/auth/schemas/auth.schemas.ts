import { z } from "zod";

/**
 * Validador para documentos peruanos y extranjeros reconocidos
 */
export const documentNumberSchema = z
  .object({
    documentType: z.enum(["DNI", "CE", "RUC", "PASSPORT"], {
      required_error: "Selecciona el tipo de documento",
    }),
    documentNumber: z
      .string()
      .trim()
      .min(1, "El número de documento es obligatorio"),
  })
  .superRefine((data, ctx) => {
    const { documentType, documentNumber } = data;

    if (documentType === "DNI") {
      if (!/^\d{8}$/.test(documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El DNI peruano debe contener exactamente 8 dígitos numéricos.",
        });
      }
    } else if (documentType === "RUC") {
      if (!/^(10|20)\d{9}$/.test(documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El RUC debe tener 11 dígitos y comenzar con 10 o 20.",
        });
      }
    } else if (documentType === "CE") {
      if (!/^[a-zA-Z0-9]{9,12}$/.test(documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El Carné de Extranjería debe tener entre 9 y 12 caracteres alfanuméricos.",
        });
      }
    } else if (documentType === "PASSPORT") {
      if (!/^[a-zA-Z0-9]{6,12}$/.test(documentNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message: "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.",
        });
      }
    }
  });

/**
 * Validador para número telefónico móvil en Perú (9 dígitos iniciando con 9)
 */
export const peruvianPhoneSchema = z
  .string()
  .trim()
  .regex(/^9\d{8}$/, "El teléfono móvil debe tener 9 dígitos y comenzar con 9 (ej. 987654321).");

/**
 * Validador para contraseña con política de seguridad
 */
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula.")
  .regex(/[a-z]/, "Debe contener al menos una letra minúscula.")
  .regex(/[0-9]/, "Debe contener al menos un número.");

/**
 * Esquema completo de Registro de Usuario
 */
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(100, "El nombre no puede exceder 100 caracteres."),
    lastName: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres.")
      .max(100, "El apellido no puede exceder 100 caracteres."),
    documentType: z.enum(["DNI", "CE", "RUC", "PASSPORT"], {
      required_error: "Selecciona el tipo de documento",
    }),
    documentNumber: z
      .string()
      .trim()
      .min(1, "El número de documento es obligatorio."),
    phone: peruvianPhoneSchema,
    email: z
      .string()
      .trim()
      .email("Ingresa un correo electrónico válido.")
      .max(150, "El correo no puede exceder 150 caracteres."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "Debes aceptar los Términos y Condiciones."),
  })
  .superRefine((data, ctx) => {
    // Validar coincidencia de contraseña
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }

    // Validar formato de documento según tipo
    const { documentType, documentNumber } = data;
    if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "El DNI peruano debe contener exactamente 8 dígitos numéricos.",
      });
    } else if (documentType === "RUC" && !/^(10|20)\d{9}$/.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "El RUC debe tener 11 dígitos y comenzar con 10 o 20.",
      });
    } else if (documentType === "CE" && !/^[a-zA-Z0-9]{9,12}$/.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "El Carné de Extranjería debe tener entre 9 y 12 caracteres alfanuméricos.",
      });
    } else if (documentType === "PASSPORT" && !/^[a-zA-Z0-9]{6,12}$/.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentNumber"],
        message: "El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos.",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Esquema de Inicio de Sesión
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido."),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Esquema de Solicitud de Recuperación de Clave
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido."),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

/**
 * Esquema de Actualización de Clave
 */
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
