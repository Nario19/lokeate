import * as React from "react";
import type { PublishingStatus } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PublishingStatus;
  isActive?: boolean;
}

export function EstablishmentStatusBadge({ status, isActive }: StatusBadgeProps) {
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let label = "Borrador";

  switch (status) {
    case "DRAFT":
      badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
      label = "Borrador";
      break;
    case "SUBMITTED_FOR_REVIEW":
      badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
      label = "En Moderación";
      break;
    case "APPROVED":
      badgeColor = isActive
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-blue-50 text-blue-800 border-blue-200";
      label = isActive ? "Publicado y Activo" : "Aprobado (Inactivo)";
      break;
    case "REJECTED":
      badgeColor = "bg-red-50 text-red-800 border-red-200";
      label = "Observado";
      break;
    case "SUSPENDED":
      badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
      label = "Suspendido";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeColor
      )}
    >
      {label}
    </span>
  );
}
