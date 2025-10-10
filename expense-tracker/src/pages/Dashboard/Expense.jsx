import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  Edit,
  Download,
  Calendar,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

export default function Expense() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  // ✅ Mock dữ liệu (sau này thay bằng GET API)
  const [expenses, setExpenses] = useState([
    { id: 1, category: "Food", amount: 25, date: "2025-10-01", emoji: "🍕" },
    { id: 2, category: "Transport", amount: 15, date: "2025-10-02", emoji: "🚗" },
    { id: 3, category: "Rent", amount: 500, date: "2025-10-03", emoji: "🏠" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "", date: "", emoji: "💸" });

  // ✅ Giả lập dữ liệu biểu đồ
  const chartData = expenses.map((e) => ({
    name: e.category,
    amount: e.amount,
  }));

  // ✅ Thêm chi tiêu
  const handleAddExpense = () => {
    if (!form.category || !form.amount || !form.date)
      return alert("Please fill all fields!");
    const newExpense = {
      id: Date.now(),
      ...form,
      amount: Number(form.amount),
    };
    setExpenses([...expenses, newExpense]);
    setShowModal(false);
    setForm({ category: "", amount: "", date: "", emoji: "💸" });
  };

  // ✅ Xóa chi tiêu
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  // ✅ Giả lập xuất Excel
  const handleDownload = () => {
    alert("📊 Download Excel (Expense) from backend API here.");
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
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
            >
              <PlusCircle size={18} />
              Add Expense
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              <Download size={18} />
              Export Excel
            </button>
          </div>
        </div>

        {/* --- Biểu đồ chi tiêu --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Expense Trend Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" stroke={isDark ? "#94A3B8" : "#334155"} />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#1E293B" : "#F8FAFC",
                  border: "none",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: "#F87171" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* --- Danh sách chi tiêu --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Expense Records</h3>
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-sm">No expenses recorded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className={`p-5 rounded-xl flex flex-col justify-between border transition ${
                    isDark
                      ? "bg-[#0f172a] border-gray-700 hover:bg-gray-800"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-3xl">{exp.emoji}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => alert("Edit Expense (PUT API)")}
                        className="text-blue-400 hover:text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mt-2">{exp.category}</h4>
                    <p className="text-red-400 font-bold">
                      -${exp.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={14} /> {exp.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- Modal thêm chi tiêu --- */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md p-6 rounded-2xl shadow-xl transition ${
              isDark ? "bg-[#1f2937]" : "bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Add New Expense</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Emoji</label>
                <input
                  type="text"
                  maxLength={2}
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <button
                onClick={handleAddExpense}
                className="w-full mt-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2"
              >
                <TrendingDown size={18} /> Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
