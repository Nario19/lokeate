"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPricingPlanSchema,
  type CreatePricingPlanInput,
} from "../schemas/space.schemas";
import { createPricingPlanAction } from "../actions/create-pricing-plan.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Shield, DollarSign } from "lucide-react";

interface CreatePricingPlanFormProps {
  spaceId: string;
  establishmentId: string;
}

export function CreatePricingPlanForm({
  spaceId,
  establishmentId,
}: CreatePricingPlanFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreatePricingPlanInput>({
    resolver: zodResolver(createPricingPlanSchema),
    defaultValues: {
      spaceId,
      planName: "",
      description: "",
      pricingMode: "HOURLY",
      basePriceWeekday: 150,
      basePriceWeekend: 200,
      extraHourPrice: 100,
      minimumRentalHours: 4,
      minimumBillableGuests: 1,
      cleaningFee: 80,
      securityDeposit: 500,
      requiredAdvancePercentage: 50,
      taxCondition: "TAX_EXEMPT_OR_NOT_APPLICABLE",
      currency: "PEN",
    },
  });

  const selectedMode = watch("pricingMode");

  const onSubmit = (data: CreatePricingPlanInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await createPricingPlanAction(data);
      if (!response.success) {
        setServerError(response.error || "Error al configurar el plan.");
      } else {
        setSuccessMessage("Plan tarifario configurado con éxito.");
        setTimeout(() => {
          router.push(`/host/establishments/${establishmentId}`);
          router.refresh();
        }, 1500);
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-xl font-bold text-slate-900">
            Añadir Plan Tarifario Alternativo
          </CardTitle>
        </div>
        <CardDescription>
          Configura una modalidad de cobro (por hora, paquete, por persona o evento fijo). Un mismo espacio puede tener múltiples planes alternativos sin sumarse automáticamente.
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
          <input type="hidden" {...register("spaceId")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="planName">Nombre del Plan</Label>
              <Input
                id="planName"
                placeholder="Ej. Tarifa Básica por Hora / Paquete Quinceaños"
                {...register("planName")}
                disabled={isPending}
              />
              {errors.planName && (
                <p className="text-xs text-red-600">{errors.planName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricingMode">Modalidad de Cobro Aprobada</Label>
              <select
                id="pricingMode"
                {...register("pricingMode")}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <option value="HOURLY">Por Hora (HOURLY)</option>
                <option value="FIXED_EVENT">Por Evento / Turno Fijo (FIXED_EVENT)</option>
                <option value="PER_PERSON">Por Persona / Invitado (PER_PERSON)</option>
                <option value="PACKAGE">Paquete Integral (PACKAGE)</option>
              </select>
              {errors.pricingMode && (
                <p className="text-xs text-red-600">{errors.pricingMode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción y Alcance del Plan</Label>
            <Input
              id="description"
              placeholder="Ej. Incluye mobiliario básico para 80 personas y uso de cocina"
              {...register("description")}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Tarifas Base Diferenciadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="basePriceWeekday">
                Precio Entre Semana ({selectedMode === "HOURLY" ? "S/ por hora" : "S/ base"})
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-bold">
                  S/
                </span>
                <Input
                  id="basePriceWeekday"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  {...register("basePriceWeekday", { valueAsNumber: true })}
                  disabled={isPending}
                />
              </div>
              {errors.basePriceWeekday && (
                <p className="text-xs text-red-600">{errors.basePriceWeekday.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="basePriceWeekend">
                Precio Fin de Semana ({selectedMode === "HOURLY" ? "S/ por hora" : "S/ base"})
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-bold">
                  S/
                </span>
                <Input
                  id="basePriceWeekend"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  {...register("basePriceWeekend", { valueAsNumber: true })}
                  disabled={isPending}
                />
              </div>
              {errors.basePriceWeekend && (
                <p className="text-xs text-red-600">{errors.basePriceWeekend.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="minimumRentalHours">Alquiler Mínimo (Horas)</Label>
              <Input
                id="minimumRentalHours"
                type="number"
                {...register("minimumRentalHours", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.minimumRentalHours && (
                <p className="text-xs text-red-600">{errors.minimumRentalHours.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extraHourPrice">Hora Adicional (S/)</Label>
              <Input
                id="extraHourPrice"
                type="number"
                step="0.01"
                {...register("extraHourPrice", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.extraHourPrice && (
                <p className="text-xs text-red-600">{errors.extraHourPrice.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cleaningFee">Tarifa de Limpieza (S/)</Label>
              <Input
                id="cleaningFee"
                type="number"
                step="0.01"
                {...register("cleaningFee", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.cleaningFee && (
                <p className="text-xs text-red-600">{errors.cleaningFee.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="securityDeposit">Depósito de Garantía (S/)</Label>
              <Input
                id="securityDeposit"
                type="number"
                step="0.01"
                {...register("securityDeposit", { valueAsNumber: true })}
                disabled={isPending}
              />
              <p className="text-[11px] text-slate-500">
                Reembolsable en 7 días calendario tras evento sin daños observados.
              </p>
              {errors.securityDeposit && (
                <p className="text-xs text-red-600">{errors.securityDeposit.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requiredAdvancePercentage">Anticipo Requerido (%)</Label>
              <Input
                id="requiredAdvancePercentage"
                type="number"
                min={10}
                max={100}
                {...register("requiredAdvancePercentage", { valueAsNumber: true })}
                disabled={isPending}
              />
              <p className="text-[11px] text-slate-500">
                Porcentaje obligatorio para confirmar la reserva (10% a 100%).
              </p>
              {errors.requiredAdvancePercentage && (
                <p className="text-xs text-red-600">{errors.requiredAdvancePercentage.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxCondition">Condición Tributaria SUNAT (IGV 18%)</Label>
            <select
              id="taxCondition"
              {...register("taxCondition")}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <option value="TAX_EXEMPT_OR_NOT_APPLICABLE">
                Exonerado / No aplicable (Personas naturales 1ra/2da categoría)
              </option>
              <option value="TAX_INCLUDED_18_IGV">
                Precio incluye 18% IGV (Boleta/Factura emitida por anfitrión)
              </option>
              <option value="TAX_ADDITIONAL_18_IGV">
                Adiciona 18% IGV si el cliente solicita factura comercial
              </option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando plan...
                </>
              ) : (
                "Guardar Plan Tarifario"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
