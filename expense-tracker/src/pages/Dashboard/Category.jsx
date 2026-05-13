// Category.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
    PlusCircle, 
    Trash2, 
    Edit, 
    Palette, 
    Smile, 
    X,
    Lock,
    SearchX,
    Loader2,
    CheckCircle2,
    Target,
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

// UI Primitives
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";

// Shared Components
import ConfirmDeleteModal from "../../components/transactions/ConfirmDeleteModal";

// =======================================================
// COMPONENT CARD (Responsive & Optimized)
// =======================================================
const CategoryCard = ({ category, onEdit, onDelete, isDark }) => {
  const isDefault = !category.user_id;

  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border-2 p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isDark ? "bg-slate-900/40" : "bg-white"
      }`}
      style={{
        borderColor: `${category.color}40`,
      }}
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity opacity-20 group-hover:opacity-40"
        style={{ backgroundColor: category.color }}
      />

      <div className="flex justify-between items-start mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: `${category.color}20`, color: category.color }}
        >
          <span className="text-3xl">{category.icon || "📁"}</span>
        </div>
        
        <div className="flex gap-2 z-10">
          {isDefault ? (
            <StatusBadge tone="neutral" icon={Lock} isDark={isDark}>
              System
            </StatusBadge>
          ) : (
            <>
              <button 
                onClick={() => onEdit(category)}
                className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm"
                style={{ color: category.color, backgroundColor: `${category.color}15` }}
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(category.id)}
                className="p-2.5 rounded-xl text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all hover:scale-110 active:scale-95 shadow-sm"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 
            className="text-xl font-black tracking-tight truncate"
            style={{ color: isDark ? "white" : "#1e293b" }}
            title={category.name}
        >
            {category.name}
        </h4>
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {category.type}
            </p>
        </div>
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
      navigate("/login");
      return;
    }

    let isMounted = true;

    const fetchCategoriesSafe = async () => {
      setLoading(true);
      try {
        const data = await getCategories(typeFilter);
        if (isMounted) {
            setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
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

    const toastId = toast.loading(editId ? "Updating category..." : "Creating category...");
    try {
      if (editId) {
        const updated = await updateCategory(editId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        toast.success("Category updated!", { id: toastId });
      } else {
        const res = await createCategory(payload);
        const newCategory = res?.category || res; 
        if (newCategory) {
            setCategories((prev) => [...prev, newCategory]);
            toast.success("Category created!", { id: toastId });
        }
      }
      closeAllModals();
      setEditId(null);
    } catch (err) {
      console.error(err);
      toast.error("Could not save category.", { id: toastId });
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

  // Filter Data (Memoized)
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c && c.type === typeFilter);
  }, [categories, typeFilter]);

  const headerActions = (
    <button
      onClick={openAddModal}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${
        typeFilter === 'income' 
            ? "bg-emerald-500 shadow-emerald-500/25" 
            : "bg-rose-500 shadow-rose-500/25"
      }`}
    >
      <PlusCircle size={18} />
      Create new
    </button>
  );

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />
      
      <PageHeader
        title="Categories"
        subtitle="Manage your income and expense categories with custom icons and colors."
        icon={Palette}
        actions={headerActions}
        isDark={isDark}
        eyebrow="Taxonomy center"
      />

      <SectionCard
        title={`${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Categories`}
        description={`Displaying all categories for ${typeFilter} transactions.`}
        icon={Target}
        isDark={isDark}
        actions={
            <div className={`p-1.5 rounded-2xl flex gap-1 ${isDark ? "bg-slate-950/50" : "bg-slate-100"}`}>
                <button
                    onClick={() => setTypeFilter("income")}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        typeFilter === "income" 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    Income
                </button>
                <button
                    onClick={() => setTypeFilter("expense")}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        typeFilter === "expense" 
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                            : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    Expense
                </button>
            </div>
        }
      >
        {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="animate-spin mb-4 text-cyan-400" size={32} />
                <p className="text-xs font-bold uppercase tracking-[0.2em]">Retrieving list</p>
            </div>
        ) : filteredCategories.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 text-center rounded-[2rem] border-2 border-dashed ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-white shadow-sm"}`}>
                    <SearchX size={32} className="text-slate-400" />
                </div>
                <h4 className="text-lg font-bold">No categories found</h4>
                <p className="text-sm text-slate-400 mt-1 max-w-[240px]">
                    Start by creating your first {typeFilter} category to organize transactions.
                </p>
                <button 
                    onClick={openAddModal} 
                    className={`mt-6 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 ${typeFilter === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                >
                    Create now
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((cat) => (
                    <CategoryCard
                        key={cat.id || Math.random()}
                        category={cat}
                        onEdit={openEditModal}
                        onDelete={initiateDelete}
                        isDark={isDark}
                    />
                ))}
            </div>
        )}
      </SectionCard>

      {/* --- DELETE CONFIRM MODAL --- */}
      {showDeleteModal && (
        <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Delete category"
            message="This will mark linked transactions as 'Uncategorized'. This action is irreversible."
            isDark={isDark}
        />
      )}

      {/* --- CREATE/EDIT MODAL --- */}
      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeAllModals}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 ${
                isDark ? "border-white/10 bg-slate-900" : "border-white bg-white"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-3 ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  <Palette size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black">{editId ? "Edit Category" : "Create Category"}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">Custom classification</p>
                </div>
              </div>
              <button 
                onClick={closeAllModals}
                className={`rounded-full p-2 transition ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-8 custom-scrollbar">
                {(() => {
                    const isDefaultItem = editId && !form.user_id;

                    return (
                        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
                            {/* PREVIEW */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</p>
                                <div
                                    className="flex flex-col items-center justify-center gap-5 rounded-[2.25rem] border-2 aspect-square transition-all duration-500"
                                    style={{
                                        backgroundColor: `${form.color || "#22C55E"}10`,
                                        borderColor: form.color || "#22C55E",
                                    }}
                                >
                                    <div
                                        className="h-20 w-20 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-transform duration-500"
                                        style={{ backgroundColor: `${form.color || "#22C55E"}25`, color: form.color }}
                                    >
                                        <span className="text-5xl">{form.icon || "📁"}</span>
                                    </div>
                                    <div className="text-center px-6">
                                        <h4 className="text-2xl font-black tracking-tight truncate max-w-[180px]" style={{ color: isDark ? "white" : "#1e293b" }}>
                                            {form.name || "Unnamed"}
                                        </h4>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">{form.type}</span>
                                    </div>
                                </div>
                                {isDefaultItem && (
                                    <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl ${isDark ? "bg-amber-400/10 text-amber-400" : "bg-amber-50 text-amber-700"}`}>
                                        <Lock size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">System Category</span>
                                    </div>
                                )}
                            </div>

                            {/* FORM FIELDS */}
                            <div className="space-y-5">
                                <FormField label="Category name" isDark={isDark} required>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Salary, Rent, Groceries"
                                        disabled={isDefaultItem}
                                    />
                                </FormField>

                                <FormField label="Transaction type" isDark={isDark} required>
                                    <div className={`flex p-1 rounded-2xl ${isDark ? "bg-slate-950/60" : "bg-slate-50 border border-slate-100"}`}>
                                        <button
                                            type="button"
                                            disabled={isDefaultItem || !!editId}
                                            onClick={() => setForm({...form, type: 'income', color: '#22C55E', icon: '💰'})}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                form.type === 'income' 
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                                : "text-slate-400"
                                            }`}
                                        >
                                            Income
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDefaultItem || !!editId}
                                            onClick={() => setForm({...form, type: 'expense', color: '#EF4444', icon: '💸'})}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                form.type === 'expense' 
                                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                                                : "text-slate-400"
                                            }`}
                                        >
                                            Expense
                                        </button>
                                    </div>
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Icon" isDark={isDark}>
                                        <button
                                            disabled={isDefaultItem}
                                            onClick={() => setShowEmojiPicker(true)}
                                            className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
                                                isDark ? "border-white/10 bg-slate-950/60 hover:bg-slate-950" : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className="text-2xl">{form.icon}</span>
                                            <Smile size={18} className="text-slate-400" />
                                        </button>
                                    </FormField>

                                    <FormField label="Accent color" isDark={isDark}>
                                        <button
                                            disabled={isDefaultItem}
                                            onClick={() => setShowColorPicker(true)}
                                            className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
                                                isDark ? "border-white/10 bg-slate-950/60 hover:bg-slate-950" : "border-slate-200 bg-white hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="h-6 w-6 rounded-full border-2 border-white/20 shadow-sm" style={{ backgroundColor: form.color }} />
                                            <Palette size={18} className="text-slate-400" />
                                        </button>
                                    </FormField>
                                </div>

                                {!isDefaultItem && (
                                    <button
                                        onClick={handleSave}
                                        className={`w-full mt-4 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                                            form.type === 'income' 
                                                ? "bg-emerald-500 shadow-emerald-500/20" 
                                                : "bg-rose-500 shadow-rose-500/20"
                                        }`}
                                    >
                                        <CheckCircle2 size={18} />
                                        {editId ? "Save changes" : "Confirm creation"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowEmojiPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="shadow-2xl rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-300">
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowColorPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <SketchPicker
              color={form.color || "#22C55E"}
              onChange={(color) => setForm({ ...form, color: color.hex })}
              disableAlpha
            />
            <button
                onClick={() => setShowColorPicker(false)}
                className="mt-6 w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
                Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}