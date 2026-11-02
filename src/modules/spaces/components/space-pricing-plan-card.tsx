import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyPEN } from "@/lib/utils";
import type { SpacePricingPlan } from "../types/space.types";
import { Sparkles, Clock, ShieldCheck, Check } from "lucide-react";

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
    <Card
      className={`border transition-all ${
        isSelected
          ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {modeLabel}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Min. {plan.minimum_rental_hours}h de alquiler
          </span>
        </div>
        <CardTitle className="text-base font-bold text-slate-900 mt-2">
          {plan.plan_name}
        </CardTitle>
        {plan.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {plan.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500">Entre Semana:</span>
            <p className="text-base font-bold text-slate-900">
              {formatCurrencyPEN(plan.base_price_weekday)}
              {plan.pricing_mode === "HOURLY" && (
                <span className="text-xs font-normal text-slate-500">/h</span>
              )}
            </p>
          </div>

          <div>
            <span className="text-slate-500">Fin de Semana:</span>
            <p className="text-base font-bold text-indigo-600">
              {formatCurrencyPEN(plan.base_price_weekend)}
              {plan.pricing_mode === "HOURLY" && (
                <span className="text-xs font-normal text-slate-500">/h</span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" /> Hora adicional:
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrencyPEN(plan.extra_hour_price)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Garantía reembolsable:
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrencyPEN(plan.security_deposit)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Anticipo para reserva:</span>
            <span className="font-semibold text-indigo-700">
              {plan.required_advance_percentage}% del total
            </span>
          </div>
        </div>

        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              isSelected
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
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
      </CardContent>
    </Card>
  );
}
