import { formatLongDate } from "../../utils/formatters";

export default function OverviewHeader({ isDark, title = "Dashboard", subtitle, dateValue }) {
  const now = dateValue ? new Date(dateValue) : new Date();

  return (
    <div className="space-y-4">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] ${
          isDark
            ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            : "border-cyan-400/20 bg-cyan-400/10 text-cyan-700"
        }`}
      >
        {/* small tag for hierarchy; keep text-only to avoid extra icon deps here */}
        Overview
      </div>

      <div>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        {subtitle ? (
          <p className={`mt-4 max-w-2xl text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
        ) : null}

        <p className={`mt-3 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {formatLongDate(now)}
        </p>
      </div>
    </div>
  );
}
