import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Pie,
  PieChart as RePieChart,
  Cell,
} from "recharts";

export default function Analytics() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  // Mock data
  const [transactions, setTransactions] = useState([
    { id: 1, type: "income", category: "Salary", amount: 1200, date: "2025-09-01" },
    { id: 2, type: "expense", category: "Food", amount: 50, date: "2025-09-02" },
    { id: 3, type: "expense", category: "Transport", amount: 20, date: "2025-09-03" },
    { id: 4, type: "income", category: "Freelance", amount: 500, date: "2025-09-10" },
    { id: 5, type: "expense", category: "Entertainment", amount: 100, date: "2025-09-12" },
  ]);

  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    startDate: "",
    endDate: "",
  });

  const [filteredData, setFilteredData] = useState([]);

  // --- Xử lý lọc dữ liệu ---
  useEffect(() => {
    let data = [...transactions];
    if (filters.type !== "all") data = data.filter((t) => t.type === filters.type);
    if (filters.category !== "all") data = data.filter((t) => t.category === filters.category);
    if (filters.startDate)
      data = data.filter((t) => new Date(t.date) >= new Date(filters.startDate));
    if (filters.endDate)
      data = data.filter((t) => new Date(t.date) <= new Date(filters.endDate));
    setFilteredData(data);
  }, [filters, transactions]);

  // --- Tổng thu nhập & chi tiêu ---
  const totalIncome = filteredData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // --- Biểu đồ ---
  const barData = [
    { name: "Income", amount: totalIncome },
    { name: "Expense", amount: totalExpense },
  ];

  const pieData = filteredData.reduce((acc, cur) => {
    const found = acc.find((a) => a.category === cur.category);
    if (found) found.amount += cur.amount;
    else acc.push({ category: cur.category, amount: cur.amount });
    return acc;
  }, []);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const handleDownloadReport = () => {
    alert("📄 Download report (Excel/PDF) — connect to backend API here!");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-8 space-y-8">
        {/* --- Header --- */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="text-blue-500" /> Analytics Dashboard
          </h1>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
          >
            <Download size={18} /> Export Report
          </button>
        </div>

        {/* --- Bộ lọc --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter /> Filter Options
          </h3>

          <div className="grid grid-cols-4 gap-4">
            {/* Loại giao dịch */}
            <div>
              <label className="block text-sm mb-1">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-sm mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <option value="all">All</option>
                <option value="Salary">Salary</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            {/* Ngày bắt đầu */}
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            {/* Ngày kết thúc */}
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>

        {/* --- Tổng hợp thống kê --- */}
        <div className="grid grid-cols-3 gap-6">
          <div
            className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">Total Balance</h3>
            <p
              className={`text-3xl font-bold ${
                totalBalance >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ${totalBalance.toLocaleString()}
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">Total Income</h3>
            <p className="text-3xl font-bold text-green-400">
              ${totalIncome.toLocaleString()}
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3">Total Expense</h3>
            <p className="text-3xl font-bold text-red-400">
              ${totalExpense.toLocaleString()}
            </p>
          </div>
        </div>

        {/* --- Biểu đồ --- */}
        <div className="grid grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div
            className={`p-6 rounded-2xl shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BarChart3 /> Income vs Expense
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke={isDark ? "#94A3B8" : "#334155"} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1E293B" : "#F1F5F9",
                    border: "none",
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div
            className={`p-6 rounded-2xl shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <PieChart /> Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={pieData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Bảng thống kê --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-3">Detailed Transactions</h3>
          <table className="w-full text-sm">
            <thead>
              <tr
                className={`border-b ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <td className="py-2">{t.date}</td>
                  <td
                    className={`py-2 font-medium ${
                      t.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.type}
                  </td>
                  <td className="py-2">{t.category}</td>
                  <td className="py-2 text-right font-semibold">
                    ${t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
