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
import {
  LokeateButton,
  LokeateInput,
  LokeateSelect,
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateNotice,
} from "@/components/lokeate-ui";
import { Sparkles, DollarSign } from "lucide-react";

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
    <LokeateCard className="max-w-2xl mx-auto">
      <LokeateCardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#e35b44]" />
          <h2 className="text-xl font-black text-[#20231f]">
            Añadir Plan Tarifario Alternativo
          </h2>
        </div>
        <p className="text-xs text-[#7d817c] mt-1">
          Configura una modalidad de cobro (por hora, paquete, por persona o evento fijo). Un mismo espacio puede tener múltiples planes alternativos sin sumarse automáticamente.
        </p>
      </LokeateCardHeader>
      <LokeateCardContent>
        {serverError && (
          <div className="mb-4">
            <LokeateNotice type="error">
              <span>{serverError}</span>
            </LokeateNotice>
          </div>
        )}

        {successMessage && (
          <div className="mb-4">
            <LokeateNotice type="success">
              <span>{successMessage}</span>
            </LokeateNotice>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("spaceId")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateInput
              id="planName"
              label="Nombre del Plan"
              placeholder="Ej. Tarifa Básica por Hora / Paquete Quinceaños"
              {...register("planName")}
              error={errors.planName?.message}
              disabled={isPending}
            />

            <LokeateSelect
              id="pricingMode"
              label="Modalidad de Cobro Aprobada"
              {...register("pricingMode")}
              error={errors.pricingMode?.message}
              disabled={isPending}
            >
              <option value="HOURLY">Por Hora (HOURLY)</option>
              <option value="FIXED_EVENT">Por Evento / Turno Fijo (FIXED_EVENT)</option>
              <option value="PER_PERSON">Por Persona / Invitado (PER_PERSON)</option>
              <option value="PACKAGE">Paquete Integral (PACKAGE)</option>
            </LokeateSelect>
          </div>

          <LokeateInput
            id="description"
            label="Descripción y Alcance del Plan"
            placeholder="Ej. Incluye mobiliario básico para 80 personas y uso de cocina"
            {...register("description")}
            error={errors.description?.message}
            disabled={isPending}
          />

          {/* Tarifas Base Diferenciadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateInput
              id="basePriceWeekday"
              type="number"
              step="0.01"
              label={`Precio Entre Semana (${selectedMode === "HOURLY" ? "S/ por hora" : "S/ base"})`}
              {...register("basePriceWeekday", { valueAsNumber: true })}
              error={errors.basePriceWeekday?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="basePriceWeekend"
              type="number"
              step="0.01"
              label={`Precio Fin de Semana (${selectedMode === "HOURLY" ? "S/ por hora" : "S/ base"})`}
              {...register("basePriceWeekend", { valueAsNumber: true })}
              error={errors.basePriceWeekend?.message}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <LokeateInput
              id="minimumRentalHours"
              type="number"
              label="Alquiler Mínimo (Horas)"
              {...register("minimumRentalHours", { valueAsNumber: true })}
              error={errors.minimumRentalHours?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="extraHourPrice"
              type="number"
              step="0.01"
              label="Hora Adicional (S/)"
              {...register("extraHourPrice", { valueAsNumber: true })}
              error={errors.extraHourPrice?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="cleaningFee"
              type="number"
              step="0.01"
              label="Tarifa de Limpieza (S/)"
              {...register("cleaningFee", { valueAsNumber: true })}
              error={errors.cleaningFee?.message}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateInput
              id="securityDeposit"
              type="number"
              step="0.01"
              label="Depósito de Garantía (S/)"
              helperText="Reembolsable en 7 días calendario tras evento sin daños."
              {...register("securityDeposit", { valueAsNumber: true })}
              error={errors.securityDeposit?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="requiredAdvancePercentage"
              type="number"
              min={10}
              max={100}
              label="Anticipo Requerido (%)"
              helperText="Porcentaje obligatorio para confirmar reserva (10% a 100%)."
              {...register("requiredAdvancePercentage", { valueAsNumber: true })}
              error={errors.requiredAdvancePercentage?.message}
              disabled={isPending}
            />
          </div>

          <LokeateSelect
            id="taxCondition"
            label="Condición Tributaria SUNAT (IGV 18%)"
            {...register("taxCondition")}
            disabled={isPending}
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
          </LokeateSelect>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e9ebe7]">
            <LokeateButton
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </LokeateButton>
            <LokeateButton
              type="submit"
              variant="primary"
              isLoading={isPending}
              disabled={isPending}
            >
              Guardar Plan Tarifario
            </LokeateButton>
          </div>
        </form>
      </LokeateCardContent>
    </LokeateCard>
  );
}
