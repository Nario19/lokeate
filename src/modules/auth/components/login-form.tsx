"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../schemas/auth.schemas";
import { loginUserAction } from "../actions/login.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const nextUrl = searchParams.get("next") || "/dashboard";

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
    <Card className="w-full max-w-md mx-auto shadow-md border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-900">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-center text-slate-600">
          Accede a tu panel de LOKEATE para gestionar tus reservas o locales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isRegistered && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Cuenta creada exitosamente. Ingresa tus credenciales para acceder.</span>
          </div>
        )}

        {serverError && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/auth/reset-password"
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isPending}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-600">
          ¿Aún no tienes una cuenta?{" "}
          <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Regístrate aquí
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
