import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { BACKEND_BASE } from "../../services/api";
import { getToken } from "../../services/incomeService";

export default function ExportData() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState({ income: false, expense: false });
  const [data, setData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ===========================
  // 🧩 Fetch data from backend
  // ===========================
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const token = getToken();
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

      const incomeData = await resIncome.json();
      const expenseData = await resExpense.json();

      // Gộp dữ liệu lại
      const combined = [
        ...incomeData.map((i) => ({
          id: i.id,
          type: "income",
          category_name: i.category_name,
          amount: i.amount,
          date: i.date,
          emoji: i.emoji,
        })),
        ...expenseData.map((e) => ({
          id: e.id,
          type: "expense",
          category_name: e.category_name,
          amount: e.amount,
          date: e.date,
          emoji: e.emoji,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)); // sắp xếp mới nhất lên đầu

      setData(combined);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      alert("Không thể tải dữ liệu, vui lòng thử lại!");
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
      const token = getToken();
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
  // 💄 UI
  // ===========================
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-8 space-y-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-green-500" /> Data Export
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Preview and export your transaction data as Excel (.xlsx).
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              isDark
                ? "border-gray-700 bg-[#1e293b] hover:bg-[#334155]"
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

        {/* Export Buttons */}
        <div
          className={`p-8 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h2 className="text-lg font-semibold mb-6">Available Downloads</h2>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Income */}
            <div
              className={`flex-1 rounded-xl p-6 flex flex-col justify-between items-center border transition ${
                isDark
                  ? "border-gray-700 bg-[#0f172a] hover:bg-[#1e293b]"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-green-500">
                  Income Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all income transactions (category, amount, date, emoji)
                </p>
              </div>

              <button
                onClick={() => handleDownload("income")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-lg text-white ${
                  downloaded.income
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {downloaded.income ? (
                  <>
                    <CheckCircle2 size={18} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={18} />{" "}
                    {isDownloading ? "Downloading..." : "Download Income"}
                  </>
                )}
              </button>
            </div>

            {/* Expense */}
            <div
              className={`flex-1 rounded-xl p-6 flex flex-col justify-between items-center border transition ${
                isDark
                  ? "border-gray-700 bg-[#0f172a] hover:bg-[#1e293b]"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-red-500">
                  Expense Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all expense transactions (category, amount, date, emoji)
                </p>
              </div>

              <button
                onClick={() => handleDownload("expense")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-lg text-white ${
                  downloaded.expense
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {downloaded.expense ? (
                  <>
                    <CheckCircle2 size={18} /> Downloaded
                  </>
                ) : (
                  <>
                    <Download size={18} />{" "}
                    {isDownloading ? "Downloading..." : "Download Expense"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-3">Transaction Preview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr
                    className={`${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    } text-left border-b border-gray-600`}
                  >
                    <th className="p-2">ID</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Emoji</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <td className="p-2">{item.id}</td>
                        <td
                          className={`p-2 font-medium ${
                            item.type === "income"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.type}
                        </td>
                        <td className="p-2">{item.category_name}</td>
                        <td className="p-2">${item.amount}</td>
                        <td className="p-2">{item.date}</td>
                        <td className="p-2">{item.emoji}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center p-4 text-gray-400">
                        Loading data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {data.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  <strong>Total Income:</strong> $
                  {data
                    .filter((d) => d.type === "income")
                    .reduce((a, b) => a + Number(b.amount || 0), 0)
                    .toFixed(2)}
                </p>
                <p>
                  <strong>Total Expense:</strong> $
                  {data
                    .filter((d) => d.type === "expense")
                    .reduce((a, b) => a + Number(b.amount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
