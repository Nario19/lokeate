import * as React from "react";
import { Loader2 } from "lucide-react";

export interface LokeateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "dark" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const LokeateButton = React.forwardRef<HTMLButtonElement, LokeateButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    let variantClasses = "";
    switch (variant) {
      case "primary":
        variantClasses =
          "bg-[#e35b44] hover:bg-[#cf4832] text-white font-extrabold shadow-sm active:scale-[0.98]";
        break;
      case "dark":
        variantClasses =
          "bg-[#24362d] hover:bg-[#1a2922] text-white font-bold active:scale-[0.98]";
        break;
      case "outline":
        variantClasses =
          "bg-white hover:bg-[#f6f6f3] text-[#20231f] border border-[#e9ebe7] font-bold shadow-sm";
        break;
      case "ghost":
        variantClasses = "bg-transparent hover:bg-slate-100 text-[#20231f] font-bold";
        break;
      case "danger":
        variantClasses = "bg-rose-600 hover:bg-rose-700 text-white font-bold";
        break;
    }

    let sizeClasses = "";
    switch (size) {
      case "sm":
        sizeClasses = "py-1.5 px-3 text-xs rounded-full";
        break;
      case "md":
        sizeClasses = "py-2.5 px-5 text-xs rounded-xl";
        break;
      case "lg":
        sizeClasses = "py-3.5 px-6 text-sm rounded-xl";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

LokeateButton.displayName = "LokeateButton";
