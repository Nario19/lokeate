import * as React from "react";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { AuthLayout } from "@/components/lokeate-ui";

export const metadata = {
  title: "Registro de Usuario | LOKEATE",
  description: "Crea tu cuenta en LOKEATE con total protección de tus datos personales conforme a ley.",
};

export default function RegisterPage() {
  return (
    <AuthLayout subtitle="Encuentra o publica espacios extraordinarios para eventos con RealPrice Transparente.">
      <RegisterForm />
    </AuthLayout>
  );
}
