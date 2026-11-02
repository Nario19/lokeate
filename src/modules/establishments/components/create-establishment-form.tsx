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
import { ShieldCheck, Lock, Info, Building2 } from "lucide-react";
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
        <LokeateNotice type="error">
          <span>{serverError}</span>
        </LokeateNotice>
      )}

      {successMessage && (
        <LokeateNotice type="success">
          <span>{successMessage}</span>
        </LokeateNotice>
      )}

      {/* Sección 1: Información Pública del Inmueble */}
      <LokeateCard>
        <LokeateCardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#e35b44]" />
            <h2 className="text-lg font-bold text-[#20231f]">
              1. Datos Generales del Establecimiento
            </h2>
          </div>
          <p className="text-xs text-[#7d817c] mt-1">
            Esta información será visible públicamente en el catálogo tras la aprobación del equipo de moderación.
          </p>
        </LokeateCardHeader>
        <LokeateCardContent className="space-y-4">
          <LokeateInput
            id="name"
            label="Nombre del Local o Establecimiento"
            placeholder="Ej. Casona colonial & jardines de Pachacámac"
            {...register("name")}
            error={errors.name?.message}
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateSelect
              id="establishmentType"
              label="Tipo de Establecimiento"
              {...register("establishmentType")}
              error={errors.establishmentType?.message}
              disabled={isPending}
            >
              <option value="COUNTRY_HOUSE">Casa de Campo / Quinta</option>
              <option value="HALL">Salón de Eventos</option>
              <option value="ROOFTOP">Terraza / Rooftop</option>
              <option value="MANOR">Casona</option>
              <option value="INDUSTRIAL_WAREHOUSE">Almacén / Galpón Industrial</option>
              <option value="GARDEN">Jardín de Eventos</option>
              <option value="BEACH_HOUSE">Casa de Playa</option>
              <option value="OTHER">Otro Espacio Acondicionado</option>
            </LokeateSelect>

            <LokeateSelect
              id="ubigeoCode"
              label="Distrito (Zonas de Lanzamiento Habilitadas)"
              {...register("ubigeoCode")}
              error={errors.ubigeoCode?.message}
              disabled={isPending}
            >
              {districts.map((d) => (
                <option key={d.ubigeo_code} value={d.ubigeo_code}>
                  {d.name} ({d.launch_phase})
                </option>
              ))}
            </LokeateSelect>
          </div>

          <LokeateTextarea
            id="description"
            label="Descripción Detallada"
            rows={4}
            placeholder="Describe las áreas verdes, estilo arquitectónico, tipo de celebraciones admitidas y accesibilidad..."
            {...register("description")}
            error={errors.description?.message}
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateInput
              id="noiseCurfewTime"
              type="time"
              label="Límite de Música / Toque de Queda Sonoro"
              {...register("noiseCurfewTime")}
              error={errors.noiseCurfewTime?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="houseRules"
              label="Reglas de Convivencia y Restricciones"
              placeholder="Ej. Prohibido fuegos artificiales, sin confeti en piscina"
              {...register("houseRules")}
              error={errors.houseRules?.message}
              disabled={isPending}
            />
          </div>

          {/* Coordenadas referenciales perturbadas */}
          <div className="p-4 bg-[#f6f7f4] border border-[#e1e4df] rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#20231f]">
              <Info className="w-4 h-4 text-[#e35b44] flex-shrink-0" />
              <span>Georreferenciación Referencial Perturbada (~500m)</span>
            </div>
            <p className="text-[11px] text-[#7d817c] leading-relaxed">
              En el mapa público los clientes solo verán un círculo de proximidad de aproximadamente 500 metros para proteger la seguridad y privacidad del inmueble.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <LokeateInput
                id="approximateLatitude"
                type="number"
                step="any"
                label="Latitud Aproximada"
                {...register("approximateLatitude", { valueAsNumber: true })}
                error={errors.approximateLatitude?.message}
                disabled={isPending}
              />
              <LokeateInput
                id="approximateLongitude"
                type="number"
                step="any"
                label="Longitud Aproximada"
                {...register("approximateLongitude", { valueAsNumber: true })}
                error={errors.approximateLongitude?.message}
                disabled={isPending}
              />
            </div>
          </div>
        </LokeateCardContent>
      </LokeateCard>

      {/* Sección 2: Ubicación Confidencial Segregada físicamente */}
      <LokeateCard className="border-[#e1e4df] bg-[#fafbf9]">
        <LokeateCardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#24362d]" />
            <h2 className="text-lg font-bold text-[#20231f]">
              2. Ubicación Confidencial y Contacto Operativo (Segregación Física)
            </h2>
          </div>
          <p className="text-xs text-[#7d817c] mt-1">
            Resguardo estricto mediante Row Level Security. Esta información <strong>NUNCA</strong> es pública. Solo se revelará a clientes con una reserva formalmente <code>CONFIRMED</code> o <code>IN_PROGRESS</code>.
          </p>
        </LokeateCardHeader>
        <LokeateCardContent className="space-y-4">
          <LokeateInput
            id="exactAddress"
            label="Dirección Física Exacta (Calle, Número, Mz, Lote)"
            placeholder="Ej. Av. Nueva Toledo Km 11.5, Mz B Lote 4"
            {...register("exactAddress")}
            error={errors.exactAddress?.message}
            disabled={isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LokeateInput
              id="addressReference"
              label="Referencia Detallada de Llegada"
              placeholder="Ej. A 200m del óvalo principal, portón verde de madera"
              {...register("addressReference")}
              error={errors.addressReference?.message}
              disabled={isPending}
            />

            <LokeateInput
              id="postalCode"
              label="Código Postal (Opcional)"
              placeholder="Ej. 15593"
              {...register("postalCode")}
              error={errors.postalCode?.message}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <LokeateInput
                id="hostContactPhone"
                label="Teléfono de Contacto Operativo (Perú)"
                placeholder="987654321"
                maxLength={9}
                {...register("hostContactPhone")}
                error={errors.hostContactPhone?.message}
                disabled={isPending}
              />
            </div>

            <div>
              <LokeateInput
                id="hostContactEmail"
                type="email"
                label="Correo de Contacto Operativo (Opcional)"
                placeholder="contacto@milocal.pe"
                {...register("hostContactEmail")}
                error={errors.hostContactEmail?.message}
                disabled={isPending}
              />
            </div>
          </div>

          <LokeateTextarea
            id="accessInstructions"
            label="Instrucciones de Acceso al Inmueble"
            rows={3}
            placeholder="Ej. Avisar en garita de control de la urbanización mostrando DNI; código de acceso peatonal 4421."
            {...register("accessInstructions")}
            error={errors.accessInstructions?.message}
            disabled={isPending}
          />

          <LokeateNotice type="privacy">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#24362d] flex-shrink-0" />
              <span>
                Conforme a la Ley N° 29733 de Protección de Datos Personales, este registro se almacena segregado en la tabla <code>establishment_locations_private</code> protegida por RLS.
              </span>
            </div>
          </LokeateNotice>
        </LokeateCardContent>

        <LokeateCardFooter className="flex items-center justify-end gap-3 pt-4 border-t border-[#e9ebe7]">
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
            Registrar Establecimiento (Borrador)
          </LokeateButton>
        </LokeateCardFooter>
      </LokeateCard>
    </form>
  );
}
