import * as React from "react";
import { Suspense } from "react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { AuthLayout } from "@/components/lokeate-ui";

export const metadata = {
  title: "Iniciar Sesión | LOKEATE",
  description: "Accede a tu cuenta de LOKEATE para gestionar tus reservas de locales de eventos.",
};

export default function LoginPage() {
  return (
    <AuthLayout subtitle="Accede para gestionar tus solicitudes, reservas y administrar tus locales.">
      <Suspense fallback={<div className="text-center p-8 text-slate-500">Cargando formulario...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
