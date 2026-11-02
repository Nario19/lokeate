"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEstablishmentSchema,
  type CreateEstablishmentInput,
} from "../schemas/establishment.schemas";
import { createEstablishmentAction } from "../actions/create-establishment.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import type { LaunchDistrict } from "../types/establishment.types";

interface CreateEstablishmentFormProps {
  districts: LaunchDistrict[];
}

export function CreateEstablishmentForm({ districts }: CreateEstablishmentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEstablishmentInput>({
    resolver: zodResolver(createEstablishmentSchema),
    defaultValues: {
      name: "",
      description: "",
      establishmentType: "COUNTRY_HOUSE",
      ubigeoCode: districts[0]?.ubigeo_code || "150123", // Pachacamac por defecto
      approximateLatitude: -12.2289,
      approximateLongitude: -76.8597,
      noiseCurfewTime: "02:00",
      houseRules: "",
      exactAddress: "",
      addressReference: "",
      postalCode: "",
      hostContactPhone: "987654321",
      hostContactEmail: "",
      accessInstructions: "",
    },
  });

  const onSubmit = (data: CreateEstablishmentInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const response = await createEstablishmentAction(data);
      if (!response.success) {
        setServerError(response.error || "Error al crear el establecimiento.");
      } else {
        setSuccessMessage("Establecimiento creado en estado Borrador exitosamente.");
        setTimeout(() => {
          router.push("/host/establishments");
          router.refresh();
        }, 1500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {serverError && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sección 1: Información Pública del Inmueble */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            1. Datos Generales del Establecimiento
          </CardTitle>
          <CardDescription>
            Esta información será visible públicamente en el catálogo una vez que el establecimiento sea aprobado por moderación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del Local o Establecimiento</Label>
            <Input
              id="name"
              placeholder="Ej. Quinta Las Palmeras de Cieneguilla"
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="establishmentType">Tipo de Establecimiento</Label>
              <select
                id="establishmentType"
                {...register("establishmentType")}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <option value="COUNTRY_HOUSE">Casa de Campo / Quinta</option>
                <option value="HALL">Salón de Eventos</option>
                <option value="ROOFTOP">Terraza / Rooftop</option>
                <option value="MANOR">Casona</option>
                <option value="INDUSTRIAL_WAREHOUSE">Almacén / Galpón Industrial</option>
                <option value="GARDEN">Jardín de Eventos</option>
                <option value="BEACH_HOUSE">Casa de Playa</option>
                <option value="OTHER">Otro Espacio Acondicionado</option>
              </select>
              {errors.establishmentType && (
                <p className="text-xs text-red-600">{errors.establishmentType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ubigeoCode">Distrito (Zonas de Lanzamiento Habilitadas)</Label>
              <select
                id="ubigeoCode"
                {...register("ubigeoCode")}
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {districts.map((d) => (
                  <option key={d.ubigeo_code} value={d.ubigeo_code}>
                    {d.name} ({d.launch_phase})
                  </option>
                ))}
              </select>
              {errors.ubigeoCode && (
                <p className="text-xs text-red-600">{errors.ubigeoCode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción Detallada</Label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe las áreas verdes, estilo arquitectónico, tipo de celebraciones admitidas y accesibilidad..."
              className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              {...register("description")}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="noiseCurfewTime">Límite de Música / Toque de Queda Sonoro</Label>
              <Input
                id="noiseCurfewTime"
                type="time"
                {...register("noiseCurfewTime")}
                disabled={isPending}
              />
              {errors.noiseCurfewTime && (
                <p className="text-xs text-red-600">{errors.noiseCurfewTime.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="houseRules">Reglas de Convivencia y Restricciones</Label>
              <Input
                id="houseRules"
                placeholder="Ej. Prohibido fuegos artificiales, sin confeti en piscina"
                {...register("houseRules")}
                disabled={isPending}
              />
              {errors.houseRules && (
                <p className="text-xs text-red-600">{errors.houseRules.message}</p>
              )}
            </div>
          </div>

          {/* Coordenadas aproximadas */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Georreferenciación Referencial Perturbada (~500m)</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              En el mapa público los clientes solo verán un círculo de proximidad de aproximadamente 500 metros para proteger la seguridad y privacidad del inmueble.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label htmlFor="approximateLatitude" className="text-xs text-amber-900">
                  Latitud Aproximada
                </Label>
                <Input
                  id="approximateLatitude"
                  type="number"
                  step="any"
                  {...register("approximateLatitude", { valueAsNumber: true })}
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="approximateLongitude" className="text-xs text-amber-900">
                  Longitud Aproximada
                </Label>
                <Input
                  id="approximateLongitude"
                  type="number"
                  step="any"
                  {...register("approximateLongitude", { valueAsNumber: true })}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección 2: Ubicación Confidencial Segregada físicamente */}
      <Card className="border-indigo-200 bg-indigo-50/15">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Lock className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-xl font-bold text-slate-900">
              2. Ubicación Confidencial y Contacto Operativo (Segregación Física)
            </CardTitle>
          </div>
          <CardDescription>
            Resguardo estricto mediante Row Level Security. Esta información <strong>NUNCA</strong> es pública. Solo se revelará a clientes con una reserva formalmente <code>CONFIRMED</code> o <code>IN_PROGRESS</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="exactAddress">Dirección Física Exacta (Calle, Número, Mz, Lote)</Label>
            <Input
              id="exactAddress"
              placeholder="Ej. Av. Nueva Toledo Km 11.5, Mz B Lote 4"
              {...register("exactAddress")}
              disabled={isPending}
            />
            {errors.exactAddress && (
              <p className="text-xs text-red-600">{errors.exactAddress.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="addressReference">Referencia Detallada de Llegada</Label>
              <Input
                id="addressReference"
                placeholder="Ej. A 200m del óvalo principal, portón verde de madera"
                {...register("addressReference")}
                disabled={isPending}
              />
              {errors.addressReference && (
                <p className="text-xs text-red-600">{errors.addressReference.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Código Postal (Opcional)</Label>
              <Input
                id="postalCode"
                placeholder="Ej. 15593"
                {...register("postalCode")}
                disabled={isPending}
              />
              {errors.postalCode && (
                <p className="text-xs text-red-600">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hostContactPhone">Teléfono de Contacto Operativo (Perú)</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-500 font-medium">
                  +51
                </span>
                <Input
                  id="hostContactPhone"
                  className="pl-12"
                  placeholder="987654321"
                  maxLength={9}
                  {...register("hostContactPhone")}
                  disabled={isPending}
                />
              </div>
              {errors.hostContactPhone && (
                <p className="text-xs text-red-600">{errors.hostContactPhone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hostContactEmail">Correo de Contacto Operativo (Opcional)</Label>
              <Input
                id="hostContactEmail"
                type="email"
                placeholder="contacto@milocal.pe"
                {...register("hostContactEmail")}
                disabled={isPending}
              />
              {errors.hostContactEmail && (
                <p className="text-xs text-red-600">{errors.hostContactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accessInstructions">Instrucciones de Acceso al Inmueble</Label>
            <textarea
              id="accessInstructions"
              rows={3}
              placeholder="Ej. Avisar en garita de control de la urbanización mostrando DNI; código de acceso peatonal 4421."
              className="flex w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              {...register("accessInstructions")}
              disabled={isPending}
            />
            {errors.accessInstructions && (
              <p className="text-xs text-red-600">{errors.accessInstructions.message}</p>
            )}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>
              Conforme a la Ley N° 29733 de Protección de Datos Personales, este registro se almacena segregado en la tabla <code>establishment_locations_private</code> protegida por RLS.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} className="px-6">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando establecimiento...
            </>
          ) : (
            "Registrar Establecimiento (Borrador)"
          )}
        </Button>
      </div>
    </form>
  );
}
