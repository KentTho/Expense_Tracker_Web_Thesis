// pages/AdminDefaultCategories.jsx (ĐÃ SỬA: KẾT NỐI API THẬT)
import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
    PlusCircle, Trash2, Edit, Palette, Smile, AlertTriangle, X, Shield, Loader2, Save 
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  adminGetDefaultCategories,
  // ✅ IMPORT CÁC HÀM API THẬT
  adminCreateDefaultCategory,
  adminUpdateDefaultCategory,
  adminDeleteDefaultCategory
} from "../services/adminService";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { SketchPicker } from "react-color";

// Component Card (Giữ nguyên)
const CategoryCard = ({ category, onEdit, onDelete }) => {
  const isDark = useOutletContext().theme === "dark";
  return (
    <div
      className={`p-4 rounded-xl shadow-lg border-2 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]`}
      style={{
        backgroundColor: isDark ? `${category.color}15` : `${category.color}20`,
        borderColor: `${category.color}90`,
        boxShadow: isDark ? `0 4px 14px 0 ${category.color}30` : `0 4px 14px 0 ${category.color}50`,
      }}
    >
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-inner" style={{ backgroundColor: `${category.color}30` }}>
          <span className="text-3xl">{category.icon || "📁"}</span>
        </div>
        <div className="flex gap-2 z-10">
            <button onClick={() => onEdit(category)} className="p-1.5 rounded-full transition-colors" style={{ color: category.color, backgroundColor: `${category.color}20` }} title="Edit Category">
                <Edit size={18} />
            </button>
            <button onClick={() => onDelete(category.id)} className="p-1.5 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Delete Category">
                <Trash2 size={18} />
            </button>
        </div>
      </div>
      <h4 className="text-lg font-bold mt-4 truncate" style={{ color: category.color }}>
        {category.name}
      </h4>
      <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{category.type}</p>
    </div>
  );
};

// Component Chính
export default function AdminDefaultCategories() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate(); 

  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("income");
  const [loading, setLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ State cho nút Save/Delete

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "income", icon: "💼", color: "#22C55E" });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Hàm fetchData (Giữ nguyên)
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminGetDefaultCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Could not load default categories!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    // ... (Giữ nguyên)
    const isIncome = typeFilter === 'income';
    setEditId(null);
    setForm({
      name: "", type: typeFilter,
      icon: isIncome ? "💰" : "💸",
      color: isIncome ? "#22C55E" : "#EF4444",
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    // ... (Giữ nguyên)
    setEditId(category.id);
    setForm(category);
    setShowModal(true);
  };
  
  const closeAllModals = () => {
    // ... (Giữ nguyên)
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }

  // =============================================
  // ✅ HÀM SAVE (ĐÃ SỬA)
  // =============================================
  const handleSave = async () => {
    if (!form.name) return toast.error("Category name is required!");
    
    setIsSubmitting(true);
    const payload = { 
        name: form.name, 
        type: form.type, 
        icon: form.icon, 
        color: form.color 
    };

    try {
      if (editId) {
        // --- LOGIC UPDATE ---
        const updatedCategory = await adminUpdateDefaultCategory(editId, payload);
        // Cập nhật state (giao diện)
        setCategories(categories.map(c => (c.id === editId ? updatedCategory : c)));
        toast.success("Default category updated!");
      } else {
        // --- LOGIC CREATE ---
        const newCategory = await adminCreateDefaultCategory(payload);
        // Cập nhật state (giao diện)
        setCategories([...categories, newCategory]);
        toast.success("Default category created!");
      }
      closeAllModals();
      setEditId(null);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  // =============================================
  // ✅ HÀM DELETE (ĐÃ SỬA)
  // =============================================
  const initiateDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await adminDeleteDefaultCategory(deleteId);
      // Cập nhật state (giao diện)
      setCategories(categories.filter(c => c.id !== deleteId));
      toast.success("Default category deleted.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // --- (Phần còn lại giữ nguyên) ---
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === typeFilter);
  }, [categories, typeFilter]);

  const addBtnColor = typeFilter === 'income' 
    ? "bg-green-600 hover:bg-green-500 shadow-green-500/50" 
    : "bg-red-600 hover:bg-red-500 shadow-red-500/50";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header & Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <Shield className="text-purple-500" size={36} />
            Default Categories
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

        {/* Danh sách danh mục */}
        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
            <h3 className="text-xl font-semibold mb-6 capitalize">
              Shared {typeFilter} Categories
            </h3>
            {loading ? (
              <p className="text-center text-gray-400 py-10">Loading categories...</p>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold text-gray-500">No default categories found.</p>
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

      {/* MODAL XÁC NHẬN XÓA (Cập nhật nút) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete Category?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                      Are you sure? This will affect all users who use this category.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setShowDeleteModal(false)} disabled={isSubmitting} className={`flex-1 py-2.5 rounded-lg font-medium ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} disabled:opacity-50`}>
                            Cancel
                        </button>
                        <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 flex justify-center">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA (Cập nhật nút) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={closeAllModals}>
          <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-2xl p-6 rounded-2xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <button onClick={closeAllModals} className={`absolute top-4 right-4 text-gray-400 hover:text-red-500`}><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6">{editId ? "Edit Default Category" : "Add Default Category"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 flex flex-col items-center">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</label>
                <div className="w-48 h-32 p-4 rounded-xl border-2 flex flex-col justify-between" style={{ backgroundColor: `${form.color}20`, borderColor: form.color }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${form.color}30` }}>
                    <span className="text-2xl">{form.icon || "📁"}</span>
                  </div>
                  <h4 className="text-base font-bold truncate" style={{ color: form.color }}>
                    {form.name || "Category Name"}
                  </h4>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full px-3 py-2.5 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`w-full px-3 py-2.5 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`} disabled={!!editId}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <button onClick={() => setShowEmojiPicker(true)} className={`w-full h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}>
                      <span className="text-2xl">{form.icon}</span> <Smile size={18} className="text-gray-500" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <button onClick={() => setShowColorPicker(true)} className={`w-full h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}>
                      <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: form.color }} /> <Palette size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={isSubmitting}
                  className={`w-full mt-4 py-3 rounded-lg text-white font-semibold transition-all flex justify-center items-center ${form.type === 'income' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} disabled:opacity-50`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (editId ? <Save size={18} className="mr-2"/> : <PlusCircle size={18} className="mr-2"/>)}
                  {editId ? "Update Category" : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY CHO EMOJI PICKER (Giữ nguyên) */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowEmojiPicker(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Picker data={emojiData} theme={isDark ? "dark" : "light"} onEmojiSelect={(emoji) => { setForm({ ...form, icon: emoji.native }); setShowEmojiPicker(false); }} />
          </div>
        </div>
      )}

      {/* OVERLAY CHO COLOR PICKER (Giữ nguyên) */}
      {showColorPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowColorPicker(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <SketchPicker color={form.color} onChange={(color) => setForm({ ...form, color: color.hex })} />
          </div>
        </div>
      )}
    </div>
  );
}