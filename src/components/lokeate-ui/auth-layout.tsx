import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "./brand-logo";

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <BrandLogo size="lg" />
        {subtitle && (
          <p className="text-xs text-[#7d817c] max-w-sm mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Auth Card Centered */}
      <div className="w-full max-w-md mx-auto my-6">{children}</div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#8a8e88] space-y-1">
        <p>© 2026 LOKEATE · Todos los derechos reservados.</p>
        <p className="text-[11px] text-slate-400">
          Los comprobantes y resúmenes emitidos son privados y no sustituyen comprobantes tributarios SUNAT.
        </p>
      </footer>
    </div>
  );
}
