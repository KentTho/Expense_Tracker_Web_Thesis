import React from "react";

/**
 * SectionCard Component
 * @param {string} title - Section title
 * @param {string} description - Optional description below title
 * @param {React.ReactNode} icon - Optional icon
 * @param {React.ReactNode} actions - Optional actions (buttons) in header
 * @param {React.ReactNode} children - Main content
 * @param {boolean} isDark - Theme state
 * @param {string} className - Additional classes for customization
 */
export default function SectionCard({ title, description, icon: Icon, actions, children, isDark, className = "" }) {
  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-xl transition-all ${
        isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
      } ${className}`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`rounded-xl p-2.5 ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
              {React.isValidElement(Icon) ? Icon : <Icon size={20} />}
            </div>
          )}
          <div>
            <h3 className="text-xl font-black">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="relative">{children}</div>
    </section>
  );
}
