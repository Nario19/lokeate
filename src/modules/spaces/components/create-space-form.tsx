"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSpaceSchema, type CreateSpaceInput } from "../schemas/space.schemas";
import { createSpaceAction } from "../actions/create-space.action";
import {
  LokeateButton,
  LokeateInput,
  LokeateSelect,
  LokeateTextarea,
  LokeateCard,
  LokeateCardHeader,
  LokeateCardContent,
  LokeateCardFooter,
  LokeateNotice,
} from "@/components/lokeate-ui";
import { Users, Maximize2, Clock, Sparkles } from "lucide-react";

interface CreateSpaceFormProps {
  establishmentId: string;
}

export function CreateSpaceForm({ establishmentId }: CreateSpaceFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSpaceInput>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      establishmentId,
      name: "",
      description: "",
      isEntireEstablishment: false,
      areaM2: 200,
      standingCapacity: 100,
      seatedCapacity: 80,
      setupBufferMinutes: 60,
      cleanupBufferMinutes: 60,
      cancellationPolicy: "MODERATE",
    },
  });

  const onSubmit = (data: CreateSpaceInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await createSpaceAction(data);
      if (!response.success) {
        setServerError(response.error || "Error al crear el espacio.");
      } else {
        setSuccessMessage("Espacio creado exitosamente.");
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
            Añadir Espacio al Establecimiento
          </h2>
        </div>
        <p className="text-xs text-[#7d817c] mt-1">
          Configura un salón, terraza, jardín individual o la opción de alquiler del establecimiento completo.
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
          <input type="hidden" {...register("establishmentId")} />

          <LokeateInput
            id="name"
            label="Nombre del Espacio"
            placeholder="Ej. Salón Principal de Cristal / Jardín Pachacámac"
            {...register("name")}
            error={errors.name?.message}
            disabled={isPending}
          />

          <LokeateTextarea
            id="description"
            label="Descripción del Espacio"
            rows={3}
            placeholder="Detalla iluminación, ventilación, piso, salidas de emergencia y vistas..."
            {...register("description")}
            error={errors.description?.message}
            disabled={isPending}
          />

          {/* Checkbox: Establecimiento Completo */}
          <div className="p-4 bg-[#f6f7f4] border border-[#e1e4df] rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="isEntireEstablishment"
              {...register("isEntireEstablishment")}
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-[#e1e4df] text-[#e35b44] focus:ring-[#e35b44]"
            />
            <div>
              <label htmlFor="isEntireEstablishment" className="text-xs font-bold text-[#20231f] cursor-pointer block">
                Este espacio representa el Establecimiento Completo (Alquiler Exclusivo)
              </label>
              <p className="text-[11px] text-[#7d817c] mt-0.5 leading-relaxed">
                Al reservarse este espacio, se inhabilitará automáticamente la disponibilidad de todos los demás espacios individuales de la propiedad para evitar doble reserva (<em>double-booking</em>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <LokeateInput
              id="areaM2"
              type="number"
              step="any"
              label="Área (m²)"
              {...register("areaM2", { valueAsNumber: true })}
              error={errors.areaM2?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="standingCapacity"
              type="number"
              label="Aforo de Pie"
              {...register("standingCapacity", { valueAsNumber: true })}
              error={errors.standingCapacity?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="seatedCapacity"
              type="number"
              label="Aforo Sentado"
              {...register("seatedCapacity", { valueAsNumber: true })}
              error={errors.seatedCapacity?.message}
              disabled={isPending}
            />
          </div>

          {/* Buffers de Montaje y Desmontaje */}
          <div className="p-4 bg-[#f6f7f4] border border-[#e1e4df] rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#20231f]">
              <Clock className="w-4 h-4 text-[#24362d]" />
              <span>Buffers Operativos de Protección Temporal</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LokeateInput
                id="setupBufferMinutes"
                type="number"
                label="Buffer de Montaje (Minutos previos)"
                {...register("setupBufferMinutes", { valueAsNumber: true })}
                error={errors.setupBufferMinutes?.message}
                disabled={isPending}
              />

              <LokeateInput
                id="cleanupBufferMinutes"
                type="number"
                label="Buffer de Desmontaje (Minutos posteriores)"
                {...register("cleanupBufferMinutes", { valueAsNumber: true })}
                error={errors.cleanupBufferMinutes?.message}
                disabled={isPending}
              />
            </div>
          </div>

          <LokeateSelect
            id="cancellationPolicy"
            label="Política de Cancelación Aplicable"
            {...register("cancellationPolicy")}
            error={errors.cancellationPolicy?.message}
            disabled={isPending}
          >
            <option value="FLEXIBLE">Flexible (Reembolso total hasta 7 días antes)</option>
            <option value="MODERATE">Moderada (Reembolso total hasta 14 días antes)</option>
            <option value="STRICT">Estricta (Reembolso parcial con más de 30 días)</option>
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
              Guardar Espacio
            </LokeateButton>
          </div>
        </form>
      </LokeateCardContent>
    </LokeateCard>
  );
}
