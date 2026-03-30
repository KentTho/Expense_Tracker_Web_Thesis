import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BarChart3,
  CalendarRange,
  Filter,
  Layers3,
  Loader2,
  Radar,
  ReceiptText,
  SearchX,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalyticsSummary } from "../../services/analyticsService";
import { getCategories } from "../../services/categoryService";
import { formatCompactCurrency, formatCurrency, formatLongDate, formatShortDate } from "../../utils/formatters";

const DISTRIBUTION_COLORS = ["#22d3ee", "#fb923c", "#34d399", "#f472b6", "#a78bfa", "#facc15", "#38bdf8"];

function InsightCard({ label, value, helper, tone }) {
  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-xl ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-black tracking-tight">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

export default function Analytics() {
  const { theme, currencyCode } = useOutletContext();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    type: "all",
    categoryId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      const results = await Promise.allSettled([getCategories("income"), getCategories("expense")]);
      if (!mounted) {
        return;
      }

      const merged = results.flatMap((result) => (result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []));
      const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      setCategories(unique.sort((left, right) => left.name.localeCompare(right.name)));
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);

      try {
        const data = await getAnalyticsSummary(filters);
        if (mounted) {
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
        if (mounted) {
          setAnalytics(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const distributionData = useMemo(() => {
    return Array.isArray(analytics?.category_distribution)
      ? analytics.category_distribution.map((item) => ({
          ...item,
          total_amount: Number(item.total_amount || 0),
        }))
      : [];
  }, [analytics]);

  const transactionRows = useMemo(() => {
    return Array.isArray(analytics?.transactions) ? analytics.transactions : [];
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className={`rounded-[2rem] border px-8 py-10 text-center ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Reading analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-[2.25rem] border p-6 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              <Radar size={14} />
              Backend analytics
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Insight deck</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-400">
              This screen is now driven by the BE analytics summary endpoint, so filters, charts, and detail rows stay synchronized with the server contract.
            </p>
          </div>

          <div className={`grid gap-3 rounded-[1.75rem] border p-4 sm:grid-cols-2 xl:min-w-[30rem] ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
            <label className="text-sm font-semibold">
              <span className="mb-2 flex items-center gap-2 text-slate-400">
                <Filter size={14} />
                Type
              </span>
              <select
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-950/70 text-white" : "border-slate-200 bg-white text-slate-900"}`}
              >
                <option value="all">All transactions</option>
                <option value="income">Income only</option>
                <option value="expense">Expense only</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              <span className="mb-2 flex items-center gap-2 text-slate-400">
                <Layers3 size={14} />
                Category
              </span>
              <select
                value={filters.categoryId}
                onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-950/70 text-white" : "border-slate-200 bg-white text-slate-900"}`}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              <span className="mb-2 flex items-center gap-2 text-slate-400">
                <CalendarRange size={14} />
                Start date
              </span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-950/70 text-white" : "border-slate-200 bg-white text-slate-900"}`}
              />
            </label>

            <label className="text-sm font-semibold">
              <span className="mb-2 flex items-center gap-2 text-slate-400">
                <CalendarRange size={14} />
                End date
              </span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
                className={`w-full rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-950/70 text-white" : "border-slate-200 bg-white text-slate-900"}`}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Income"
          value={formatCurrency(analytics?.total_income, currencyCode)}
          helper="Server total income after filters."
          tone={isDark ? "border-emerald-400/15 bg-emerald-400/10" : "border-emerald-100 bg-emerald-50"}
        />
        <InsightCard
          label="Expense"
          value={formatCurrency(analytics?.total_expense, currencyCode)}
          helper="Server total expense after filters."
          tone={isDark ? "border-orange-300/15 bg-orange-300/10" : "border-orange-100 bg-orange-50"}
        />
        <InsightCard
          label="Balance"
          value={formatCurrency(analytics?.total_balance, currencyCode)}
          helper="Net result across the selected window."
          tone={isDark ? "border-cyan-400/15 bg-cyan-400/10" : "border-cyan-100 bg-cyan-50"}
        />
        <InsightCard
          label="Daily spend"
          value={formatCurrency(analytics?.average_daily_spending, currencyCode)}
          helper={analytics?.most_expensive_day ? `Most expensive day: ${formatLongDate(analytics.most_expensive_day)}` : "Most expensive day will appear here."}
          tone={isDark ? "border-violet-400/15 bg-violet-400/10" : "border-violet-100 bg-violet-50"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Category distribution</p>
              <h2 className="mt-2 text-2xl font-black">Where the money moved</h2>
            </div>
            <Sparkles className="text-cyan-400" size={18} />
          </div>

          <div className="h-[340px]">
            {distributionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#243041" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey="category_name" tickLine={false} axisLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={54}
                    tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => formatCompactCurrency(value, currencyCode)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                    formatter={(value, _name, entry) => [
                      formatCurrency(value, currencyCode),
                      entry.payload.type === "income" ? "Income" : "Expense",
                    ]}
                  />
                  <Bar dataKey="total_amount" radius={[12, 12, 0, 0]}>
                    {distributionData.map((item, index) => (
                      <Cell
                        key={`${item.category_name}-${item.type}`}
                        fill={item.type === "income" ? "#22d3ee" : DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-slate-400">
                <div>
                  <BarChart3 size={28} className="mx-auto text-cyan-400" />
                  <p className="mt-3 text-sm">No category data matched your filters.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Highlights</p>
            <h2 className="mt-2 text-2xl font-black">What stands out</h2>
          </div>

          <div className="space-y-3">
            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Income position</p>
                  <p className="text-xs text-slate-400">Filtered total currently sits at {formatCurrency(analytics?.total_income, currencyCode)}.</p>
                </div>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-300/15 p-3 text-orange-200">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Expense gravity</p>
                  <p className="text-xs text-slate-400">Average daily spending is {formatCurrency(analytics?.average_daily_spending, currencyCode)}.</p>
                </div>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                  <CalendarRange size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Peak day</p>
                  <p className="text-xs text-slate-400">
                    {analytics?.most_expensive_day ? formatLongDate(analytics.most_expensive_day) : "No peak day available for this filter range."}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-400/15 p-3 text-violet-300">
                  <Layers3 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">Categories in play</p>
                  <p className="text-xs text-slate-400">{distributionData.length || 0} categories matched the current query.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Transaction detail</p>
            <h2 className="mt-2 text-2xl font-black">Server detail rows</h2>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            <ReceiptText size={14} />
            {transactionRows.length} rows
          </div>
        </div>

        <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left">
            <thead className={isDark ? "bg-slate-950/70 text-slate-400" : "bg-slate-100 text-slate-500"}>
              <tr>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Date</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Category</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Type</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Note</th>
                <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-[0.25em]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactionRows.length ? (
                transactionRows.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className={`border-t ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}>
                    <td className="px-4 py-4 text-sm font-medium">{formatShortDate(transaction.date)}</td>
                    <td className="px-4 py-4 text-sm font-semibold">
                      <span className="mr-2">{transaction.emoji || (transaction.type === "income" ? "💰" : "💸")}</span>
                      {transaction.category_name || "Uncategorized"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${transaction.type === "income" ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-300/15 text-orange-200"}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">{transaction.note || "No note"}</td>
                    <td className={`px-4 py-4 text-right text-sm font-black ${transaction.type === "income" ? "text-emerald-300" : "text-orange-200"}`}>
                      {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount, transaction.currency_code || currencyCode)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                    <SearchX size={28} className="mx-auto text-cyan-400" />
                    <p className="mt-4 text-sm">No transactions matched the current filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
