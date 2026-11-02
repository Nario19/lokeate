"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../schemas/auth.schemas";
import { registerUserAction } from "../actions/register.action";
import {
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateInput,
  LokeateSelect,
  LokeateButton,
  LokeateNotice,
  BrandLogo,
} from "@/components/lokeate-ui";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      documentType: "DNI",
      documentNumber: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const selectedDocType = watch("documentType");

  const onSubmit = (data: RegisterInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await registerUserAction(data);
      if (!response.success) {
        setServerError(response.error || "Error al registrar la cuenta.");
      } else {
        setSuccessMessage("¡Cuenta creada con éxito! Redirigiendo a tu panel...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <LokeateCard className="max-w-xl mx-auto">
      <LokeateCardHeader className="text-center space-y-1">
        <h3 className="tracking-tight text-2xl font-bold text-slate-900 font-heading">
          Crear cuenta en LOKEATE
        </h3>
        <p className="text-xs text-[#7d817c]">
          Alquila los mejores locales para eventos en el Perú con transparencia RealPrice.
        </p>
      </LokeateCardHeader>

      <LokeateCardContent className="space-y-4">
        {/* Banner de Privacidad Ley N° 29733 */}
        <LokeateNotice type="privacy" title="Privacidad garantizada (Ley N° 29733)">
          Tus datos de identidad y teléfono residen segregados en la base de datos con políticas de acceso Row Level Security estrictas.
        </LokeateNotice>

        {serverError && (
          <LokeateNotice type="error" title="Atención">
            {serverError}
          </LokeateNotice>
        )}

        {successMessage && (
          <LokeateNotice type="success" title="¡Bienvenido!">
            {successMessage}
          </LokeateNotice>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LokeateInput
              label="Nombres"
              placeholder="Ej. Juan Carlos"
              disabled={isPending}
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <LokeateInput
              label="Apellidos"
              placeholder="Ej. Pérez Mendoza"
              disabled={isPending}
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          {/* Tipo de Documento y Número de Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <LokeateSelect
                label="Tipo de Documento"
                disabled={isPending}
                error={errors.documentType?.message}
                {...register("documentType")}
                options={[
                  { value: "DNI", label: "DNI (8 dígitos)" },
                  { value: "RUC", label: "RUC (11 dígitos)" },
                  { value: "CE", label: "Carné Extranjería" },
                  { value: "PASSPORT", label: "Pasaporte" },
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <LokeateInput
                label={`Número de ${selectedDocType}`}
                placeholder={
                  selectedDocType === "DNI"
                    ? "8 dígitos numéricos"
                    : selectedDocType === "RUC"
                    ? "11 dígitos (RUC 10 o 20)"
                    : "Número de documento"
                }
                maxLength={selectedDocType === "DNI" ? 8 : selectedDocType === "RUC" ? 11 : 15}
                disabled={isPending}
                error={errors.documentNumber?.message}
                {...register("documentNumber")}
              />
            </div>
          </div>

          {/* Teléfono Móvil y Correo Electrónico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LokeateInput
              label="Teléfono Móvil (Perú)"
              placeholder="987654321 (9 dígitos)"
              maxLength={9}
              disabled={isPending}
              error={errors.phone?.message}
              {...register("phone")}
            />
            <LokeateInput
              label="Correo Electrónico"
              type="email"
              placeholder="tu@correo.com"
              disabled={isPending}
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LokeateInput
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              disabled={isPending}
              error={errors.password?.message}
              {...register("password")}
            />
            <LokeateInput
              label="Confirmar Contraseña"
              type="password"
              placeholder="Repite la contraseña"
              disabled={isPending}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          {/* Aviso Legal y de Privacidad */}
          <LokeateNotice type="privacy" title="Protección de Identidad (Ley N° 29733)">
            Tus datos personales y documento de identidad se resguardan de forma confidencial. Nunca se comparten públicamente en el catálogo.
          </LokeateNotice>

          {/* Términos y Condiciones */}
          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#626860]">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-[#e1e4df] text-[#e35b44] focus:ring-[#e35b44] accent-[#e35b44]"
                {...register("termsAccepted")}
                disabled={isPending}
              />
              <span>
                Acepto los Términos del Servicio y la Política de Privacidad de LOKEATE.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-[11px] text-rose-600 font-semibold">
                {errors.termsAccepted.message}
              </p>
            )}
          </div>

          {/* Botón de Enviar */}
          <LokeateButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isPending}
          >
            <span>Crear Cuenta</span>
            <ArrowRight className="w-4 h-4" />
          </LokeateButton>
        </form>

        <div className="text-center pt-2 text-xs text-[#7d817c]">
          ¿Ya tienes una cuenta en LOKEATE?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-[#e35b44] hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </div>
      </LokeateCardContent>
    </LokeateCard>
  );
}
