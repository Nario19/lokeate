import * as React from "react";
import { formatCurrencyPEN } from "@/lib/utils";
import type { SpacePricingPlan } from "../types/space.types";
import { Clock, ShieldCheck, Check } from "lucide-react";

interface SpacePricingPlanCardProps {
  plan: SpacePricingPlan;
  onSelect?: () => void;
  isSelected?: boolean;
}

const PRICING_MODE_NAMES: Record<string, string> = {
  HOURLY: "Por Hora",
  FIXED_EVENT: "Evento Fijo",
  PER_PERSON: "Por Invitado",
  PACKAGE: "Paquete Integral",
};

export function SpacePricingPlanCard({
  plan,
  onSelect,
  isSelected = false,
}: SpacePricingPlanCardProps) {
  const modeLabel = PRICING_MODE_NAMES[plan.pricing_mode] || plan.pricing_mode;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isSelected
          ? "border-[#e35b44] ring-2 ring-[#e35b44]/20 bg-[#e35b44]/5"
          : "border-[#e9ebe7] bg-white hover:border-[#20231f]/20 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#24362d]/10 text-[#24362d]">
          {modeLabel}
        </span>
        <span className="text-[11px] text-[#7d817c] font-medium">
          Mín. {plan.minimum_rental_hours}h
        </span>
      </div>

      <h4 className="text-sm font-black text-[#20231f] mt-2">
        {plan.plan_name}
      </h4>

      {plan.description && (
        <p className="text-[11px] text-[#7d817c] line-clamp-2 mt-1">
          {plan.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-[#e9ebe7] text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#7d817c]">Lun a Jue</span>
          <p className="text-sm font-black text-[#20231f]">
            {formatCurrencyPEN(plan.base_price_weekday)}
            {plan.pricing_mode === "HOURLY" && (
              <span className="text-[10px] font-normal text-[#7d817c]">/h</span>
            )}
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-[#7d817c]">Vie a Dom</span>
          <p className="text-sm font-black text-[#e35b44]">
            {formatCurrencyPEN(plan.base_price_weekend)}
            {plan.pricing_mode === "HOURLY" && (
              <span className="text-[10px] font-normal text-[#7d817c]">/h</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 pt-3 mt-3 border-t border-[#e9ebe7] text-[11px] text-[#7d817c]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hora extra:
          </span>
          <span className="font-bold text-[#20231f]">
            {formatCurrencyPEN(plan.extra_hour_price)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#24362d]" /> Garantía:
          </span>
          <span className="font-bold text-[#20231f]">
            {formatCurrencyPEN(plan.security_deposit)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Anticipo:</span>
          <span className="font-extrabold text-[#e35b44]">
            {plan.required_advance_percentage}%
          </span>
        </div>
      </div>

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className={`w-full mt-3 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isSelected
              ? "bg-[#20231f] text-white shadow-sm"
              : "bg-[#f6f7f4] text-[#20231f] hover:bg-[#e9ebe7]"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              Plan Seleccionado
            </>
          ) : (
            "Cotizar con este Plan"
          )}
        </button>
      )}
    </div>
  );
}
