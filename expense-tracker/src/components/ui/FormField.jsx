import React from "react";

/**
 * FormField Component
 * @param {string} label - Input label
 * @param {string} description - Optional help text
 * @param {string} error - Error message
 * @param {boolean} required - Show required indicator
 * @param {boolean} isDark - Theme state
 * @param {React.ReactNode} children - The input/select element
 */
export default function FormField({ label, description, error, required, isDark, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-400">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          
          return React.cloneElement(child, {
            className: `${child.props.className || ""} w-full rounded-2xl border px-4 py-4 text-base font-semibold outline-none transition-all ${
              isDark 
                ? "border-white/10 bg-slate-950 text-white placeholder-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10" 
                : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            } ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10" : ""}`
          });
        })}
      </div>

      {description && !error && <p className="text-xs text-slate-400">{description}</p>}
      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}
