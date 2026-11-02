import * as React from "react";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  showBetaBadge?: boolean;
  className?: string;
}

export function BrandLogo({
  size = "md",
  href = "/",
  showBetaBadge = true,
  className = "",
}: BrandLogoProps) {
  const markSize =
    size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  const textSize =
    size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";

  const content = (
    <div className={`inline-flex items-center gap-2 group select-none ${className}`}>
      <div
        className={`${markSize} rounded-xl bg-[#e35b44] text-white flex items-center justify-center font-black shadow-sm -rotate-6 group-hover:rotate-0 transition-transform`}
      >
        <span className="rotate-6 group-hover:rotate-0 transition-transform">⌂</span>
      </div>
      <span
        className={`font-heading font-extrabold ${textSize} tracking-tighter text-[#20231f]`}
      >
        LOKEATE<span className="text-[#e35b44]">.</span>
      </span>
      {showBetaBadge && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          BETA
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
