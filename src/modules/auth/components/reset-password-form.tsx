"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "../schemas/auth.schemas";
import { requestPasswordResetAction } from "../actions/reset-password.action";
import {
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateInput,
  LokeateButton,
  LokeateNotice,
} from "@/components/lokeate-ui";
import { ArrowLeft } from "lucide-react";

export function ResetPasswordForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: RequestPasswordResetInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await requestPasswordResetAction(data);
      if (!response.success) {
        setServerError(response.error || "No se pudo procesar la solicitud.");
      } else {
        setSuccessMessage(
          response.message || "Correo de recuperación enviado con éxito. Revisa tu bandeja de entrada."
        );
      }
    });
  };

  return (
    <LokeateCard className="max-w-md mx-auto">
      <LokeateCardHeader className="text-center space-y-1">
        <h3 className="tracking-tight text-2xl font-bold text-slate-900 font-heading">
          Recuperar Contraseña
        </h3>
        <p className="text-xs text-[#7d817c]">
          Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones.
        </p>
      </LokeateCardHeader>

      <LokeateCardContent className="space-y-4">
        {serverError && (
          <LokeateNotice type="error" title="Error">
            {serverError}
          </LokeateNotice>
        )}

        {successMessage && (
          <LokeateNotice type="success" title="Correo enviado">
            {successMessage}
          </LokeateNotice>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <LokeateInput
            label="Correo Electrónico"
            id="email"
            type="email"
            placeholder="tu@correo.com"
            disabled={isPending}
            error={errors.email?.message}
            {...register("email")}
          />

          <LokeateButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isPending}
          >
            <span>Enviar Instrucciones</span>
          </LokeateButton>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-xs font-bold text-[#7d817c] hover:text-[#e35b44] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver a Iniciar Sesión
          </Link>
        </div>
      </LokeateCardContent>
    </LokeateCard>
  );
}
