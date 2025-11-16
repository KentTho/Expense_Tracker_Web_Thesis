// Category.jsx
// - ĐÃ CẬP NHẬT: Tiêu đề "Category Palette" sáng tạo + icon đổi màu.
// - ĐÃ CẬP NHẬT: Ẩn nút Edit/Delete cho mục Default (dựa trên !category.user_id từ BE).
// - ĐÃ CÓ: UI Toggle, Card "Glow", Modal 2 cột, Custom Delete Modal.

import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
    PlusCircle, 
    Trash2, 
    Edit, 
    Palette, // 🎨 Icon cho tiêu đề mới
    Smile, 
    AlertTriangle, 
    X,
    Lock // 🔒 Icon cho các mục Default
} from "lucide-react";
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

// =======================================================
// 💡 COMPONENT CARD MỚI (Đã cập nhật logic !user_id)
// =======================================================
const CategoryCard = ({ category, onEdit, onDelete }) => {
  const isDark = useOutletContext().theme === "dark";
  
  // ✅ KIỂM TRA TẠI ĐÂY: Mục mặc định là mục không có user_id
  const isDefault = !category.user_id;

  return (
    <div
      className={`p-4 rounded-xl shadow-lg border-2 relative overflow-hidden transition-all duration-300 hover:shadow-2xl`}
      style={{
        backgroundColor: isDark ? `${category.color}15` : `${category.color}20`,
        borderColor: `${category.color}90`,
        boxShadow: isDark 
          ? `0 4px 14px 0 ${category.color}30` 
          : `0 4px 14px 0 ${category.color}50`,
      }}
    >
      <div className="flex justify-between items-start">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${category.color}30` }}
        >
          <span className="text-3xl">{category.icon || "📁"}</span>
        </div>
        
        {/* Nút Bấm (CÓ ĐIỀU KIỆN) */}
        <div className="flex gap-2 z-10">
          {isDefault ? (
            <span 
              className="text-xs font-semibold py-1 px-2.5 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1"
              title="Đây là danh mục mặc định, không thể sửa hoặc xóa."
            >
              <Lock size={12} /> Default
            </span>
          ) : (
            <>
              <button 
                onClick={() => onEdit(category)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: category.color, backgroundColor: `${category.color}20` }}
                title="Edit Category"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete(category.id)}
                className="p-1.5 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Delete Category"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Tên danh mục */}
      <h4 
        className="text-lg font-bold mt-4 truncate"
        style={{ color: category.color }}
      >
        {category.name}
      </h4>
      <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{category.type}</p>
    </div>
  );
};


// =======================================================
// COMPONENT CHÍNH
// =======================================================
export default function Category() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate(); 

  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("income");
  const [loading, setLoading] = useState(false);

  // States cho Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  // Form state: Bao gồm cả user_id (sẽ là null cho mục default)
  const [form, setForm] = useState({ 
    name: "", type: "income", icon: "💼", color: "#22C55E", user_id: null 
  });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Lấy dữ liệu
  useEffect(() => {
    const token = localStorage.getItem("idToken");
    if (!token) {
      toast.error("Phiên đăng nhập hết hạn!");
      navigate("/login");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        // API trả về mảng category có dạng: 
        // { id, name, type, icon, color, user_id (nullable) }
        const data = await getCategories(typeFilter);
        setCategories(data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh mục!");
      } finally {
        setLoading(false);
      }
    })();
  }, [typeFilter, navigate]);

  // Mở modal để Thêm
  const openAddModal = () => {
    const isIncome = typeFilter === 'income';
    setEditId(null);
    setForm({
      name: "",
      type: typeFilter,
      icon: isIncome ? "💰" : "💸",
      color: isIncome ? "#22C55E" : "#EF4444",
      user_id: "temp_user_id", // Đánh dấu đây là mục user tự tạo
    });
    setShowModal(true);
  };

  // Mở modal để Sửa
  const openEditModal = (category) => {
    // ✅ Kiểm tra: Không cho edit nếu !user_id
    if (!category.user_id) return; 
    setEditId(category.id);
    setForm(category); // form bây giờ sẽ chứa { ..., user_id: "uuid..." }
    setShowModal(true);
  };
  
  const closeAllModals = () => {
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }

  // Lưu (thêm / cập nhật)
  const handleSave = async () => {
    if (!form.name) return toast.error("Vui lòng nhập tên danh mục!");
    
    // Tách user_id ra khỏi payload gửi đi (backend tự gán user_id)
    const { user_id, ...payload } = form; 

    try {
      if (editId) {
        const updated = await updateCategory(editId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const res = await createCategory(payload);
        setCategories((prev) => [...prev, res.category]);
        toast.success("Thêm danh mục mới thành công!");
      }
      closeAllModals();
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu danh mục!");
    }
  };

  // Logic Xóa danh mục
  const initiateDelete = (id) => {
    // ✅ Kiểm tra: Tìm category trong state để xem user_id
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete && !categoryToDelete.user_id) {
      toast.error("Không thể xóa danh mục mặc định!");
      return;
    }
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Đã xóa danh mục!");
    } catch {
      toast.error("Không thể xóa danh mục!");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Lọc danh sách (Memoized)
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === typeFilter);
  }, [categories, typeFilter]);

  // Màu sắc cho nút Add và Tiêu đề
  const activeColorClass = typeFilter === 'income' 
    ? "text-green-500" 
    : "text-red-500";
  
  const addBtnColor = typeFilter === 'income' 
    ? "bg-green-600 hover:bg-green-500 shadow-green-500/50" 
    : "bg-red-600 hover:bg-red-500 shadow-red-500/50";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* ======================================================= */}
        {/* 💡 HEADER & TIÊU ĐỀ SÁNG TẠO MỚI */}
        {/* ======================================================= */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white flex items-center gap-3">
            {/* Icon đổi màu theo typeFilter */}
            <Palette size={36} className={`transition-colors ${activeColorClass}`} />
            Category Palette
          </h1>
          
          <div className="flex gap-3 items-center">
            {/* 1. Toggle UI */}
            <div className={`p-1 rounded-xl flex gap-1 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <button
                onClick={() => setTypeFilter("income")}
                className={`w-32 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  typeFilter === "income"
                    ? "bg-green-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                💰 Income
              </button>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`w-32 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  typeFilter === "expense"
                    ? "bg-red-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                💸 Expense
              </button>
            </div>
            
            {/* 2. Nút Add */}
            <button
              onClick={openAddModal}
              className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium shadow-lg transition transform hover:scale-105 ${addBtnColor}`}
            >
              <PlusCircle size={18} /> Add New
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 💡 DANH SÁCH CATEGORY (DÙNG CARD MỚI) */}
        {/* ======================================================= */}
        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
            <h3 className="text-xl font-semibold mb-6 capitalize">
              {typeFilter} Categories
            </h3>
            {loading ? (
              <p className="text-center text-gray-400 py-10">Loading categories...</p>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-gray-500">Không có danh mục nào</p>
                <p className="text-gray-400 mb-4">Bắt đầu bằng cách thêm một danh mục mới.</p>
                <button onClick={openAddModal} className={`text-sm font-medium ${activeColorClass}`}>
                  + Thêm ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id || cat.name}
                    category={cat}
                    onEdit={openEditModal}
                    onDelete={initiateDelete}
                  />
                ))}
              </div>
            )}
          </div>
      </main>

      {/* ======================================================= */}
      {/* 🔔 MODAL XÁC NHẬN XÓA */}
      {/* ======================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete Category?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                      Bạn có chắc muốn xóa danh mục này? Mọi giao dịch liên quan có thể bị ảnh hưởng.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/30"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 💡 MODAL THÊM/SỬA (UI 2 CỘT) */}
      {/* ======================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeAllModals}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl relative ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            {/* Nút Close */}
            <button
                onClick={closeAllModals}
                className={`absolute top-4 right-4 text-gray-400 hover:text-red-500 transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
            >
                <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editId ? "Edit Category" : "Add New Category"}
            </h2>

            {/* ✅ Kiểm tra item default (Đang edit VÀ user_id là null) */}
            {(() => {
              const isDefaultItem = editId && !form.user_id;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* CỘT 1: PREVIEW */}
                  <div className="md:col-span-1 flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Preview
                    </label>
                    <div
                      className="w-48 h-32 p-4 rounded-xl border-2 flex flex-col justify-between transition-all"
                      style={{
                        backgroundColor: `${form.color}20`,
                        borderColor: form.color,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${form.color}30` }}
                      >
                        <span className="text-2xl">{form.icon || "📁"}</span>
                      </div>
                      <h4 
                        className="text-base font-bold truncate"
                        style={{ color: form.color }}
                      >
                        {form.name || "Category Name"}
                      </h4>
                    </div>
                    {isDefaultItem && (
                      <span className="text-xs font-semibold py-1 px-2.5 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <Lock size={12} /> Default
                      </span>
                    )}
                  </div>

                  {/* CỘT 2: FORM */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-lg border outline-none ${
                          isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                        } ${isDefaultItem ? 'opacity-70' : ''}`}
                        readOnly={isDefaultItem} // ✅ Khóa
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Loại</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                        } ${isDefaultItem ? 'opacity-70' : ''}`}
                        disabled={isDefaultItem || !!editId} // ✅ Khóa
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Icon</label>
                        <button
                          onClick={() => !isDefaultItem && setShowEmojiPicker(true)}
                          className={`w-full h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                            isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                          } ${isDefaultItem ? 'opacity-70 cursor-not-allowed' : ''}`} // ✅ Khóa
                        >
                          <span className="text-2xl">{form.icon}</span>
                          <Smile size={18} className="text-gray-500" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Màu sắc</label>
                        <button
                          onClick={() => !isDefaultItem && setShowColorPicker(true)}
                          className={`w-full h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                            isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                          } ${isDefaultItem ? 'opacity-70 cursor-not-allowed' : ''}`} // ✅ Khóa
                        >
                          <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: form.color }} />
                          <Palette size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* ✅ Ẩn nút Save nếu là Default */}
                    {!isDefaultItem && (
                      <button
                        onClick={handleSave}
                        className={`w-full mt-4 py-3 rounded-lg text-white font-semibold transition-all ${
                          form.type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                        }`}
                      >
                        {editId ? "Update Category" : "Save Category"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* OVERLAY CHO EMOJI PICKER */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowEmojiPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Picker
              data={emojiData}
              theme={isDark ? "dark" : "light"}
              onEmojiSelect={(emoji) => {
                setForm({ ...form, icon: emoji.native });
                setShowEmojiPicker(false);
              }}
            />
          </div>
        </div>
      )}

      {/* OVERLAY CHO COLOR PICKER */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowColorPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <SketchPicker
              color={form.color}
              onChange={(color) => setForm({ ...form, color: color.hex })}
            />
          </div>
        </div>
      )}
    </div>
  );
}