import * as React from "react";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";
import { AuthLayout } from "@/components/lokeate-ui";

export const metadata = {
  title: "Recuperar Contraseña | LOKEATE",
  description: "Recupera el acceso a tu cuenta de LOKEATE.",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout subtitle="Ingresa tu correo para recuperar el acceso a tu cuenta.">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
