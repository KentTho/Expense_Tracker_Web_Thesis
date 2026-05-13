import React from "react";

/**
 * PageHeader Component
 * @param {string} title - Main title of the page
 * @param {string} subtitle - Descriptive text below title
 * @param {React.ReactNode} icon - Icon element
 * @param {React.ReactNode} actions - Optional buttons or controls on the right
 * @param {boolean} isDark - Theme state
 * @param {string} eyebrow - Optional small text above title
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions, isDark, eyebrow }) {
  return (
    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1">
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`rounded-2xl p-3 ${isDark ? "bg-cyan-400/15 text-cyan-300" : "bg-cyan-100 text-cyan-600"}`}>
              {React.isValidElement(Icon) ? Icon : <Icon size={28} />}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-2 text-base text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </div>

      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
