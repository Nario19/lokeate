"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../schemas/auth.schemas";
import { registerUserAction } from "../actions/register.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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
        setSuccessMessage(response.message || "Registro completado con éxito.");
        setTimeout(() => {
          router.push("/auth/login?registered=true");
        }, 2000);
      }
    });
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-md border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-900">
          Crear cuenta en LOKEATE
        </CardTitle>
        <CardDescription className="text-center text-slate-600">
          Alquila los mejores locales para eventos en el Perú con transparencia RealPrice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Nombres</Label>
              <Input
                id="firstName"
                placeholder="Ej. Juan"
                {...register("firstName")}
                disabled={isPending}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                placeholder="Ej. Pérez Quispe"
                {...register("lastName")}
                disabled={isPending}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <select
                id="documentType"
                {...register("documentType")}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <option value="DNI">DNI (8 dígitos)</option>
                <option value="CE">Carné de Extranjería</option>
                <option value="RUC">RUC (11 dígitos)</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
              {errors.documentType && (
                <p className="text-xs text-red-600">{errors.documentType.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="documentNumber">
                Número de {selectedDocType}
              </Label>
              <Input
                id="documentNumber"
                placeholder={
                  selectedDocType === "DNI"
                    ? "8 dígitos (ej. 45678912)"
                    : selectedDocType === "RUC"
                    ? "11 dígitos (ej. 10456789121)"
                    : "Número de documento oficial"
                }
                {...register("documentNumber")}
                disabled={isPending}
              />
              {errors.documentNumber && (
                <p className="text-xs text-red-600">{errors.documentNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono Móvil (Perú)</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-medium">
                  +51
                </span>
                <Input
                  id="phone"
                  className="pl-12"
                  placeholder="987654321"
                  maxLength={9}
                  {...register("phone")}
                  disabled={isPending}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register("password")}
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                {...register("confirmPassword")}
                disabled={isPending}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Banner de Protección de Datos Personales */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Privacidad garantizada (Ley N° 29733):</strong> Tu número de documento y teléfono quedan resguardados en bóveda privada con políticas RLS. Jamás se exponen a otros usuarios sin una reserva confirmada.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="termsAccepted"
              {...register("termsAccepted")}
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="termsAccepted" className="text-xs text-slate-600 font-normal leading-relaxed">
              Acepto los{" "}
              <Link href="/terms" className="text-indigo-600 underline hover:text-indigo-800">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" className="text-indigo-600 underline hover:text-indigo-800">
                Política de Privacidad
              </Link>{" "}
              de LOKEATE.
            </Label>
          </div>
          {errors.termsAccepted && (
            <p className="text-xs text-red-600">{errors.termsAccepted.message}</p>
          )}

          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-600">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Iniciar Sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
