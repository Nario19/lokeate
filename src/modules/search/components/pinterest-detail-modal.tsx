"use client";

import * as React from "react";
import { X, Star, Users, Check, Heart, ShieldCheck, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { SAMPLE_PICS } from "../data/sample-venues";
import type { PinterestVenue } from "../types/venue-pinterest.types";

interface PinterestDetailModalProps {
  venue: PinterestVenue | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number | string) => void;
  initialDate: string;
  initialGuests: number | "";
  onBookingSuccess: (bookingId: string) => void;
}

export function PinterestDetailModal({
  venue,
  onClose,
  isFavorite,
  onToggleFavorite,
  initialDate,
  initialGuests,
  onBookingSuccess,
}: PinterestDetailModalProps) {
  const [eventDate, setEventDate] = React.useState(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [guestsCount, setGuestsCount] = React.useState<number>(
    initialGuests ? Number(initialGuests) : (venue?.capacity ? Math.min(50, venue.capacity) : 50)
  );
  const [eventType, setEventType] = React.useState("Boda o Celebración");
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Cerrar con Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!venue) return null;

  const sidePic1 = SAMPLE_PICS[(Number(venue.id) + 2) % SAMPLE_PICS.length];
  const sidePic2 = SAMPLE_PICS[(Number(venue.id) + 5) % SAMPLE_PICS.length];

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!contactName.trim()) {
      setErrorMsg("Ingresa tu nombre para la solicitud de reserva.");
      return;
    }
    if (!eventDate) {
      setErrorMsg("Selecciona la fecha del evento.");
      return;
    }
    if (!guestsCount || guestsCount < 1) {
      setErrorMsg("Ingresa una cantidad de invitados válida.");
      return;
    }
    if (guestsCount > venue.capacity) {
      setErrorMsg(`El aforo máximo de este espacio es de ${venue.capacity} personas.`);
      return;
    }

    setIsSubmitting(true);

    const bookingRef = `LOK-${Date.now().toString().slice(-6)}`;

    // Guardar simulación de reserva en localStorage para persistencia en demo
    try {
      const existing = JSON.parse(localStorage.getItem("lokeate_bookings") || "[]");
      existing.push({
        id: bookingRef,
        venueId: venue.id,
        venueName: venue.name,
        date: eventDate,
        guests: guestsCount,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        eventType,
        price: venue.price,
        status: "SOLICITADA",
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("lokeate_bookings", JSON.stringify(existing));
    } catch {
      // Ignorar fallback de localStorage si storage bloqueado
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onBookingSuccess(bookingRef);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e9ebe7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-xl text-[#20231f]">
              {venue.name}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {venue.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6">
          {/* Galería Fotográfica Resaltante (3 Fotos) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 h-[340px] rounded-2xl overflow-hidden bg-slate-100">
            {/* Foto Principal Hero (Ocupa 2 columnas en desktop) */}
            <div className="md:col-span-2 relative h-full group overflow-hidden">
              <img
                src={venue.image}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {venue.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-[#20231f] text-xs font-black shadow-sm">
                  {venue.badge}
                </span>
              )}
            </div>

            {/* Fotos Laterales Apiladas */}
            <div className="hidden md:grid grid-rows-2 gap-2.5 h-full">
              <div className="relative overflow-hidden group">
                <img
                  src={sidePic1}
                  alt="Ambiente del espacio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative overflow-hidden group">
                <img
                  src={sidePic2}
                  alt="Instalaciones del espacio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* Información Detallada y Panel de Reserva */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna Izquierda: Información del Espacio */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm font-extrabold text-[#20231f]">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {venue.rating.toFixed(2)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-sm font-semibold text-[#7d817c]">
                    {venue.location}
                  </span>
                </div>

                <p className="text-sm text-[#626860] leading-relaxed mt-3">
                  {venue.description}
                </p>
              </div>

              {/* Anfitrión Verificado */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f6f7f4] border border-[#e9ebe7]">
                <div className="w-10 h-10 rounded-full bg-[#24362d] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#20231f]">
                    {venue.host}
                  </h4>
                  <p className="text-[11px] text-[#7d817c]">
                    Identidad con DNI/RUC verificado y legitimidad del espacio inspeccionada.
                  </p>
                </div>
              </div>

              {/* Aforos y Características */}
              <div>
                <h4 className="font-heading font-extrabold text-sm text-[#20231f] mb-2.5">
                  Lo que ofrece este espacio
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-800">
                    <Users className="w-4 h-4 text-[#e35b44]" />
                    <span>Hasta {venue.capacity} invitados</span>
                  </div>
                  {venue.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota de Transparencia RealPrice */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Compromiso de Transparencia RealPrice</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  LOKEATE no cobra costos ocultos ni comisiones bancarias adicionales en la fase Beta. Los pagos se declaran directamente entre las partes vía transferencias peruanas (BCP, BBVA, Interbank, Yape o Plin).
                </p>
              </div>

              {/* Botón de Favorito */}
              <div>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(venue.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                    isFavorite
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-white border-[#e9ebe7] text-[#20231f] hover:bg-slate-50"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-600 text-rose-600" : ""}`} />
                  <span>{isFavorite ? "Guardado en tus favoritos" : "Guardar en favoritos"}</span>
                </button>
              </div>
            </div>

            {/* Columna Derecha: Panel de Cotización y Solicitud */}
            <div className="lg:col-span-5">
              <div className="border border-[#e6e8e3] rounded-3xl p-5 shadow-[0_5px_22px_rgba(26,28,23,0.06)] bg-white space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-extrabold text-2xl text-[#20231f]">
                      S/ {venue.price.toLocaleString("es-PE")}
                    </span>
                    <span className="text-xs text-[#7d817c]">/ desde por evento</span>
                  </div>
                  <p className="text-[11px] text-[#7d817c] mt-0.5">
                    Tarifa de referencia verificada con el anfitrión
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitBooking} className="space-y-3">
                  {/* Fecha */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1">
                      Fecha del Evento
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-slate-800 bg-white focus:outline-none focus:border-[#e35b44]"
                    />
                  </div>

                  {/* Invitados y Tipo de Evento en 2 columnas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1">
                        Invitados
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={venue.capacity}
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-slate-800 bg-white focus:outline-none focus:border-[#e35b44]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1">
                        Tipo
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-slate-800 bg-white focus:outline-none focus:border-[#e35b44]"
                      >
                        <option>Boda o Ceremonia</option>
                        <option>Cumpleaños / 15 años</option>
                        <option>Evento Corporativo</option>
                        <option>Reunión Familiar</option>
                        <option>Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Nombre y Teléfono de Contacto */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1">
                      Tu Nombre de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Roberto Mendoza"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-slate-800 bg-white focus:outline-none focus:border-[#e35b44]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1">
                      Teléfono Móvil (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 987 654 321"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-slate-800 bg-white focus:outline-none focus:border-[#e35b44]"
                    />
                  </div>

                  {/* Desglose de Referencia */}
                  <div className="pt-2 border-t border-[#e9ebe7] space-y-1 text-xs">
                    <div className="flex justify-between text-[#7d817c]">
                      <span>Tarifa referencial</span>
                      <span>S/ {venue.price.toLocaleString("es-PE")}</span>
                    </div>
                    <div className="flex justify-between text-[#7d817c]">
                      <span>Comisión de plataforma Beta</span>
                      <span className="text-emerald-700 font-bold">S/ 0.00 (Gratis)</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-[#20231f] pt-1 border-t border-slate-100">
                      <span>Total estimado</span>
                      <span>S/ {venue.price.toLocaleString("es-PE")}</span>
                    </div>
                  </div>

                  {/* Botón Solicitar Disponibilidad */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#e35b44] hover:bg-[#cf4832] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Enviando solicitud..." : "Solicitar disponibilidad"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-center text-[#7d817c] leading-tight">
                    No pagarás nada ahora. El anfitrión dispone de una ventana de 24 horas para revisar tu solicitud.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
