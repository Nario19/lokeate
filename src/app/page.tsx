import Link from "next/link";
import { Search, ShieldCheck, CalendarCheck, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header de Navegación */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary">LOKEATE</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">BETA</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/explorar"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorar Espacios
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-muted/50 to-background text-center">
          <div className="container mx-auto max-w-4xl space-y-6">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
              Encuentra el local ideal para tu próximo evento en Perú
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Quintas campestres en Cieneguilla y Pachacamac, terrazas en Miraflores y salones acondicionados con transparencia total en precios (RealPrice).
            </p>

            {/* Widget de Búsqueda Rápida */}
            <div className="mt-8 p-3 rounded-2xl bg-card border shadow-lg max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Distrito o zona...</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background">
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fecha del evento</span>
              </div>
              <Link
                href="/explorar"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Pilares de Valor */}
        <section className="py-16 px-4 sm:px-6 container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border bg-card space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                S/
              </div>
              <h3 className="text-xl font-bold">RealPrice Transparente</h3>
              <p className="text-muted-foreground text-sm">
                Conoce el desglose exacto antes de reservar: costo base, horas extra, servicios, garantía y comisiones sin cobros sorpresa.
              </p>
            </div>
            <div className="p-6 rounded-2xl border bg-card space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Sin Doble Reserva</h3>
              <p className="text-muted-foreground text-sm">
                Control de concurrencia atómica a nivel de base de datos PostgreSQL. El bloqueo de un local inhabilita automáticamente todos sus subespacios.
              </p>
            </div>
            <div className="p-6 rounded-2xl border bg-card space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Actas y Seguridad</h3>
              <p className="text-muted-foreground text-sm">
                Actas digitales de entrega y devolución con fotos e inventario firmado para proteger a anfitriones y organizadores.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 bg-muted/30">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 LOKEATE. Todos los derechos reservados. Lima, Perú.</p>
          <p>Los resúmenes y contratos emitidos son de carácter privado y no sustituyen comprobantes tributarios SUNAT.</p>
        </div>
      </footer>
    </div>
  );
}
