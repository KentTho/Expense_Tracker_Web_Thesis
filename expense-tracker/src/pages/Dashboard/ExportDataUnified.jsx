import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Download,
  Filter,
  Loader2,
  RefreshCw,
  SearchX,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Vault,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { authorizedFetch } from "../../services/api";
import { getIncomes } from "../../services/incomeService";
import { getExpenses } from "../../services/expenseService";
import { formatCurrency, formatLongDate } from "../../utils/formatters";

function SummaryTile({ title, value, icon: Icon, tone }) {
  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-xl ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{title}</p>
        <Icon size={18} className="text-cyan-300" />
      </div>
      <h3 className="mt-4 text-3xl font-black tracking-tight">{value}</h3>
    </div>
  );
}

export default function ExportDataUnified() {
  const { theme, currencyCode } = useOutletContext();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadPreview() {
      setLoading(true);

      const [incomeResult, expenseResult] = await Promise.allSettled([getIncomes(), getExpenses()]);
      if (!mounted) {
        return;
      }

      const incomes = incomeResult.status === "fulfilled" ? incomeResult.value : [];
      const expenses = expenseResult.status === "fulfilled" ? expenseResult.value?.items || [] : [];
      const merged = [
        ...incomes.map((item) => ({ ...item, type: "income" })),
        ...expenses.map((item) => ({ ...item, type: "expense" })),
      ].sort((left, right) => new Date(right.date) - new Date(left.date));

      setTransactions(merged);
      setLoading(false);
    }

    loadPreview();
    const handleRefresh = () => loadPreview();
    window.addEventListener("transactionUpdated", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("transactionUpdated", handleRefresh);
    };
  }, []);

  const filteredTransactions = useMemo(
    () => (filter === "all" ? transactions : transactions.filter((item) => item.type === filter)),
    [transactions, filter]
  );

  const totals = useMemo(
    () =>
      filteredTransactions.reduce(
        (accumulator, item) => {
          const amount = Number(item.amount || 0);
          if (item.type === "income") {
            accumulator.income += amount;
          } else {
            accumulator.expense += amount;
          }
          return accumulator;
        },
        { income: 0, expense: 0 }
      ),
    [filteredTransactions]
  );

  async function handleDownload(type) {
    try {
      setDownloading(type);
      const toastId = toast.loading(`Preparing ${type} export...`);
      const blob = await authorizedFetch(`/export/${type}`, { method: "GET" }, { responseType: "blob" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type === "income" ? "Income" : "Expense"} export downloaded.`, { id: toastId });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error.message || "Failed to export data.");
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />

      <section
        className={`rounded-[2.25rem] border p-6 shadow-xl ${
          isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
        }`}
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              <Vault size={14} />
              Export vault
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Download center</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-400">
              Exports are now synchronized with the backend streaming endpoints. The preview below is built from the
              same live income and expense sources the rest of the app uses.
            </p>
          </div>

          <div className={`rounded-[1.75rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Synchronized exports</p>
                <p className="text-xs text-slate-400">
                  No fake progress loop. The FE now downloads exactly what the BE generates.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleDownload("income")}
                disabled={downloading === "income"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                {downloading === "income" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Income .xlsx
              </button>
              <button
                type="button"
                onClick={() => handleDownload("expense")}
                disabled={downloading === "expense"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-300/30 bg-orange-300/10 px-4 py-3 text-sm font-black text-orange-100 transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                {downloading === "expense" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Expense .xlsx
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryTile
          title="Income preview"
          value={formatCurrency(totals.income, currencyCode)}
          icon={TrendingUp}
          tone={isDark ? "border-emerald-400/15 bg-emerald-400/10" : "border-emerald-100 bg-emerald-50"}
        />
        <SummaryTile
          title="Expense preview"
          value={formatCurrency(totals.expense, currencyCode)}
          icon={TrendingDown}
          tone={isDark ? "border-orange-300/15 bg-orange-300/10" : "border-orange-100 bg-orange-50"}
        />
        <SummaryTile
          title="Rows selected"
          value={`${filteredTransactions.length}`}
          icon={Sparkles}
          tone={isDark ? "border-cyan-400/15 bg-cyan-400/10" : "border-cyan-100 bg-cyan-50"}
        />
      </section>

      <section className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Preview table</p>
            <h2 className="mt-2 text-2xl font-black">Ready-to-export rows</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              <Filter size={16} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className={`bg-transparent text-sm font-semibold outline-none ${isDark ? "text-white" : "text-slate-700"}`}
              >
                <option value="all">All rows</option>
                <option value="income">Income only</option>
                <option value="expense">Expense only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("transactionUpdated"))}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="text-center">
              <Loader2 size={30} className="mx-auto animate-spin text-cyan-400" />
              <p className="mt-4 text-sm">Loading preview rows...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
            <table className="min-w-full text-left">
              <thead className={isDark ? "bg-slate-950/70 text-slate-400" : "bg-slate-100 text-slate-500"}>
                <tr>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Type</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Category</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Note</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-[0.25em]">Date</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-[0.25em]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? (
                  filteredTransactions.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className={`border-t ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${item.type === "income" ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-300/15 text-orange-200"}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">
                        <span className="mr-2">{item.emoji || (item.type === "income" ? "$" : "-")}</span>
                        {item.category_name || "Uncategorized"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">{item.note || "No note"}</td>
                      <td className="px-4 py-4 text-sm">{formatLongDate(item.date)}</td>
                      <td className={`px-4 py-4 text-right text-sm font-black ${item.type === "income" ? "text-emerald-300" : "text-orange-200"}`}>
                        {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount, item.currency_code || currencyCode)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                      <SearchX size={28} className="mx-auto text-cyan-400" />
                      <p className="mt-4 text-sm">No rows available for the current filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
