import * as React from "react";
import { ShieldCheck, AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";

interface LokeateNoticeProps {
  type?: "info" | "success" | "error" | "privacy" | "realprice";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function LokeateNotice({
  type = "info",
  title,
  children,
  className = "",
}: LokeateNoticeProps) {
  let styleClasses = "bg-[#f6f7f4] border-[#e9ebe7] text-[#626860]";
  let Icon = Info;
  let iconColor = "text-[#7d817c]";

  switch (type) {
    case "success":
      styleClasses = "bg-emerald-50/80 border-emerald-200 text-emerald-900";
      Icon = CheckCircle2;
      iconColor = "text-emerald-600";
      break;
    case "error":
      styleClasses = "bg-rose-50/80 border-rose-200 text-rose-900";
      Icon = AlertCircle;
      iconColor = "text-rose-600";
      break;
    case "privacy":
      styleClasses = "bg-slate-50 border-slate-200 text-slate-700";
      Icon = ShieldCheck;
      iconColor = "text-emerald-600";
      break;
    case "realprice":
      styleClasses = "bg-amber-50/70 border-amber-200 text-amber-900";
      Icon = Sparkles;
      iconColor = "text-amber-600";
      break;
  }

  return (
    <div
      className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${styleClasses} ${className}`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="space-y-0.5">
        {title && <h5 className="font-extrabold text-[#20231f]">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}
