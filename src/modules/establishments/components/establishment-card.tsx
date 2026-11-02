import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EstablishmentStatusBadge } from "./establishment-status-badge";
import { MapPin, ShieldCheck, Clock, Building } from "lucide-react";
import type { Establishment } from "../types/establishment.types";

interface EstablishmentCardProps {
  establishment: Establishment;
  isHostView?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  COUNTRY_HOUSE: "Casa de Campo / Quinta",
  HALL: "Salón de Eventos",
  ROOFTOP: "Terraza / Rooftop",
  MANOR: "Casona Histórica",
  INDUSTRIAL_WAREHOUSE: "Almacén / Galpón",
  GARDEN: "Jardín de Eventos",
  BEACH_HOUSE: "Casa de Playa",
  OTHER: "Espacio Acondicionado",
};

export function EstablishmentCard({ establishment, isHostView = false }: EstablishmentCardProps) {
  const typeLabel = TYPE_LABELS[establishment.establishment_type] || establishment.establishment_type;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between border-slate-200">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
            {typeLabel}
          </span>
          {isHostView && (
            <EstablishmentStatusBadge
              status={establishment.publishing_status}
              isActive={establishment.is_active}
            />
          )}
        </div>
        <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
          {establishment.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 pt-0 pb-4 space-y-3">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {establishment.description}
        </p>

        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span>Zona referencial (~500m)</span>
          </div>

          {establishment.noise_curfew_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Toque de queda sonoro: {establishment.noise_curfew_time}</span>
            </div>
          )}
        </div>

        <div className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Dirección física resguardada por Ley N° 29733</span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between">
        {isHostView ? (
          <Link
            href={`/host/establishments/${establishment.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Administrar Local →
          </Link>
        ) : (
          <Link
            href={`/espacios/${establishment.slug}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Ver Espacios Disponibles →
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
