"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSpaceSchema, type CreateSpaceInput } from "../schemas/space.schemas";
import { createSpaceAction } from "../actions/create-space.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Users, Maximize2, Clock, ShieldCheck } from "lucide-react";

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
    <Card className="max-w-2xl mx-auto border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Añadir Espacio al Establecimiento
        </CardTitle>
        <CardDescription>
          Configura un salón, terraza, jardín individual o la opción de alquiler del establecimiento completo.
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
          <input type="hidden" {...register("establishmentId")} />

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del Espacio</Label>
            <Input
              id="name"
              placeholder="Ej. Salón Principal de Cristal / Jardín Pachacámac"
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción del Espacio</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Detalla iluminación, ventilación, piso, salidas de emergencia y vistas..."
              className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              {...register("description")}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Checkbox: Establecimiento Completo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
            <input
              type="checkbox"
              id="isEntireEstablishment"
              {...register("isEntireEstablishment")}
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <Label htmlFor="isEntireEstablishment" className="font-semibold text-slate-900 cursor-pointer">
                Este espacio representa el Establecimiento Completo (Alquiler Exclusivo)
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">
                Al reservarse este espacio, se inhabilitará automáticamente la disponibilidad de todos los demás espacios individuales de la propiedad para evitar doble reserva (*double-booking*).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="areaM2" className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                Área (m²)
              </Label>
              <Input
                id="areaM2"
                type="number"
                step="any"
                {...register("areaM2", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.areaM2 && (
                <p className="text-xs text-red-600">{errors.areaM2.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="standingCapacity" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Aforo de Pie
              </Label>
              <Input
                id="standingCapacity"
                type="number"
                {...register("standingCapacity", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.standingCapacity && (
                <p className="text-xs text-red-600">{errors.standingCapacity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seatedCapacity" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Aforo Sentado
              </Label>
              <Input
                id="seatedCapacity"
                type="number"
                {...register("seatedCapacity", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.seatedCapacity && (
                <p className="text-xs text-red-600">{errors.seatedCapacity.message}</p>
              )}
            </div>
          </div>

          {/* Buffers de Montaje y Desmontaje */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Buffers Operativos de Protección Temporal</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="setupBufferMinutes" className="text-xs text-slate-700">
                  Buffer de Montaje (Minutos previos)
                </Label>
                <Input
                  id="setupBufferMinutes"
                  type="number"
                  {...register("setupBufferMinutes", { valueAsNumber: true })}
                  disabled={isPending}
                />
                {errors.setupBufferMinutes && (
                  <p className="text-xs text-red-600">{errors.setupBufferMinutes.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="cleanupBufferMinutes" className="text-xs text-slate-700">
                  Buffer de Desmontaje (Minutos posteriores)
                </Label>
                <Input
                  id="cleanupBufferMinutes"
                  type="number"
                  {...register("cleanupBufferMinutes", { valueAsNumber: true })}
                  disabled={isPending}
                />
                {errors.cleanupBufferMinutes && (
                  <p className="text-xs text-red-600">{errors.cleanupBufferMinutes.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancellationPolicy">Política de Cancelación Aplicable</Label>
            <select
              id="cancellationPolicy"
              {...register("cancellationPolicy")}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <option value="FLEXIBLE">Flexible (Reembolso total hasta 7 días antes)</option>
              <option value="MODERATE">Moderada (Reembolso total hasta 14 días antes)</option>
              <option value="STRICT">Estricta (Reembolso parcial con más de 30 días)</option>
            </select>
            {errors.cancellationPolicy && (
              <p className="text-xs text-red-600">{errors.cancellationPolicy.message}</p>
            )}
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
                  Creando espacio...
                </>
              ) : (
                "Guardar Espacio"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
