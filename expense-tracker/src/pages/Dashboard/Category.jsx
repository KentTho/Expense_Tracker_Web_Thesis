import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PlusCircle, Trash2, Edit, Palette } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { SketchPicker } from "react-color";


export default function Category() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("income");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "income", icon: "💼", color: "#22C55E" });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);



  useEffect(() => {
  const token = localStorage.getItem("idToken");
  if (!token) {
    toast.error("Phiên đăng nhập hết hạn!");
    navigate("/login");
    return;
  }

  (async () => {
    try {
      const data = await getCategories(typeFilter);
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh mục!");
    }
  })();
}, [typeFilter]);




  // ✅ Lưu (thêm / cập nhật)
  const handleSave = async () => {
    if (!form.name) return toast.error("Vui lòng nhập tên danh mục!");
    try {
      if (editId) {
        const updated = await updateCategory(editId, form);
        setCategories((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const res = await createCategory(form);
        setCategories((prev) => [...prev, res.category]);
        toast.success("Thêm danh mục mới thành công!");
      }
      setShowModal(false);
      setForm({ name: "", type: "income", icon: "💼", color: "#22C55E" });
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu danh mục!");
    }
  };

  // ❌ Xóa danh mục
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa danh mục này?")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Đã xóa danh mục!");
    } catch {
      toast.error("Không thể xóa danh mục!");
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-right" />
      <main className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Category Management</h1>
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 text-white" : "bg-white"}`}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              onClick={() => {
                setShowModal(true);
                setEditId(null);
                setForm({ name: "", type: typeFilter, icon: "💼", color: "#22C55E" });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              <PlusCircle size={18} /> Add Category
            </button>
          </div>
        </div>

        {/* Danh sách danh mục */}
        <div className={`p-6 rounded-2xl shadow-lg ${isDark ? "bg-[#1e293b]" : "bg-white"}`}>
          <h3 className="text-lg font-semibold mb-4">List of {typeFilter} Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-400">Chưa có danh mục nào.</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 rounded-xl border flex flex-col justify-between transition"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    borderColor: cat.color,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-3xl" style={{ color: cat.color }}>
                      {cat.icon || "📁"}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditId(cat.id);
                          setForm(cat);
                          setShowModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold mt-2">{cat.name}</h4>
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
              {editId ? "Edit Category" : "Add New Category"}
            </h2>
            <div className="space-y-4">
              {/* Name */}
    <div>
      <label className="block text-sm font-medium mb-1">Tên danh mục</label>
      <input
        type="text"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={`w-full px-3 py-2 rounded-lg border outline-none ${
          isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"
        }`}
      />
    </div>
    {/* Icon Picker */}
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Chọn Icon</label>
      <div
        className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      >
        <span className="text-2xl">{form.icon || "😀"}</span>
        <span className="text-gray-500 text-sm">Chọn emoji</span>
      </div>

      {showEmojiPicker && (
        <div className="absolute z-50 mt-2">
          <Picker
            data={emojiData}
            theme={isDark ? "dark" : "light"}
            onEmojiSelect={(emoji) => {
              setForm({ ...form, icon: emoji.native });
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}
    </div>

    {/* Color Picker */}
    <div className="relative mt-4">
      <label className="block text-sm font-medium mb-1">Chọn màu</label>
      <div
        className="w-10 h-10 rounded-full border cursor-pointer"
        style={{ backgroundColor: form.color }}
        onClick={() => setShowColorPicker(!showColorPicker)}
      />

      {showColorPicker && (
        <div className="absolute z-50 mt-2">
          <SketchPicker
            color={form.color}
            onChange={(color) => setForm({ ...form, color: color.hex })}
          />
        </div>
      )}
    </div>

                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"
                    }`}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <button
                    onClick={handleSave}
                    className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {editId ? "Update Category" : "Save Category"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
}
