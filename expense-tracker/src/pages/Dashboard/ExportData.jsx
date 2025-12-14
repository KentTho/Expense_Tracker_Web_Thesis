// ExportData.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  Filter, 
  FileText,
  SearchX,
  Loader2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast"; 
import { BACKEND_BASE } from "../../services/api";
import { getToken } from "../../services/incomeService"; 

export default function ExportData() {
  const { theme, currencyCode } = useOutletContext();
  const isDark = theme === "dark";

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState({ income: false, expense: false });
  const [data, setData] = useState([]); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [previewFilter, setPreviewFilter] = useState("all");

  // ===========================
  // 🧩 HELPER: CURRENCY FORMATTING
  // ===========================
  const formatCurrency = (amount, currencyCode) => {
    const roundedAmount = Math.round(Number(amount) || 0); 
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(roundedAmount).replace(currencyCode, currencyCode); 
    } catch (e) { 
        return `${currencyCode} ${roundedAmount.toLocaleString()}`; 
    }
  };

  // ===========================
  // 🧩 Fetch data
  // ===========================
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const token = await getToken();
      
      const safeFetch = async (url) => {
        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return { items: [] }; 
            return await res.json();
        } catch (e) {
            console.warn(`Fetch failed for ${url}`, e);
            return { items: [] };
        }
      };

      const [incomeResponse, expenseResponse] = await Promise.all([
        safeFetch(`${BACKEND_BASE}/incomes`),
        safeFetch(`${BACKEND_BASE}/expenses`),
      ]);

      const incomeData = Array.isArray(incomeResponse.items) ? incomeResponse.items : [];
      const expenseData = Array.isArray(expenseResponse.items) ? expenseResponse.items : [];
      
      const combined = [
        ...incomeData.map((i) => ({ ...i, type: "income" })),
        ...expenseData.map((e) => ({ ...e, type: "expense" })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setData(combined);
      
    } catch (err) {
      console.error("❌ Critical Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===========================
  // 🧩 Handle export Excel
  // ===========================
  const handleDownload = async (type) => {
    const hasData = data.some(item => item.type === type);
    if (!hasData) {
        toast("No data available to export.", { icon: "📂" });
        return;
    }

    try {
      setIsDownloading(true);
      const toastId = toast.loading(`Preparing ${type} report...`);
      
      const token = await getToken(); 
      const endpoint =
        type === "income"
          ? `${BACKEND_BASE}/export/income`
          : `${BACKEND_BASE}/export/expense`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setDownloaded((prev) => ({ ...prev, [type]: true }));
      toast.success(`${type} report downloaded!`, { id: toastId });

      setTimeout(() => {
        setDownloaded((prev) => ({ ...prev, [type]: false }));
      }, 3000);

    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ===========================
  // 💡 FILTERED DATA
  // ===========================
  const filteredData = useMemo(() => {
    if (previewFilter === 'all') return data;
    return data.filter(item => item.type === previewFilter);
  }, [data, previewFilter]);

  // ===========================
  // 💡 CALCULATE TOTALS
  // ===========================
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const income = filteredData
      .filter((d) => d.type === "income")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
    
    const expense = filteredData
      .filter((d) => d.type === "expense")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
      
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    };
  }, [filteredData]); 

  // ===========================
  // 💄 UI RENDER
  // ===========================
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-3">
              <FileSpreadsheet className="text-blue-500" size={28} />
              Export Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Preview and export your transaction history.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all active:scale-95 text-sm sm:text-base ${
              isDark
                ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200"
                : "border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            }`}
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-blue-500" : "text-gray-500"}
            />
            {isRefreshing ? "Syncing..." : "Refresh Data"}
          </button>
        </div>

        {/* 💡 DOWNLOAD CARDS - Responsive Grid */}
        <div
          className={`p-4 sm:p-8 rounded-2xl shadow-xl ${
            isDark ? "bg-gray-800" : "bg-white border border-gray-100"
          }`}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Available Exports</h2>
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            
            {/* Income Card */}
            <div
              className={`flex-1 rounded-2xl p-5 sm:p-6 flex flex-col justify-between items-center border-2 transition-all duration-300
                ${isDark
                  ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                  : "border-green-100 bg-green-50 hover:border-green-200"
                } hover:shadow-lg`}
            >
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-green-600 dark:text-green-500">
                  Income Report
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Detailed list of all earnings.
                </p>
              </div>

              <button
                onClick={() => handleDownload("income")}
                disabled={isDownloading}
                className={`mt-4 sm:mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm sm:text-base transition-all
                  ${downloaded.income
                    ? "bg-green-700 hover:bg-green-600"
                    : "bg-green-600 hover:bg-green-500"
                  }
                  shadow-lg shadow-green-500/20 transform hover:-translate-y-0.5 active:translate-y-0`}
              >
                {isDownloading ? (
                   <Loader2 size={18} className="animate-spin" />
                ) : downloaded.income ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading ? "Processing..." : (downloaded.income ? "Saved" : "Download .XLSX")}
              </button>
            </div>

            {/* Expense Card */}
            <div
              className={`flex-1 rounded-2xl p-5 sm:p-6 flex flex-col justify-between items-center border-2 transition-all duration-300
                ${isDark
                  ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                  : "border-red-100 bg-red-50 hover:border-red-200"
                } hover:shadow-lg`}
            >
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-red-600 dark:text-red-500">
                  Expense Report
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Detailed list of all spendings.
                </p>
              </div>

              <button
                onClick={() => handleDownload("expense")}
                disabled={isDownloading}
                className={`mt-4 sm:mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm sm:text-base transition-all
                  ${downloaded.expense
                    ? "bg-red-700 hover:bg-red-600"
                    : "bg-red-600 hover:bg-red-500"
                  }
                  shadow-lg shadow-red-500/20 transform hover:-translate-y-0.5 active:translate-y-0`}
              >
                {isDownloading ? (
                   <Loader2 size={18} className="animate-spin" />
                ) : downloaded.expense ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading ? "Processing..." : (downloaded.expense ? "Saved" : "Download .XLSX")}
              </button>
            </div>
          </div>
        </div>

        {/* 💡 PREVIEW TABLE (MOBILE OPTIMIZED) */}
        <div
          className={`p-4 sm:p-8 rounded-2xl shadow-xl ${
            isDark ? "bg-gray-800" : "bg-white border border-gray-100"
          }`}
        >
          <div className="mt-1">
            {/* Header with Filter */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                 Preview Data
                 <span className="text-[10px] sm:text-xs font-normal text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {filteredData.length} items
                 </span>
              </h3>
              
              <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
                <Filter size={18} className="text-gray-400 flex-shrink-0" />
                <select
                  value={previewFilter}
                  onChange={(e) => setPreviewFilter(e.target.value)}
                  className={`w-full md:w-auto py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
              </div>
            </div>
            
            {/* ✅ Responsive Table */}
            <div className="overflow-x-auto custom-scrollbar rounded-xl border dark:border-gray-700">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr
                    className={`${
                      isDark ? "bg-gray-700/50" : "bg-gray-50"
                    } border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
                    <th className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Note</th>
                    <th className="py-3 px-3 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Amount</th>
                    {/* Date Column hidden on mobile */}
                    <th className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                            isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Type Badge */}
                        <td className="py-3 px-3 sm:py-4 sm:px-4">
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold capitalize ${
                              item.type === "income"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>

                        {/* Category + Mobile Date */}
                        <td className="py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg">{item.emoji || (item.type === 'income' ? '💰' : '💸')}</span>
                                <div>
                                    <span className="block">{item.category_name || "Uncategorized"}</span>
                                    {/* Mobile Date display */}
                                    <span className="sm:hidden text-[10px] text-gray-400 block mt-0.5 font-normal">
                                        {item.date}
                                    </span>
                                </div>
                            </div>
                        </td>

                        {/* Note (Desktop Only) */}
                        <td className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic max-w-xs truncate">
                            {item.note ? <span className="flex items-center gap-1"><FileText size={12}/> {item.note}</span> : "-"}
                        </td>

                        {/* Amount */}
                        <td className={`py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm font-bold text-right ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.type === 'expense' ? '-' : '+'} {formatCurrency(item.amount, currencyCode)}
                        </td>

                        {/* Date (Desktop Only) */}
                        <td className="hidden sm:table-cell py-3 px-3 sm:py-4 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right font-medium">
                            {item.date}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // --- EMPTY STATE ---
                    <tr>
                      <td colSpan="5" className="text-center py-10 sm:py-12">
                         <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                            {isRefreshing ? (
                                <>
                                    <RefreshCw size={32} className="animate-spin mb-2 text-blue-500" />
                                    <p className="font-medium text-sm">Syncing data...</p>
                                </>
                            ) : (
                                <>
                                    <SearchX size={40} className="mb-2" />
                                    <p className="font-medium text-sm">No transactions found.</p>
                                    <p className="text-xs mt-1">Change the filter or add new data.</p>
                                </>
                            )}
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 💡 LIVE SUMMARY */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/30 border-gray-700" : "bg-green-50 border-green-100"} ${previewFilter === 'expense' && 'opacity-40 grayscale'}`}>
                <p className="text-[10px] sm:text-xs font-bold uppercase text-green-500 flex items-center gap-2 mb-1">
                  <TrendingUp size={14} /> Total Income
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(totalIncome, currencyCode)}
                </p>
              </div>
              
              <div className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/30 border-gray-700" : "bg-red-50 border-red-100"} ${previewFilter === 'income' && 'opacity-40 grayscale'}`}>
                <p className="text-[10px] sm:text-xs font-bold uppercase text-red-500 flex items-center gap-2 mb-1">
                  <TrendingDown size={14} /> Total Expense
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(totalExpense, currencyCode)}
                </p>
              </div>
              
              <div className={`p-4 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 flex items-center gap-2 mb-1">
                  <Scale size={14} /> Net Balance
                </p>
                <p className={`text-xl sm:text-2xl font-bold ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  {formatCurrency(netBalance, currencyCode)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}