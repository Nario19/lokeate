import * as React from "react";
import { PinterestMarketplace } from "@/modules/search/components/pinterest-marketplace";

export const metadata = {
  title: "LOKEATE — Encuentra tu lugar | Espacios para Eventos en Perú",
  description:
    "Marketplace de locales, quintas en Pachacámac y Cieneguilla, terrazas en Miraflores y salones para eventos con RealPrice Transparente.",
};

export default function HomePage() {
  return <PinterestMarketplace />;
}
