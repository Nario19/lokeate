import * as React from "react";
import Link from "next/link";
import { EstablishmentStatusBadge } from "./establishment-status-badge";
import { MapPin, ShieldCheck, Clock } from "lucide-react";
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
    <div className="bg-white rounded-3xl border border-[#e9ebe7] overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between">
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#24362d]/10 text-[#24362d]">
            {typeLabel}
          </span>
          {isHostView && (
            <EstablishmentStatusBadge
              status={establishment.publishing_status}
              isActive={establishment.is_active}
            />
          )}
        </div>
        <h3 className="text-base font-black text-[#20231f] mt-2 line-clamp-1">
          {establishment.name}
        </h3>
      </div>

      <div className="px-5 pb-4 space-y-3">
        <p className="text-xs text-[#7d817c] line-clamp-2 leading-relaxed">
          {establishment.description}
        </p>

        <div className="space-y-1.5 text-xs text-[#7d817c]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#e35b44] flex-shrink-0" />
            <span>Zona referencial (~500m)</span>
          </div>

          {establishment.noise_curfew_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#24362d] flex-shrink-0" />
              <span>Toque de queda sonoro: {establishment.noise_curfew_time}</span>
            </div>
          )}
        </div>

        <div className="p-2.5 bg-[#f6f7f4] border border-[#e9ebe7] rounded-xl text-[11px] text-[#7d817c] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#24362d] flex-shrink-0" />
          <span>Dirección física resguardada por Ley N° 29733</span>
        </div>
      </div>

      <div className="p-4 border-t border-[#e9ebe7] bg-[#fafbf9] flex items-center justify-between">
        {isHostView ? (
          <Link
            href={`/host/establishments/${establishment.id}`}
            className="text-xs font-bold text-[#e35b44] hover:text-[#20231f] transition-colors"
          >
            Administrar Local →
          </Link>
        ) : (
          <Link
            href={`/espacios/${establishment.slug}`}
            className="text-xs font-bold text-[#e35b44] hover:text-[#20231f] transition-colors"
          >
            Ver Espacios Disponibles →
          </Link>
        )}
      </div>
    </div>
  );
}
