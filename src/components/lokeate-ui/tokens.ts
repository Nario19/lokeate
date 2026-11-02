/**
 * TOKENS DE DISEÑO DE LOKEATE
 * Inspirados en el prototipo visual editorial / Pinterest (lokeate_mvp_pinterest.html).
 */

export const LOKEATE_COLORS = {
  accent: "#e35b44",        // Terracota / Coral vibrante de acción
  accentHover: "#cf4832",   // Terracota oscuro hover
  forest: "#24362d",        // Verde bosque oscuro para contraste y píldoras activas
  forestHover: "#1a2922",   // Verde bosque hover
  ink: "#20231f",           // Texto principal carbón profundo
  muted: "#7d817c",         // Texto secundario neutral
  line: "#e9ebe7",          // Borde sutil cálido
  soft: "#f6f7f4",          // Fondo de superficies secundarias
  bg: "#ffffff",            // Fondo blanco puro
} as const;

export const LOKEATE_CLASSES = {
  card: "bg-white rounded-3xl border border-[#e9ebe7] shadow-[0_5px_22px_rgba(26,28,23,0.06)]",
  input: "w-full px-3.5 py-2.5 rounded-xl border border-[#e1e4df] text-xs text-[#20231f] bg-white focus:outline-none focus:border-[#e35b44] focus:ring-2 focus:ring-[#e35b44]/20 transition-all placeholder:text-slate-400",
  label: "block text-[11px] font-extrabold uppercase tracking-wider text-[#20231f] mb-1.5",
  btnPrimary: "inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#e35b44] hover:bg-[#cf4832] text-white font-extrabold text-xs shadow-sm transition-all active:scale-[0.98] disabled:opacity-50",
  btnDark: "inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#24362d] hover:bg-[#1a2922] text-white font-bold text-xs transition-colors active:scale-[0.98]",
  btnOutline: "inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-white hover:bg-[#f6f6f3] text-[#20231f] border border-[#e9ebe7] font-bold text-xs transition-colors shadow-sm",
  badgePill: "px-3 py-1 rounded-full text-[10px] font-black tracking-wide",
} as const;
