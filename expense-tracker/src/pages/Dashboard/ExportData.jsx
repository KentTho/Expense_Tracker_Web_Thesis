import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";

export default function ExportData() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState({ income: false, expense: false });

  // ✅ Mock data (dữ liệu mẫu)
  const sampleData = [
    { id: 1, type: "income", source: "Salary", amount: 1200, date: "2025-09-01", emoji: "💼" },
    { id: 2, type: "expense", category: "Food", amount: 60, date: "2025-09-02", emoji: "🍕" },
    { id: 3, type: "income", source: "Freelance", amount: 500, date: "2025-09-05", emoji: "💻" },
    { id: 4, type: "expense", category: "Transport", amount: 30, date: "2025-09-06", emoji: "🚗" },
  ];

  // ✅ Giả lập tải xuống file Excel
  const handleDownload = async (type) => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloaded((prev) => ({ ...prev, [type]: true }));
      alert(`📂 ${type === "income" ? "Income" : "Expense"} data exported successfully!`);
    }, 1500);
  };

  // ✅ Giao diện
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-8 space-y-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-green-500" /> Data Export
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Download your transaction data as Excel (.xlsx) for detailed analysis.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div
          className={`p-8 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h2 className="text-lg font-semibold mb-6">Available Downloads</h2>

          {/* Buttons */}
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
                <h3 className="text-xl font-semibold mb-2 text-green-500">Income Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all your income transactions including source, amount, date, and emoji.
                </p>
              </div>

              <button
                onClick={() => handleDownload("income")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-lg transition-all duration-300 text-white ${
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
                    <Download size={18} /> {isDownloading ? "Downloading..." : "Download Income"}
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
                <h3 className="text-xl font-semibold mb-2 text-red-500">Expense Data</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all your expense records with category, amount, date, and emoji.
                </p>
              </div>

              <button
                onClick={() => handleDownload("expense")}
                disabled={isDownloading}
                className={`mt-6 flex items-center gap-2 px-5 py-2 rounded-lg transition-all duration-300 text-white ${
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
                    <Download size={18} /> {isDownloading ? "Downloading..." : "Download Expense"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-3">Sample Data Preview</h3>
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
                    <th className="p-2">Category/Source</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Emoji</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <td className="p-2">{item.id}</td>
                      <td
                        className={`p-2 font-medium ${
                          item.type === "income" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {item.type}
                      </td>
                      <td className="p-2">
                        {item.category || item.source}
                      </td>
                      <td className="p-2">${item.amount}</td>
                      <td className="p-2">{item.date}</td>
                      <td className="p-2">{item.emoji}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>
                <strong>Total Income:</strong> $
                {sampleData
                  .filter((d) => d.type === "income")
                  .reduce((a, b) => a + b.amount, 0)}
              </p>
              <p>
                <strong>Total Expense:</strong> $
                {sampleData
                  .filter((d) => d.type === "expense")
                  .reduce((a, b) => a + b.amount, 0)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
