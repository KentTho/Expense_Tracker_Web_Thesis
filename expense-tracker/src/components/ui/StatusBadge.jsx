import React from "react";

/**
 * StatusBadge Component
 * @param {string} tone - success | warning | danger | info | neutral
 * @param {React.ReactNode} icon - Optional icon
 * @param {boolean} isDark - Theme state
 * @param {React.ReactNode} children - Badge text
 */
export default function StatusBadge({ tone = "neutral", icon: Icon, isDark, children }) {
  const tones = {
    success: {
      light: "bg-emerald-50 text-emerald-600 border-emerald-100",
      dark: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    },
    warning: {
      light: "bg-orange-50 text-orange-600 border-orange-100",
      dark: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    },
    danger: {
      light: "bg-rose-50 text-rose-600 border-rose-100",
      dark: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    },
    info: {
      light: "bg-cyan-50 text-cyan-600 border-cyan-100",
      dark: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    },
    neutral: {
      light: "bg-slate-50 text-slate-600 border-slate-100",
      dark: "bg-white/5 text-slate-400 border-white/10",
    },
  };

  const style = isDark ? tones[tone].dark : tones[tone].light;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${style}`}>
      {Icon && (React.isValidElement(Icon) ? Icon : <Icon size={12} />)}
      {children}
    </span>
  );
}
