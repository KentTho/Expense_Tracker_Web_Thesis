import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  CircleDollarSign,
  Compass,
  CreditCard,
  Flame,
  Layers3,
  Loader2,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getFinancialKpiSummary } from "../../services/incomeService";
import { getExpenseBreakdown, getExpenseDailyTrend } from "../../services/expenseService";
import { getRecentTransactions } from "../../services/transactionService";
import { fetchSystemSettings } from "../../services/adminService";
import { getUserProfile } from "../../services/profileService";
import {
  formatCompactCurrency,
  formatCurrency,
  formatLongDate,
  formatShortDate,
} from "../../utils/formatters";

const CHART_COLORS = ["#22d3ee", "#fb923c", "#34d399", "#f472b6", "#a78bfa", "#facc15"];

function MetricCard({ title, value, tone, icon: Icon, subtitle }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-5 shadow-xl ${tone.panel}`}>
      <div className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
        <Icon size={20} className={tone.icon} />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{title}</p>
      <h3 className="mt-4 text-3xl font-black tracking-tight">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function HomeUnified() {
  const { theme, currencyCode, currentUser } = useOutletContext();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0 });
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [systemSettings, setSystemSettings] = useState({ broadcast_message: "" });

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const results = await Promise.allSettled([
        getFinancialKpiSummary(),
        getExpenseBreakdown(),
        getExpenseDailyTrend(30),
        getRecentTransactions(7),
        fetchSystemSettings(),
        getUserProfile(),
      ]);

      if (!mounted) {
        return;
      }

      const [kpis, expenseBreakdown, expenseTrend, recent, settings, userProfile] = results;

      setSummary(kpis.status === "fulfilled" ? kpis.value : { total_income: 0, total_expense: 0 });
      setBreakdown(
        expenseBreakdown.status === "fulfilled" && Array.isArray(expenseBreakdown.value)
          ? expenseBreakdown.value
          : []
      );
      setTrend(
        expenseTrend.status === "fulfilled" && Array.isArray(expenseTrend.value) ? expenseTrend.value : []
      );
      setRecentTransactions(recent.status === "fulfilled" && Array.isArray(recent.value) ? recent.value : []);
      setSystemSettings(
        settings.status === "fulfilled" && settings.value ? settings.value : { broadcast_message: "" }
      );
      setProfile(userProfile.status === "fulfilled" ? userProfile.value : null);
      setLoading(false);
    }

    loadDashboard();
    const handleRefresh = () => loadDashboard();
    window.addEventListener("transactionUpdated", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("transactionUpdated", handleRefresh);
    };
  }, []);

  const currentProfile = profile || currentUser;
  const budget = Number(currentProfile?.monthly_budget || 0);
  const totalIncome = Number(summary?.total_income || 0);
  const totalExpense = Number(summary?.total_expense || 0);
  const balance = totalIncome - totalExpense;
  const budgetUsage = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;

  const chartData = useMemo(
    () =>
      trend.map((item) => ({
        date: formatShortDate(item.date),
        rawDate: item.date,
        total_amount: Number(item.total_amount || 0),
      })),
    [trend]
  );

  const distributionData = useMemo(
    () =>
      breakdown
        .map((item) => ({
          name: item.category_name,
          value: Number(item.total_amount || 0),
        }))
        .filter((item) => item.value > 0)
        .slice(0, 6),
    [breakdown]
  );

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div
          className={`rounded-[2rem] border px-8 py-10 text-center ${
            isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
          }`}
        >
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Building your board
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className={`overflow-hidden rounded-[2.25rem] border p-6 shadow-2xl ${
          isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
        }`}
      >
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              <Compass size={14} />
              Finance cockpit
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              {currentProfile?.name ? `Welcome back, ${currentProfile.name.split(" ")[0]}.` : "Welcome back."}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-400">
              This dashboard now reads directly from backend summaries, transaction feeds, security settings, and
              system announcements so FE and BE stay in one rhythm.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/income"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:translate-y-[-1px]"
              >
                <Plus size={16} />
                Add income
              </Link>
              <Link
                to="/expense"
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-300/30 bg-orange-300/10 px-5 py-3 text-sm font-bold text-orange-200 transition hover:translate-y-[-1px]"
              >
                <Plus size={16} />
                Add expense
              </Link>
              <Link
                to="/analytics"
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:translate-y-[-1px] ${
                  isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                <Layers3 size={16} />
                Open analytics
              </Link>
            </div>
          </div>

          <div className={`rounded-[2rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Mission status</p>
                <p className="mt-2 text-2xl font-black">{formatCurrency(balance, currencyCode)}</p>
              </div>
              <div
                className={`rounded-2xl px-4 py-2 text-sm font-bold ${
                  balance >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                }`}
              >
                {balance >= 0 ? "Above water" : "Needs attention"}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Monthly budget</span>
                  <span className="font-semibold">
                    {budget > 0 ? formatCurrency(budget, currencyCode) : "Not set"}
                  </span>
                </div>
                <div className={`mt-3 h-3 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div
                    className={`h-full rounded-full ${
                      budgetUsage >= 100 ? "bg-rose-400" : budgetUsage >= 80 ? "bg-orange-300" : "bg-cyan-400"
                    }`}
                    style={{ width: `${budgetUsage || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">This month spent</p>
                  <p className="mt-2 text-lg font-black">{formatCompactCurrency(totalExpense, currencyCode)}</p>
                </div>
                <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Most active date</p>
                  <p className="mt-2 text-lg font-black">
                    {chartData.length ? formatLongDate(chartData[chartData.length - 1].rawDate) : "No data"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {systemSettings?.broadcast_message && (
          <div
            className={`mt-6 flex items-center gap-3 rounded-[1.5rem] border px-4 py-4 ${
              isDark ? "border-orange-300/20 bg-orange-300/10 text-orange-100" : "border-orange-200 bg-orange-50 text-orange-700"
            }`}
          >
            <BellRing size={18} />
            <p className="text-sm font-medium">{systemSettings.broadcast_message}</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Income"
          value={formatCurrency(totalIncome, currencyCode)}
          subtitle="Money flowing into your account base."
          icon={ArrowUpRight}
          tone={{
            panel: isDark ? "border-emerald-400/15 bg-emerald-400/10" : "border-emerald-100 bg-emerald-50",
            iconWrap: isDark ? "bg-emerald-300 text-slate-950" : "bg-emerald-500 text-white",
            icon: "",
          }}
        />
        <MetricCard
          title="Expense"
          value={formatCurrency(totalExpense, currencyCode)}
          subtitle="Backend-synced spending across categories."
          icon={ArrowDownRight}
          tone={{
            panel: isDark ? "border-orange-300/15 bg-orange-300/10" : "border-orange-100 bg-orange-50",
            iconWrap: isDark ? "bg-orange-300 text-slate-950" : "bg-orange-400 text-white",
            icon: "",
          }}
        />
        <MetricCard
          title="Balance"
          value={formatCurrency(balance, currencyCode)}
          subtitle="Your live financial posture after sync."
          icon={CircleDollarSign}
          tone={{
            panel: isDark ? "border-cyan-400/15 bg-cyan-400/10" : "border-cyan-100 bg-cyan-50",
            iconWrap: isDark ? "bg-cyan-300 text-slate-950" : "bg-cyan-500 text-white",
            icon: "",
          }}
        />
        <MetricCard
          title="Budget"
          value={budget > 0 ? formatCurrency(budget, currencyCode) : "Not set"}
          subtitle="Use profile settings to define a monthly limit."
          icon={Target}
          tone={{
            panel: isDark ? "border-violet-400/15 bg-violet-400/10" : "border-violet-100 bg-violet-50",
            iconWrap: isDark ? "bg-violet-300 text-slate-950" : "bg-violet-500 text-white",
            icon: "",
          }}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Thirty-day signal</p>
              <h2 className="mt-2 text-2xl font-black">Expense momentum</h2>
            </div>
            <div className={`rounded-2xl px-4 py-2 text-xs font-bold ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              Live BE chart
            </div>
          </div>

          <div className="h-[320px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="expense-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#243041" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => formatCompactCurrency(value, currencyCode)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                    formatter={(value) => [formatCurrency(value, currencyCode), "Expense"]}
                  />
                  <Area type="monotone" dataKey="total_amount" stroke="#22d3ee" strokeWidth={3} fill="url(#expense-glow)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-slate-400">
                <div>
                  <TrendingUp size={28} className="mx-auto text-cyan-400" />
                  <p className="mt-3 text-sm">Add expenses to see your momentum line.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Category pulse</p>
              <h2 className="mt-2 text-2xl font-black">Expense mix</h2>
            </div>
            <Flame className="text-orange-300" size={20} />
          </div>

          <div className="h-[320px]">
            {distributionData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={3}>
                    {distributionData.map((item, index) => (
                      <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                    formatter={(value) => [formatCurrency(value, currencyCode), "Spent"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-slate-400">
                <div>
                  <BriefcaseBusiness size={28} className="mx-auto text-orange-300" />
                  <p className="mt-3 text-sm">No breakdown available yet.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {distributionData.slice(0, 4).map((item, index) => (
              <div key={item.name} className={`flex items-center justify-between rounded-2xl px-3 py-2 ${isDark ? "bg-white/5" : "bg-slate-100/80"}`}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(item.value, currencyCode)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Recent feed</p>
            <h2 className="mt-2 text-2xl font-black">Latest transactions</h2>
          </div>
          <Link
            to="/analytics"
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
              isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            <Sparkles size={16} />
            Explore full timeline
          </Link>
        </div>

        <div className="grid gap-3">
          {recentTransactions.length ? (
            recentTransactions.map((transaction) => {
              const type = transaction.type === "income" ? "income" : "expense";
              const fallbackBadge = type === "income" ? "$" : "-";

              return (
                <div
                  key={transaction.id}
                  className={`flex flex-col gap-4 rounded-[1.5rem] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black ${type === "income" ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-300/15 text-orange-200"}`}>
                      {transaction.emoji || fallbackBadge}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{transaction.category_name || "Uncategorized"}</p>
                      <p className="text-xs text-slate-400">{formatLongDate(transaction.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${type === "income" ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-300/15 text-orange-200"}`}>
                      {type}
                    </div>
                    <div className={`text-right text-lg font-black ${type === "income" ? "text-emerald-300" : "text-orange-200"}`}>
                      {type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(transaction.amount, transaction.currency_code || currencyCode)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`rounded-[1.5rem] border border-dashed px-6 py-14 text-center ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}`}>
              <CreditCard size={28} className="mx-auto text-cyan-400" />
              <p className="mt-4 text-sm">No recent activity yet. Backend transactions will appear here as soon as they exist.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
