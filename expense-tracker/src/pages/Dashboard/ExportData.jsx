// ExportData.jsx
// - ADDED: Preview filter (All, Income, Expense) for the table.
// - UPDATED: All comments and UI text are now in English.
// - RETAINED: Redesigned UI (Glow Cards, Upgraded Table Font/Icons).

import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  Filter, // Added icon for filter
} from "lucide-react";
import { BACKEND_BASE } from "../../services/api";
import { getToken } from "../../services/incomeService"; 

export default function ExportData() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState({ income: false, expense: false });
  const [data, setData] = useState([]); // Master data list
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$"); 
  
  // ✅ NEW: State for the preview filter
  const [previewFilter, setPreviewFilter] = useState("all");

  // ===========================
  // 🧩 HELPER: CURRENCY FORMATTING
  // ===========================
  const formatCurrency = (amount, symbol) => {
    // Round to 0 decimal places
    const roundedAmount = Math.round(Number(amount));
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD', // Default currency for formatting
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(roundedAmount).replace('$', symbol); // Replace default $ with the user's symbol
    } catch (e) {
        // Fallback if symbol is invalid
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(roundedAmount);
    }
  };


  // ===========================
  // 🧩 Fetch data
  // ===========================
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const token = await getToken();
      
      const [resIncome, resExpense] = await Promise.all([
        fetch(`${BACKEND_BASE}/incomes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_BASE}/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!resIncome.ok || !resExpense.ok)
        throw new Error("Failed to fetch income or expense data");

      const incomeResponse = await resIncome.json();
      const expenseResponse = await resExpense.json();

      const incomeData = incomeResponse.items;
      const expenseData = expenseResponse.items;
      
      // Update currency symbol from response
      if (incomeResponse.currency_symbol) {
        setCurrencySymbol(incomeResponse.currency_symbol);
      }

      // Combine data
      const combined = [
        ...incomeData.map((i) => ({ ...i, type: "income" })),
        ...expenseData.map((e) => ({ ...e, type: "expense" })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)); // sort by newest first

      setData(combined);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Failed to load data, please try again!");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===========================
  // 🧩 Handle export Excel
  // ===========================
  const handleDownload = async (type) => {
    try {
      setIsDownloading(true);
      const token = await getToken(); 
      const endpoint =
        type === "income"
          ? `${BACKEND_BASE}/export/income`
          : `${BACKEND_BASE}/export/expense`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to export data");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setDownloaded((prev) => ({ ...prev, [type]: true }));
    } catch (err) {
      console.error("Export failed:", err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // ===========================
  // 💡 FILTERED DATA (for preview)
  // ===========================
  const filteredData = useMemo(() => {
    if (previewFilter === 'all') return data;
    return data.filter(item => item.type === previewFilter);
  }, [data, previewFilter]);

  // ===========================
  // 💡 CALCULATE TOTALS (based on filteredData)
  // ===========================
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const income = filteredData // Use filteredData
      .filter((d) => d.type === "income")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
    
    const expense = filteredData // Use filteredData
      .filter((d) => d.type === "expense")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
      
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    };
  }, [filteredData]); // Dependency is filteredData


  // ===========================
  // 💄 UI REDESIGN
  // ===========================
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3">
              <FileSpreadsheet className="text-blue-500" size={32} />
              Export Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Preview and export your transaction data as Excel (.xlsx).
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isDark
                ? "border-gray-700 bg-gray-800 hover:bg-gray-700"
                : "border-gray-300 bg-white hover:bg-gray-100"
            }`}
          >
            <RefreshCw
              size={18}
              className={isRefreshing ? "animate-spin text-blue-400" : "text-blue-500"}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* 💡 DOWNLOAD CARDS (REDESIGNED WITH GLOW) */}
        <div
          className={`p-6 sm:p-8 rounded-2xl shadow-xl ${
            isDark ? "bg-gray-800" : "bg-white border"
          }`}
        >
          <h2 className="text-xl font-semibold mb-6">Available Downloads</h2>
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Income Card */}
            <div
              className={`flex-1 rounded-xl p-6 flex flex-col justify-between items-center border-2 transition-all duration-300
                ${isDark
                  ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                  : "border-green-500/70 bg-green-500/10 hover:bg-green-500/20"
                }
                shadow-green-500/20 hover:shadow-green-500/40 hover:shadow-lg`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-green-500">
                  Income Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all Income transactions.
                </p>
              </div>

              <button
                onClick={() => handleDownload("income")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all
                  ${downloaded.income
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-green-500 hover:bg-green-400"
                  }
                  shadow-lg shadow-green-500/30 transform hover:scale-105`}
              >
                {downloaded.income ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading ? "Processing..." : (downloaded.income ? "Downloaded" : "Download Income")}
              </button>
            </div>

            {/* Expense Card */}
            <div
              className={`flex-1 rounded-xl p-6 flex flex-col justify-between items-center border-2 transition-all duration-300
                ${isDark
                  ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                  : "border-red-500/70 bg-red-500/10 hover:bg-red-500/20"
                }
                shadow-red-500/20 hover:shadow-red-500/40 hover:shadow-lg`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2 text-red-500">
                  Expense Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all Expense transactions.
                </p>
              </div>

              <button
                onClick={() => handleDownload("expense")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all
                  ${downloaded.expense
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-500 hover:bg-red-400"
                  }
                  shadow-lg shadow-red-500/30 transform hover:scale-105`}
              >
                {downloaded.expense ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading ? "Processing..." : (downloaded.expense ? "Downloaded" : "Download Expense")}
              </button>
            </div>
          </div>
        </div>

        {/* 💡 PREVIEW TABLE (UPGRADED FONT & ICONS) */}
        <div
          className={`p-6 sm:p-8 rounded-2xl shadow-xl ${
            isDark ? "bg-gray-800" : "bg-white border"
          }`}
        >
          <div className="mt-4">
            {/* ✅ NEW: HEADER WITH FILTER */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <h3 className="text-xl font-semibold">Transaction Preview</h3>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={previewFilter}
                  onChange={(e) => setPreviewFilter(e.target.value)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-800"
                  }`}
                >
                  <option value="all">Show All Types</option>
                  <option value="income">Show Income Only</option>
                  <option value="expense">Show Expense Only</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {/* Upgraded table font size */}
              <table className="min-w-full text-base border-collapse">
                <thead>
                  <tr
                    className={`${
                      isDark ? "bg-gray-700/50" : "bg-gray-100"
                    } text-left border-b-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    {/* Upgraded padding */}
                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Type</th>
                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Category</th>
                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Date</th>
                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Emoji</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        {/* Upgraded padding */}
                        <td className="py-4 px-4 font-bold">
                          <span 
                            className={`py-1 px-2.5 rounded-full text-sm ${
                              item.type === "income"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium">{item.category_name}</td>
                        <td className="py-4 px-4 font-semibold">
                          {formatCurrency(item.amount, currencySymbol)}
                        </td>
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400">{item.date}</td>
                        {/* Upgraded icon size */}
                        <td className="py-4 px-4 text-lg">{item.emoji}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-gray-400">
                        {isRefreshing ? "Loading data..." : "No data found for this filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 💡 UPGRADED SUMMARY (Now reflects filtered data) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Income */}
              <div className={`p-4 rounded-lg ${isDark ? "bg-green-500/10" : "bg-green-500/10"} ${previewFilter === 'expense' && 'opacity-30'}`}>
                <p className="text-sm font-medium text-green-500 flex items-center gap-2">
                  <TrendingUp size={16} /> Total Income
                </p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {formatCurrency(totalIncome, currencySymbol)}
                </p>
              </div>
              {/* Total Expense */}
              <div className={`p-4 rounded-lg ${isDark ? "bg-red-500/10" : "bg-red-500/10"} ${previewFilter === 'income' && 'opacity-30'}`}>
                <p className="text-sm font-medium text-red-500 flex items-center gap-2">
                  <TrendingDown size={16} /> Total Expense
                </p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {formatCurrency(totalExpense, currencySymbol)}
                </p>
              </div>
              {/* Net Balance */}
              <div className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Scale size={16} /> Net Balance (Displayed)
                </p>
                <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(netBalance, currencySymbol)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}