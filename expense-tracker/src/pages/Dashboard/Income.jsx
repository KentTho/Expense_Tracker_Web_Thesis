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
// ✅ CHỈ GIỮ LẠI getCategories - XÓA getDefaultCategories
import { getCategories } from "../../services/categoryService"; 
import { auth } from "../../components/firebase"; // Sửa đường dẫn theo cấu trúc project của bạn
import { BACKEND_BASE } from "../../services/api"; 

export default function Income() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    category_name: "",
    amount: "",
    date: new Date().toISOString().split('T')[0], // Đặt giá trị mặc định cho ngày
    emoji: "💰",
    category_id: "",
  });

  // ✅ Load dữ liệu từ backend (ĐÃ SỬA LẠI ĐỂ CHỈ GỌI getCategories)
  useEffect(() => {
    (async () => {
      try {
        // ✅ CHỈ GỌI MỘT API: getCategories
        const [incomeData, allCategories] = await Promise.all([
          getIncomes(),
          getCategories("income"), 
        ]);
        setIncomes(incomeData);

        // ✅ Chuẩn hóa đơn giản và giữ lại ID THẬT
        // Đảm bảo c.id là string UUID hợp lệ từ BE
        const normalizedCategories = allCategories.map((c) => ({
          id: c.id, 
          name: c.name,
          icon: c.icon || "📁", 
          color: c.color || "#9CA3AF",
          is_user_category: !!c.user_id, // Nếu user_id là null, đây là Default Category
        }));

        setCategories(normalizedCategories);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu thu nhập hoặc danh mục!");
      }
    })();
  }, []);
  
  // ✅ Tính tổng thu nhập
  const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);

  // ✅ Chuẩn bị dữ liệu cho biểu đồ (Giữ nguyên)
  const barData = incomes.map((i) => ({
    name: i.category_name || "Unknown",
    amount: i.amount,
  }));
  
  // ✅ Thêm / Cập nhật (Giữ nguyên)
  const handleSave = async () => {
    if (!form.amount || !form.date || !form.category_id)
      return toast.error("Vui lòng nhập đầy đủ thông tin!");

    try {
      let updatedList;
      if (editId) {
        const updated = await updateIncome(editId, form);
        updatedList = incomes.map((i) => (i.id === editId ? updated : i));
        toast.success("Cập nhật thành công!");
      } else {
        const created = await createIncome(form);
        updatedList = [...incomes, created];
        toast.success("Thêm thu nhập thành công!");
      }
      setIncomes(updatedList);
      setShowModal(false);
      setEditId(null);
      setForm({ category_name: "", amount: "", date: new Date().toISOString().split('T')[0], emoji: "💰", category_id: "" });
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // ✅ Xóa thu nhập (Giữ nguyên)
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

  // ✅ Xuất Excel (Giữ nguyên)
  const handleDownload = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${BACKEND_BASE}/export/income`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lỗi khi tải file Excel!");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "incomes.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("📂 Đã tải file Excel!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể xuất dữ liệu!");
    }
  };

  const cardBg = isDark ? "bg-[#1e293b]" : "bg-white";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toaster position="top-right" />
      <main className="p-8 space-y-8">
        {/* Header, Biểu đồ, Danh sách (Giữ nguyên) */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Income Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setForm({
                  category_name: "",
                  amount: "",
                  date: new Date().toISOString().split('T')[0],
                  emoji: "💰",
                  category_id: "",
                });
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

        {/* 💵 Tổng Thu Nhập (Total Income Summary - PHẦN MỚI THÊM) */}
        <div
            className={`p-6 rounded-2xl shadow-lg ${cardBg} flex items-center justify-between`}
        >
            <h3 className="text-xl font-semibold flex items-center gap-3">
                <DollarSign size={24} className="text-green-500 p-1 rounded-full bg-green-500/10"/>
                Total Income
            </h3>
            <p className="text-3xl font-bold text-green-500">
                ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>


        {/* Biểu đồ */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${cardBg}`}
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
          className={`p-6 rounded-2xl shadow-lg ${cardBg}`}
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
                          setForm({
                            category_name: inc.category_name || "",
                            amount: inc.amount || "",
                            date: inc.date || "",
                            emoji: inc.emoji || "💰",
                            category_id: inc.category_id || "", 
                          });
                          setShowModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mt-2">{inc.category_name}</h4>
                    <p className="text-green-400 font-bold">
                      +${inc.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={14} />
                      {new Date(inc.date).toLocaleDateString()}
                    </p>
                    {/* Thẻ category cho item trong danh sách (giữ nguyên) */}
                    {/* {inc.category && (
                      <p className="text-sm mt-1">
                        <span className="mr-1">{inc.category.icon}</span>
                        {inc.category.name}
                      </p>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 🪟 Modal Add/Edit Income (Giữ nguyên) */}
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
            {/* 🏷️ Modal Title */}
            <h2 className="text-xl font-semibold mb-4">
              {editId ? "Edit Income Record" : "Add New Income"}
            </h2>

            <div className="space-y-4">
              {/* 💰 Amount Input (Giữ nguyên)*/}
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter income amount"
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              {/* 📅 Date Picker (Giữ nguyên) */}
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              {/* 🗂️ Category Selector (Giữ nguyên) */}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  // Đảm bảo giá trị lựa chọn là ID UUID thật
                  value={form.category_id || ""} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    
                    // Nếu chọn option mặc định (ID trống)
                    if (!selectedId) {
                        return setForm({ ...form, category_id: "", category_name: "", emoji: "💰" });
                    }
                    
                    // ✅ KHẮC PHỤC: Sử dụng String() cho cả hai bên để đảm bảo so sánh chuỗi
                    const found = categories.find((c) => 
                        String(c.id).toLowerCase() === selectedId.toLowerCase()
                    ); 
                    
                    if (found) {
                        setForm({
                            ...form,
                            category_id: found.id,
                            category_name: found.name,
                            emoji: found.icon || "💰",
                            is_user_category: found.is_user_category,
                        });
                    } else {
                        // Vẫn cảnh báo nếu tìm không thấy, nhưng lỗi này không nên xảy ra
                        console.warn("Category not found for ID:", selectedId);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-lg border outline-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <option value="">-- Select Category --</option>
                  {/* Đảm bảo c.id được dùng làm value */}
                  {categories.map((c, idx) => (
                    <option key={c.id || idx} value={c.id}> 
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 😄 Emoji Display (Giữ nguyên) */}
              <div>
                <label className="block text-sm font-medium mb-1">Selected Emoji</label>
                <input
                  type="text"
                  value={form.emoji}
                  readOnly
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-center text-2xl ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-100 border-gray-300"
                  }`}
                />
              </div>

              {/* 💾 Save / Update Button (Giữ nguyên) */}
              <button
                onClick={handleSave} // Sử dụng hàm handleSave đã được định nghĩa
                className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
              >
                <DollarSign size={18} />
                {editId ? "Update Income" : "Save Income"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}