import * as React from "react";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export const metadata = {
  title: "Recuperar Contraseña | LOKEATE",
  description: "Recupera el acceso a tu cuenta de LOKEATE.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
