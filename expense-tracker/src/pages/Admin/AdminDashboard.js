import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { adminGetAllUsers, adminGetGlobalKPIs, adminGetGlobalUserGrowth } from "../../services/adminService";
import { formatCompactCurrency, formatCurrency, formatShortDate } from "../../utils/formatters";

const PIE_COLORS = ["#22d3ee", "#fb923c"];

function StatCard({ label, value, icon: Icon, tone, helper }) {
  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-xl ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <Icon size={18} className="text-cyan-300" />
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-tight">{value}</h3>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);

      const [kpiResult, growthResult, usersResult] = await Promise.allSettled([
        adminGetGlobalKPIs(),
        adminGetGlobalUserGrowth(30),
        adminGetAllUsers(0, 12),
      ]);

      if (!mounted) {
        return;
      }

      setKpis(
        kpiResult.status === "fulfilled"
          ? kpiResult.value
          : {
              total_users: 0,
              total_income: 0,
              total_expense: 0,
              net_balance: 0,
              total_2fa_users: 0,
              new_users_24h: 0,
            }
      );

      setGrowth(growthResult.status === "fulfilled" && Array.isArray(growthResult.value) ? growthResult.value : []);

      const users = usersResult.status === "fulfilled" && Array.isArray(usersResult.value) ? usersResult.value : [];
      setRecentUsers(
        [...users]
          .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
          .slice(0, 6)
      );

      setLoading(false);
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const financeSplit = useMemo(() => {
    return [
      { name: "Income", value: Number(kpis?.total_income || 0) },
      { name: "Expense", value: Number(kpis?.total_expense || 0) },
    ].filter((item) => item.value > 0);
  }, [kpis]);

  const growthData = useMemo(() => {
    return growth.map((item) => ({
      ...item,
      label: formatShortDate(item.date),
    }));
  }, [growth]);

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className={`rounded-[2rem] border px-8 py-10 text-center ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Loading admin board</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-[2.25rem] border p-6 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-orange-200">
              <ShieldCheck size={14} />
              Admin cockpit
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">System pulse</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-400">
              Global KPIs, user growth, and newest accounts now read cleanly from the backend admin contract, with FE handling the list shape correctly.
            </p>
          </div>

          <div className={`rounded-[1.75rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Quick focus</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">New users (24h)</p>
                <p className="mt-2 text-2xl font-black">+{kpis?.new_users_24h || 0}</p>
              </div>
              <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">2FA adoption</p>
                <p className="mt-2 text-2xl font-black">{kpis?.total_2fa_users || 0}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:translate-y-[-1px]">
                <Users size={16} />
                Manage users
              </Link>
              <Link to="/admin/logs" className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"}`}>
                <Activity size={16} />
                Open logs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={`${kpis?.total_users || 0}`} icon={Users} helper="Accounts currently tracked by the system." tone={isDark ? "border-cyan-400/15 bg-cyan-400/10" : "border-cyan-100 bg-cyan-50"} />
        <StatCard label="Income" value={formatCurrency(kpis?.total_income, "USD")} icon={TrendingUp} helper="Global recorded income." tone={isDark ? "border-emerald-400/15 bg-emerald-400/10" : "border-emerald-100 bg-emerald-50"} />
        <StatCard label="Expense" value={formatCurrency(kpis?.total_expense, "USD")} icon={TrendingDown} helper="Global recorded expense." tone={isDark ? "border-orange-300/15 bg-orange-300/10" : "border-orange-100 bg-orange-50"} />
        <StatCard label="Net" value={formatCurrency(kpis?.net_balance, "USD")} icon={Sparkles} helper="Income minus expense across the platform." tone={isDark ? "border-violet-400/15 bg-violet-400/10" : "border-violet-100 bg-violet-50"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">User acquisition</p>
              <h2 className="mt-2 text-2xl font-black">30-day growth</h2>
            </div>
            <BarChart3 className="text-cyan-400" size={18} />
          </div>

          <div className="h-[320px]">
            {growthData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="admin-growth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#243041" : "#e2e8f0"} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={40} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                    formatter={(value) => [`${value} new users`, "Growth"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={3} fill="url(#admin-growth)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-slate-400">
                <div>
                  <UserPlus size={28} className="mx-auto text-cyan-400" />
                  <p className="mt-3 text-sm">Growth data is not available yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Financial split</p>
            <h2 className="mt-2 text-2xl font-black">Income vs expense</h2>
          </div>

          <div className="h-[320px]">
            {financeSplit.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financeSplit} dataKey="value" innerRadius={64} outerRadius={104} paddingAngle={3}>
                    {financeSplit.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 18,
                      border: "1px solid rgba(148,163,184,0.15)",
                    }}
                    formatter={(value) => [formatCurrency(value, "USD"), "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-center text-slate-400">
                <div>
                  <Sparkles size={28} className="mx-auto text-orange-200" />
                  <p className="mt-3 text-sm">No finance split to visualize yet.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Income share</p>
              <p className="mt-2 text-lg font-black text-cyan-300">{formatCompactCurrency(kpis?.total_income, "USD")}</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Expense share</p>
              <p className="mt-2 text-lg font-black text-orange-200">{formatCompactCurrency(kpis?.total_expense, "USD")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Newest members</p>
            <h2 className="mt-2 text-2xl font-black">Recent signups</h2>
          </div>
          <Link to="/admin/users" className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"}`}>
            <ArrowUpRight size={16} />
            View all users
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentUsers.length ? (
            recentUsers.map((user) => (
              <div key={user.id} className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
                <div className="flex items-center gap-3">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt={user.name || "User"} className="h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-orange-300 text-sm font-black text-slate-950">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name || "Unnamed user"}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${user.is_admin ? "bg-violet-400/15 text-violet-300" : "bg-cyan-400/15 text-cyan-300"}`}>
                    {user.is_admin ? "Admin" : "Member"}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{formatShortDate(user.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 px-6 py-16 text-center text-slate-400 md:col-span-2 xl:col-span-3">
              <Users size={28} className="mx-auto text-cyan-400" />
              <p className="mt-4 text-sm">No recent users to display yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
