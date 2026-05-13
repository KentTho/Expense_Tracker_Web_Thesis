import { useMemo } from "react";
import { formatCompactCurrency, formatCurrency } from "../../utils/formatters";
import { Target } from "lucide-react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function BudgetCard({
  isDark,
  currencyCode,
  budgetLimit = 0,
  spentThisMonth = 0,
  remainingBudget = 0,
  showTitle = true,
}) {
  const budget = Number(budgetLimit) || 0;
  const spent = Number(spentThisMonth) || 0;
  const remaining = Number(remainingBudget) || 0;

  const isOverBudget = remaining < 0;

  const visualProgress = useMemo(() => {
    if (budget <= 0) return 0;
    const pct = (spent / budget) * 100;
    return clamp(pct, 0, 100);
  }, [budget, spent]);

  const progressColor = useMemo(() => {
    if (budget <= 0) return isDark ? "bg-cyan-400" : "bg-cyan-400";
    if (isOverBudget) return "bg-rose-400";
    if (visualProgress >= 80) return "bg-orange-300";
    return "bg-cyan-400";
  }, [budget, isDark, isOverBudget, visualProgress]);

  const statusBadge = useMemo(() => {
    if (!budget || budget <= 0) return { text: "Budget not set", cls: "bg-slate-100 text-slate-600" };
    if (isOverBudget) return { text: "Over budget", cls: "bg-rose-400/15 text-rose-300" };
    if (visualProgress >= 80) return { text: "Near limit", cls: "bg-orange-300/15 text-orange-300" };
    return { text: "On track", cls: "bg-emerald-400/15 text-emerald-300" };
  }, [budget, isOverBudget, visualProgress]);

  return (
    <div className={`rounded-[2rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
            {showTitle ? "Monthly budget" : "Budget"}
          </p>
          <p className="mt-2 text-2xl font-black">
            {budget > 0 ? formatCurrency(budget, currencyCode) : "Not set"}
          </p>
          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {budget > 0
              ? `Remaining: ${formatCompactCurrency(remaining, currencyCode)}`
              : "Set a monthly limit in Profile settings."}
          </p>
        </div>

        <div
          className={`rounded-2xl px-4 py-2 text-sm font-bold ${
            isDark ? statusBadge.cls.replace("bg-rose", "bg-rose").replace("text-rose", "text-rose") : statusBadge.cls
          }`}
        >
          {statusBadge.text}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">This month spent</span>
            <span className="font-semibold">{budget > 0 ? formatCompactCurrency(spent, currencyCode) : "—"}</span>
          </div>

          <div className={`mt-3 h-3 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
            <div
              className={`h-full rounded-full ${progressColor}`}
              style={{ width: `${visualProgress || 0}%` }}
            />
          </div>

          {budget > 0 ? (
            <div className={`mt-3 text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {isOverBudget ? "You’ve exceeded your monthly limit." : "Spending is within your monthly plan."}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Budget limit</p>
            <p className="mt-2 text-lg font-black">{budget > 0 ? formatCompactCurrency(budget, currencyCode) : "Not set"}</p>
          </div>

          <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Remaining</p>
            <p className={`mt-2 text-lg font-black ${isOverBudget ? "text-rose-300" : isDark ? "text-slate-100" : "text-slate-900"}`}>
              {budget > 0 ? formatCompactCurrency(remaining, currencyCode) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* hidden icon affordance (kept minimal, no extra props) */}
      <Target className="sr-only" />
    </div>
  );
}
