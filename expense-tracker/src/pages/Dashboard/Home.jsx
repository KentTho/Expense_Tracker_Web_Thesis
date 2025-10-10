import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  PieChart as PieIcon,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Home() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  // 🔹 Dữ liệu mô phỏng (sau này thay bằng API)
  const [stats, setStats] = useState({
    totalIncome: 14500,
    totalExpense: 9400,
    recentTransactions: [
      { id: 1, name: "Salary", amount: 3500, type: "income", emoji: "💼", date: "2025-10-01" },
      { id: 2, name: "Groceries", amount: 120, type: "expense", emoji: "🛒", date: "2025-10-02" },
      { id: 3, name: "Gym", amount: 45, type: "expense", emoji: "🏋️", date: "2025-10-03" },
      { id: 4, name: "Freelance", amount: 800, type: "income", emoji: "💻", date: "2025-10-04" },
      { id: 5, name: "Cinema", amount: 20, type: "expense", emoji: "🎬", date: "2025-10-05" },
    ],
  });

  const totalBalance = stats.totalIncome - stats.totalExpense;

  // 🔹 Dữ liệu biểu đồ
  const pieData = [
    { name: "Income", value: stats.totalIncome },
    { name: "Expense", value: stats.totalExpense },
  ];

  const COLORS = ["#22C55E", "#EF4444"];

  const barData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    expense: Math.floor(Math.random() * 300) + 50,
  }));

  const incomeData = Array.from({ length: 8 }, (_, i) => ({
    name: `W${i + 1}`,
    income: Math.floor(Math.random() * 2000) + 800,
  }));

  // 🔹 Giả lập realtime (cập nhật sau mỗi 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        totalIncome: prev.totalIncome + Math.floor(Math.random() * 20),
        totalExpense: prev.totalExpense + Math.floor(Math.random() * 10),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-8 space-y-8">
        {/* --- Header --- */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Financial Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track your balance, income, and expenses
          </p>
        </div>

        {/* --- Tổng quan tài chính --- */}
        <div className="grid grid-cols-3 gap-6">
          {/* Total Balance */}
          <div
            className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Total Balance</h3>
              <Wallet className="text-blue-500" size={24} />
            </div>
            <h2 className="text-4xl font-bold mt-3">${totalBalance.toLocaleString()}</h2>
            <p className="text-sm text-gray-400 mt-1">Income - Expense</p>
          </div>

          {/* Total Income */}
          <div
            className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Total Income</h3>
              <ArrowUpCircle className="text-green-400" size={24} />
            </div>
            <h2 className="text-4xl font-bold mt-3 text-green-400">
              ${stats.totalIncome.toLocaleString()}
            </h2>
            <p className="text-sm text-gray-400 mt-1">All-time earnings</p>
          </div>

          {/* Total Expense */}
          <div
            className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Total Expense</h3>
              <ArrowDownCircle className="text-red-400" size={24} />
            </div>
            <h2 className="text-4xl font-bold mt-3 text-red-400">
              ${stats.totalExpense.toLocaleString()}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Total spending</p>
          </div>
        </div>

        {/* --- Biểu đồ tài chính --- */}
        <div className="grid grid-cols-3 gap-6">
          {/* Pie Chart: Income vs Expense */}
          <div
            className={`rounded-2xl p-6 shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <PieIcon size={18} className="text-blue-400" /> Financial Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: $${value}`}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1E293B" : "#F8FAFC",
                    border: "none",
                    color: isDark ? "#F1F5F9" : "#0F172A",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Chi tiêu 30 ngày */}
          <div
            className={`col-span-2 rounded-2xl p-6 shadow-lg ${
              isDark ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-400" /> 30-Day Expense Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="day" stroke={isDark ? "#94A3B8" : "#334155"} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1E293B" : "#F8FAFC",
                    border: "none",
                  }}
                />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Giao dịch gần đây --- */}
        <div
          className={`rounded-2xl p-6 shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Link
              to="/transactions"
              className="text-blue-500 text-sm hover:underline"
            >
              See more →
            </Link>
          </div>

          <div className="divide-y divide-gray-700/20">
            {stats.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tx.emoji}</span>
                  <div>
                    <p className="font-medium">{tx.name}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    tx.type === "income"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}${tx.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
