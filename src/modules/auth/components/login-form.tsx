"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../schemas/auth.schemas";
import { loginUserAction } from "../actions/login.action";
import {
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateInput,
  LokeateButton,
  LokeateNotice,
} from "@/components/lokeate-ui";
import { ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams?.get("registered") === "true";
  const nextUrl = searchParams?.get("next") || "/dashboard";

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);

    startTransition(async () => {
      const response = await loginUserAction(data);
      if (!response.success) {
        setServerError(response.error || "Credenciales incorrectas.");
      } else {
        router.push(nextUrl);
        router.refresh();
      }
    });
  };

  return (
    <LokeateCard className="max-w-md mx-auto">
      <LokeateCardHeader className="text-center space-y-1">
        <h3 className="tracking-tight text-2xl font-bold text-slate-900 font-heading">
          Iniciar Sesión
        </h3>
        <p className="text-xs text-[#7d817c]">
          Accede a tu panel de LOKEATE para gestionar tus reservas o locales.
        </p>
      </LokeateCardHeader>

      <LokeateCardContent className="space-y-4">
        {isRegistered && (
          <LokeateNotice type="success" title="¡Registro exitoso!">
            Tu cuenta ha sido creada. Ingresa tus credenciales para acceder.
          </LokeateNotice>
        )}

        {serverError && (
          <LokeateNotice type="error" title="Error de acceso">
            {serverError}
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f]"
              >
                Contraseña
              </label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-[#e35b44] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <LokeateInput
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isPending}
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <LokeateButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isPending}
          >
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </LokeateButton>
        </form>

        <div className="text-center pt-2 text-xs text-[#7d817c]">
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-[#e35b44] hover:underline"
          >
            Regístrate aquí
          </Link>
        </div>
      </LokeateCardContent>
    </LokeateCard>
  );
}
