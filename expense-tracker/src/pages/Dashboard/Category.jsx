// Category.jsx
// - ✅ FIXED: Sửa lỗi handleSave (res.category -> res).
// - ✅ FIXED: Thêm check an toàn trong filter để tránh lỗi "reading 'type' of undefined".
// - ✅ UI: Giữ nguyên giao diện.

import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
    PlusCircle, 
    Trash2, 
    Edit, 
    Palette, 
    Smile, 
    AlertTriangle, 
    X,
    Lock 
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
// COMPONENT CARD
// =======================================================
const CategoryCard = ({ category, onEdit, onDelete }) => {
  const isDark = useOutletContext().theme === "dark";
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
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${category.color}30` }}
        >
          <span className="text-3xl">{category.icon || "📁"}</span>
        </div>
        
        <div className="flex gap-2 z-10">
          {isDefault ? (
            <span 
              className="text-xs font-semibold py-1 px-2.5 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1"
              title="Default Category"
            >
              <Lock size={12} /> Default
            </span>
          ) : (
            <>
              <button 
                onClick={() => onEdit(category)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: category.color, backgroundColor: `${category.color}20` }}
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete(category.id)}
                className="p-1.5 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
      
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

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    name: "", type: "income", icon: "💼", color: "#22C55E", user_id: null 
  });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch Categories
  useEffect(() => {
    const token = localStorage.getItem("idToken");
    if (!token) {
      toast.error("Session expired!");
      navigate("/login");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const data = await getCategories(typeFilter);
        // Đảm bảo data luôn là mảng
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [typeFilter, navigate]);

  const openAddModal = () => {
    const isIncome = typeFilter === 'income';
    setEditId(null);
    setForm({
      name: "",
      type: typeFilter,
      icon: isIncome ? "💰" : "💸",
      color: isIncome ? "#22C55E" : "#EF4444",
      user_id: "temp_user_id", // Đánh dấu là user category
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    if (!category.user_id) return; // Không cho sửa Default
    setEditId(category.id);
    setForm(category);
    setShowModal(true);
  };
  
  const closeAllModals = () => {
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }

  // ✅ SỬA LỖI HANDLE SAVE TẠI ĐÂY
  const handleSave = async () => {
    if (!form.name) return toast.error("Please enter category name!");
    
    // Loại bỏ user_id khỏi payload gửi lên (BE tự lấy từ token)
    const { user_id, ...payload } = form; 

    try {
      if (editId) {
        const updated = await updateCategory(editId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        toast.success("Category updated!");
      } else {
        const res = await createCategory(payload);
        
        // 🛠️ FIX: API trả về object category trực tiếp (res), không phải { category: res }
        // Kiểm tra kỹ cấu trúc trả về để add đúng vào mảng
        const newCategory = res.category || res; 

        setCategories((prev) => [...prev, newCategory]);
        toast.success("New category created!");
      }
      closeAllModals();
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save category");
    }
  };

  const initiateDelete = (id) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete && !categoryToDelete.user_id) {
      toast.error("Cannot delete default category!");
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
      toast.success("Category deleted!");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // ✅ SỬA LỖI FILTER: Thêm check (c && c.type) để tránh crash nếu có item lỗi
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c && c.type === typeFilter);
  }, [categories, typeFilter]);

  const activeColorClass = typeFilter === 'income' ? "text-green-500" : "text-red-500";
  const addBtnColor = typeFilter === 'income' ? "bg-green-600 hover:bg-green-500 shadow-green-500/50" : "bg-red-600 hover:bg-red-500 shadow-red-500/50";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white flex items-center gap-3">
            <Palette size={36} className={`transition-colors ${activeColorClass}`} />
            Category Palette
          </h1>
          
          <div className="flex gap-3 items-center">
            <div className={`p-1 rounded-xl flex gap-1 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <button
                onClick={() => setTypeFilter("income")}
                className={`w-32 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  typeFilter === "income" ? "bg-green-500 text-white shadow-md" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                💰 Income
              </button>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`w-32 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  typeFilter === "expense" ? "bg-red-500 text-white shadow-md" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                💸 Expense
              </button>
            </div>
            
            <button
              onClick={openAddModal}
              className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium shadow-lg transition transform hover:scale-105 ${addBtnColor}`}
            >
              <PlusCircle size={18} /> Add New
            </button>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
            <h3 className="text-xl font-semibold mb-6 capitalize">
              {typeFilter} Categories
            </h3>
            {loading ? (
              <p className="text-center text-gray-400 py-10">Loading categories...</p>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-gray-500">No categories found.</p>
                <button onClick={openAddModal} className={`text-sm font-medium ${activeColorClass} mt-2`}>
                  + Create One
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id || Math.random()} // Fallback key nếu id lỗi
                    category={cat}
                    onEdit={openEditModal}
                    onDelete={initiateDelete}
                  />
                ))}
              </div>
            )}
          </div>
      </main>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete Category?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                      Are you sure? Transactions linked to this category will remain but lose their category tag.
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

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeAllModals}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl relative ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <button
                onClick={closeAllModals}
                className={`absolute top-4 right-4 text-gray-400 hover:text-red-500 transition ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
            >
                <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editId ? "Edit Category" : "Add New Category"}
            </h2>

            {(() => {
              const isDefaultItem = editId && !form.user_id;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* CỘT PREVIEW */}
                  <div className="md:col-span-1 flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Preview
                    </label>
                    <div
                      className="w-48 h-32 p-4 rounded-xl border-2 flex flex-col justify-between transition-all"
                      style={{
                        backgroundColor: `${form.color || "#22C55E"}20`,
                        borderColor: form.color || "#22C55E",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${form.color || "#22C55E"}30` }}
                      >
                        <span className="text-2xl">{form.icon || "📁"}</span>
                      </div>
                      <h4 
                        className="text-base font-bold truncate"
                        style={{ color: form.color || "#22C55E" }}
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

                  {/* CỘT FORM */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-lg border outline-none ${
                          isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                        } ${isDefaultItem ? 'opacity-70' : ''}`}
                        readOnly={isDefaultItem} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                        } ${isDefaultItem ? 'opacity-70' : ''}`}
                        disabled={isDefaultItem || !!editId} 
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
                          } ${isDefaultItem ? 'opacity-70 cursor-not-allowed' : ''}`} 
                        >
                          <span className="text-2xl">{form.icon}</span>
                          <Smile size={18} className="text-gray-500" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <button
                          onClick={() => !isDefaultItem && setShowColorPicker(true)}
                          className={`w-full h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${
                            isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                          } ${isDefaultItem ? 'opacity-70 cursor-not-allowed' : ''}`} 
                        >
                          <div 
                            className="w-6 h-6 rounded-full border" 
                            style={{ backgroundColor: form.color || "#22C55E" }} 
                          />
                          <Palette size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>

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

      {/* EMOJI PICKER */}
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

      {/* COLOR PICKER */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowColorPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <SketchPicker
              color={form.color || "#22C55E"}
              onChange={(color) => setForm({ ...form, color: color.hex })}
            />
          </div>
        </div>
      )}
    </div>
  );
}