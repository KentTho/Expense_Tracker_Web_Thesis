// Category.jsx

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
    Lock,
    SearchX,
    Loader2
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
// COMPONENT CARD (Responsive & Optimized)
// =======================================================
const CategoryCard = ({ category, onEdit, onDelete }) => {
  const isDark = useOutletContext().theme === "dark";
  const isDefault = !category.user_id;

  return (
    <div
      className={`p-4 rounded-2xl border-2 relative overflow-hidden transition-all duration-300 hover:shadow-xl group`}
      style={{
        backgroundColor: isDark ? `${category.color}10` : `${category.color}15`,
        borderColor: `${category.color}60`,
      }}
    >
      <div className="flex justify-between items-start">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${category.color}30` }}
        >
          <span className="text-2xl sm:text-3xl">{category.icon || "📁"}</span>
        </div>
        
        <div className="flex gap-2 z-10">
          {isDefault ? (
            <span 
              className="text-[10px] sm:text-xs font-bold py-1 px-2.5 rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1 opacity-80"
              title="Default System Category"
            >
              <Lock size={12} /> <span className="hidden sm:inline">Default</span>
            </span>
          ) : (
            <>
              <button 
                onClick={() => onEdit(category)}
                className="p-2 rounded-full transition-colors hover:brightness-90"
                style={{ color: category.color, backgroundColor: `${category.color}20` }}
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(category.id)}
                className="p-2 rounded-full text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <h4 
            className="text-lg font-bold truncate"
            style={{ color: category.color }}
            title={category.name}
        >
            {category.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide opacity-70">
            {category.type}
        </p>
      </div>
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
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ 
    name: "", type: "income", icon: "💼", color: "#22C55E", user_id: null 
  });
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- 1. SILENT FETCH CATEGORIES ---
  useEffect(() => {
    const token = localStorage.getItem("idToken");
    if (!token) {
      // Chỉ redirect login, không toast error gây khó chịu
      navigate("/login");
      return;
    }

    let isMounted = true;

    const fetchCategoriesSafe = async () => {
      setLoading(true);
      try {
        const data = await getCategories(typeFilter);
        if (isMounted) {
            // Luôn đảm bảo là mảng, nếu null/undefined thì là mảng rỗng
            setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        // Silent Fail: Log warning thay vì Toast Error
        console.warn("Category fetch silent fail:", err);
        if (isMounted) setCategories([]); 
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoriesSafe();

    return () => { isMounted = false; };
  }, [typeFilter, navigate]);

  // Modal Handlers
  const openAddModal = () => {
    const isIncome = typeFilter === 'income';
    setEditId(null);
    setForm({
      name: "",
      type: typeFilter,
      icon: isIncome ? "💰" : "💸",
      color: isIncome ? "#22C55E" : "#EF4444",
      user_id: "temp_user_id", 
    });
    setShowModal(true);
  };

  const openEditModal = (category) => {
    if (!category.user_id) return; 
    setEditId(category.id);
    setForm(category);
    setShowModal(true);
  };
  
  const closeAllModals = () => {
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  }

  // Save Handler
  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Category name is required!");
    
    const { user_id, ...payload } = form; 

    try {
      if (editId) {
        const updated = await updateCategory(editId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        toast.success("Category updated successfully!");
      } else {
        const res = await createCategory(payload);
        // Kiểm tra an toàn response
        const newCategory = res?.category || res; 
        if (newCategory) {
            setCategories((prev) => [...prev, newCategory]);
            toast.success("New category created!");
        }
      }
      closeAllModals();
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Could not save category. Please try again.");
    }
  };

  // Delete Handlers
  const initiateDelete = (id) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete && !categoryToDelete.user_id) {
      toast.error("Default categories cannot be deleted.");
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
      toast.success("Category deleted.");
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Filter Data (Memoized for performance)
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c && c.type === typeFilter);
  }, [categories, typeFilter]);

  // UI Styles Helper
  const activeColorClass = typeFilter === 'income' ? "text-green-500" : "text-red-500";
  const addBtnColor = typeFilter === 'income' 
    ? "bg-green-600 hover:bg-green-500 shadow-green-500/30" 
    : "bg-red-600 hover:bg-red-500 shadow-red-500/30";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* --- HEADER RESPONSIVE --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                <Palette size={32} className={`transition-colors ${activeColorClass}`} />
                Categories
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                Manage your income and expense categories.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className={`p-1 rounded-xl flex gap-1 w-full sm:w-auto ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <button
                onClick={() => setTypeFilter("income")}
                className={`flex-1 sm:flex-none w-full sm:w-32 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  typeFilter === "income" ? "bg-green-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                💰 Income
              </button>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`flex-1 sm:flex-none w-full sm:w-32 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  typeFilter === "expense" ? "bg-red-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                💸 Expense
              </button>
            </div>
            
            <button
              onClick={openAddModal}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${addBtnColor}`}
            >
              <PlusCircle size={20} /> <span className="md:hidden lg:inline">Create New</span>
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT CARD --- */}
        <div className={`p-6 rounded-2xl shadow-xl min-h-[400px] ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
            <h3 className="text-xl font-bold mb-6 capitalize flex items-center gap-2">
               <span className={activeColorClass}>●</span> {typeFilter} Categories
            </h3>
            
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="animate-spin mb-3 text-blue-500" size={40} />
                  <p>Loading categories...</p>
               </div>
            ) : filteredCategories.length === 0 ? (
              // --- EMPTY STATE ĐẸP MẮT ---
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <SearchX size={40} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-600 dark:text-gray-300">No Categories Found</h4>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto text-sm">
                  You haven't created any {typeFilter} categories yet.
                </p>
                <button 
                    onClick={openAddModal} 
                    className={`mt-6 px-6 py-2 rounded-full font-semibold text-sm text-white shadow-md transition-transform hover:scale-105 ${typeFilter === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  Create First Category
                </button>
              </div>
            ) : (
              // --- GRID LAYOUT ---
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id || Math.random()}
                    category={cat}
                    onEdit={openEditModal}
                    onDelete={initiateDelete}
                  />
                ))}
              </div>
            )}
          </div>
      </main>

      {/* --- DELETE CONFIRM MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-fadeIn">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 animate-bounce-short">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete Category?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                      Transactions linked to this category will be marked as "Uncategorized". This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- CREATE/EDIT MODAL --- */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={closeAllModals}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl p-6 sm:p-8 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <button
                onClick={closeAllModals}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
            >
                <X size={24} />
            </button>

            <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 text-center sm:text-left">
              {editId ? "Edit Category" : "Create New Category"}
            </h2>

            {(() => {
              const isDefaultItem = editId && !form.user_id;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* CỘT PREVIEW */}
                  <div className="md:col-span-1 flex flex-col items-center">
                    <label className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">
                      Live Preview
                    </label>
                    <div
                      className="w-full aspect-square md:w-48 md:h-48 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300"
                      style={{
                        backgroundColor: `${form.color || "#22C55E"}15`,
                        borderColor: form.color || "#22C55E",
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${form.color || "#22C55E"}30` }}
                      >
                        <span className="text-4xl">{form.icon || "📁"}</span>
                      </div>
                      <div className="text-center px-4">
                        <h4 
                            className="text-lg font-bold truncate max-w-[150px]"
                            style={{ color: form.color || "#22C55E" }}
                        >
                            {form.name || "Category Name"}
                        </h4>
                        <span className="text-xs text-gray-400 font-medium uppercase">{form.type}</span>
                      </div>
                    </div>
                    {isDefaultItem && (
                      <div className="mt-4 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 rounded-lg text-xs font-medium flex items-center gap-2">
                         <Lock size={14} /> System Default
                      </div>
                    )}
                  </div>

                  {/* CỘT FORM */}
                  <div className="md:col-span-2 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Category Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Salary, Groceries..."
                        className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900"
                        } ${isDefaultItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                        readOnly={isDefaultItem} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Category Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => !isDefaultItem && !editId && setForm({...form, type: 'income', color: '#22C55E', icon: '💰'})}
                            disabled={isDefaultItem || !!editId}
                            className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                                form.type === 'income' 
                                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                                : 'border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Income
                        </button>
                        <button
                             type="button"
                             onClick={() => !isDefaultItem && !editId && setForm({...form, type: 'expense', color: '#EF4444', icon: '💸'})}
                             disabled={isDefaultItem || !!editId}
                             className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                                 form.type === 'expense' 
                                 ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                                 : 'border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                             }`}
                        >
                            Expense
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Icon</label>
                        <button
                          onClick={() => !isDefaultItem && setShowEmojiPicker(true)}
                          disabled={isDefaultItem}
                          className={`w-full h-12 flex items-center justify-between px-4 rounded-xl border transition-all ${
                            isDark ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } ${isDefaultItem ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        >
                          <span className="text-2xl">{form.icon}</span>
                          <Smile size={20} className="text-gray-400" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Color Tag</label>
                        <button
                          onClick={() => !isDefaultItem && setShowColorPicker(true)}
                          disabled={isDefaultItem}
                          className={`w-full h-12 flex items-center justify-between px-4 rounded-xl border transition-all ${
                            isDark ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } ${isDefaultItem ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        >
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white/20 shadow-sm" 
                            style={{ backgroundColor: form.color || "#22C55E" }} 
                          />
                          <Palette size={20} className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {!isDefaultItem && (
                      <button
                        onClick={handleSave}
                        className={`w-full mt-6 py-3.5 rounded-xl text-white font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${
                          form.type === 'income' 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30'
                        }`}
                      >
                        {editId ? "Save Changes" : "Create Category"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowEmojiPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="shadow-2xl rounded-xl overflow-hidden animate-scaleIn">
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

      {/* COLOR PICKER POPUP */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowColorPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-4 rounded-2xl shadow-2xl animate-scaleIn">
            <SketchPicker
              color={form.color || "#22C55E"}
              onChange={(color) => setForm({ ...form, color: color.hex })}
              disableAlpha
            />
          </div>
        </div>
      )}
    </div>
  );
}