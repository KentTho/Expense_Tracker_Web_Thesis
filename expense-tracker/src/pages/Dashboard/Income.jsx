import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  PlusCircle,
  Trash2,
  Edit,
  Download,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../../services/incomeService";

export default function Income() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [incomes, setIncomes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ source: "", amount: "", date: "", emoji: "💰" });
  const [editId, setEditId] = useState(null);

  // ✅ Load dữ liệu từ backend
  useEffect(() => {
    (async () => {
      try {
        const data = await getIncomes();
        setIncomes(data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách thu nhập!");
      }
    })();
  }, []);

  const barData = incomes.map((i) => ({ name: i.source, amount: i.amount }));

  // ✅ Thêm hoặc cập nhật
  const handleSave = async () => {
    if (!form.source || !form.amount || !form.date)
      return toast.error("Vui lòng nhập đầy đủ thông tin!");

    try {
      if (editId) {
        const updated = await updateIncome(editId, form);
        setIncomes((prev) =>
          prev.map((i) => (i.id === editId ? updated : i))
        );
        toast.success("Cập nhật thành công!");
      } else {
        const created = await createIncome(form);
        setIncomes([...incomes, created]);
        toast.success("Thêm thu nhập thành công!");
      }
      setForm({ source: "", amount: "", date: "", emoji: "💰" });
      setEditId(null);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // ✅ Xóa thu nhập
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa?")) return;
    try {
      await deleteIncome(id);
      setIncomes(incomes.filter((i) => i.id !== id));
      toast.success("Đã xóa!");
    } catch {
      toast.error("Không thể xóa!");
    }
  };

  const handleDownload = () => toast("📊 Gọi API tải Excel tại đây.");

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toaster position="top-right" />
      <main className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Income Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setForm({ source: "", amount: "", date: "", emoji: "💰" });
                setEditId(null);
                setShowModal(true);
              }}
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

        {/* Biểu đồ */}
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

        {/* Danh sách */}
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
                        onClick={() => {
                          setEditId(inc.id);
                          setForm(inc);
                          setShowModal(true);
                        }}
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
              isDark ? "bg-[#1f2937]" : "bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              {editId ? "Edit Income" : "Add New Income"}
            </h2>
            <div className="space-y-4">
              {["source", "amount", "date", "emoji"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    type={field === "amount" ? "number" : field === "date" ? "date" : "text"}
                    name={field}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border outline-none ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-gray-100 border-gray-300"
                    }`}
                  />
                </div>
              ))}
              <button
                onClick={handleSave}
                className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
              >
                <DollarSign size={18} /> {editId ? "Update" : "Save"} Income
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
