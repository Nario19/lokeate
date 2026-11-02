import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOKEATE — Encuentra tu lugar | Marketplace de Locales en Perú",
  description: "Alquila locales, quintas, salones, terrazas y haciendas para eventos en el Perú con RealPrice y sin costos ocultos.",
  keywords: ["alquiler de locales", "eventos lima", "quintas cieneguilla", "haciendas pachacamac", "matrimonios", "fiestas infantiles"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased flex flex-col font-sans bg-white text-[#20231f]">
        {children}
      </body>
    </html>
  );
}
