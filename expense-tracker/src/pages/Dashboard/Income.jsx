import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  Edit,
  Download,
  DollarSign,
  Calendar,
  Smile,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

// ✅ Component chính
export default function Income() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  // Mock data (sau này thay bằng GET API)
  const [incomes, setIncomes] = useState([
    { id: 1, source: "Salary", amount: 3500, date: "2025-10-01", emoji: "💼" },
    { id: 2, source: "Freelance", amount: 1200, date: "2025-10-03", emoji: "💻" },
    { id: 3, source: "Investments", amount: 600, date: "2025-10-05", emoji: "📈" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ source: "", amount: "", date: "", emoji: "💰" });

  // ✅ Giả lập API gọi chart data
  const barData = incomes.map((i) => ({
    name: i.source,
    amount: i.amount,
  }));

  // ✅ Xử lý thêm thu nhập
  const handleAddIncome = () => {
    if (!form.source || !form.amount || !form.date) return alert("Please fill all fields!");
    const newIncome = {
      id: Date.now(),
      ...form,
      amount: Number(form.amount),
    };
    setIncomes([...incomes, newIncome]);
    setShowModal(false);
    setForm({ source: "", amount: "", date: "", emoji: "💰" });
  };

  // ✅ Xóa thu nhập
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this income?")) {
      setIncomes(incomes.filter((i) => i.id !== id));
    }
  };

  // ✅ Giả lập xuất Excel
  const handleDownload = () => {
    alert("📊 Download Excel from backend API here.");
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
          <h1 className="text-3xl font-bold">Income Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              <PlusCircle size={18} />
              Add Income
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

        {/* --- Biểu đồ tổng quan --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Income Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke={isDark ? "#94A3B8" : "#334155"} />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#1E293B" : "#F8FAFC",
                  border: "none",
                }}
              />
              <Bar dataKey="amount" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- Danh sách thu nhập --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">Income Records</h3>
          {incomes.length === 0 ? (
            <p className="text-gray-400 text-sm">No incomes recorded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {incomes.map((inc) => (
                <div
                  key={inc.id}
                  className={`p-5 rounded-xl flex flex-col justify-between border transition ${
                    isDark
                      ? "bg-[#0f172a] border-gray-700 hover:bg-gray-800"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-3xl">{inc.emoji}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => alert("Edit function here (PUT API)")}
                        className="text-blue-400 hover:text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mt-2">{inc.source}</h4>
                    <p className="text-green-400 font-bold">
                      +${inc.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={14} /> {inc.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- Modal thêm thu nhập --- */}
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
            <h2 className="text-xl font-semibold mb-4">Add New Income</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Source
                </label>
                <input
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={(e) =>
                    setForm({ ...form, source: e.target.value })
                  }
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
                  name="amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
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
                  name="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  name="emoji"
                  maxLength={2}
                  value={form.emoji}
                  onChange={(e) =>
                    setForm({ ...form, emoji: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              <button
                onClick={handleAddIncome}
                className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2"
              >
                <DollarSign size={18} /> Save Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
