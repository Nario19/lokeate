"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, User, Sparkles } from "lucide-react";
import type { UserProfile } from "../types/auth.types";

interface RoleSwitcherProps {
  profile: UserProfile;
  currentMode?: "CLIENT" | "HOST";
  onModeChange?: (newMode: "CLIENT" | "HOST") => void;
}

export function RoleSwitcher({
  profile,
  currentMode = "CLIENT",
  onModeChange,
}: RoleSwitcherProps) {
  const router = useRouter();
  const [activeMode, setActiveMode] = React.useState<"CLIENT" | "HOST">(currentMode);

  const handleToggle = (targetMode: "CLIENT" | "HOST") => {
    setActiveMode(targetMode);
    if (onModeChange) {
      onModeChange(targetMode);
    }

    if (targetMode === "HOST") {
      router.push("/dashboard/host");
    } else {
      router.push("/dashboard/client");
    }
  };

  // Si el usuario no ha sido habilitado como anfitrión
  if (!profile.is_host_active) {
    return (
      <div className="flex items-center gap-3 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span className="text-slate-700">
          ¿Tienes un local o espacio para eventos?
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto text-xs h-7 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          onClick={() => router.push("/host/onboarding")}
        >
          Publicar mi local
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => handleToggle("CLIENT")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          activeMode === "CLIENT"
            ? "bg-white text-indigo-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Modo Cliente
      </button>

      <button
        type="button"
        onClick={() => handleToggle("HOST")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          activeMode === "HOST"
            ? "bg-white text-indigo-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <Building2 className="w-3.5 h-3.5" />
        Modo Anfitrión
      </button>
    </div>
  );
}
