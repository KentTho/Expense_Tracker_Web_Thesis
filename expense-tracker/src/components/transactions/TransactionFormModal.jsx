import React from "react";
import { X, DollarSign, Calendar, FileText, ChevronDown } from "lucide-react";

export default function TransactionFormModal({
  open,
  mode = "create",
  type = "income",
  form,
  setForm,
  categories = [],
  onSubmit,
  onClose,
  isDark,
  currencyCode = "USD",
  title,
  submitLabel,
}) {
  if (!open) return null;

  const isEdit = mode === "edit";
  const isIncome = type === "income";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      const re = /^\d*\.?\d*$/;
      if (value === '' || re.test(value)) {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const selectedCategory = categories.find(c => String(c.id) === String(categoryId));
    setForm(prev => ({ 
      ...prev, 
      category_id: categoryId,
      category_name: selectedCategory ? selectedCategory.name : "",
      emoji: selectedCategory ? (selectedCategory.icon || selectedCategory.emoji) : prev.emoji || "💰",
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[95vh] overflow-y-auto custom-scrollbar ${
        isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      }`}>
        
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
            isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
          }`}
        >
          <X size={24} />
        </button>

        <div className="mb-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            isIncome ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          }`}>
            <DollarSign size={32} />
          </div>
          <h3 className="text-3xl font-black tracking-tight">
            {title || (isEdit ? `Edit ${type}` : `Add ${type}`)}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {isEdit ? "Update your transaction details below." : "Enter the details of your new transaction."}
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
                Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  {currencyCode}
                </div>
                <input
                  type="number"
                  name="amount" 
                  id="amount"
                  value={form.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0.01"
                  step="any"
                  autoFocus
                  className={`w-full pl-14 pr-4 py-4 rounded-2xl border-2 outline-none transition-all focus:ring-4 ${
                    isIncome 
                      ? "focus:border-emerald-500 focus:ring-emerald-500/10" 
                      : "focus:border-orange-500 focus:ring-orange-500/10"
                  } ${
                    isDark ? "bg-gray-900/50 border-gray-700 text-white" : "bg-gray-50 border-gray-100"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="date" className="block text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="date" 
                  id="date"
                  value={form.date}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all focus:ring-4 ${
                    isIncome 
                      ? "focus:border-emerald-500 focus:ring-emerald-500/10" 
                      : "focus:border-orange-500 focus:ring-orange-500/10"
                  } ${
                    isDark ? "bg-gray-900/50 border-gray-700 text-white" : "bg-gray-50 border-gray-100"
                  }`}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
              Category
            </label>
            <div className="relative">
              <select
                value={form.category_id || ""}
                onChange={handleCategoryChange}
                className={`w-full px-4 py-4 pr-10 rounded-2xl border-2 outline-none appearance-none transition-all focus:ring-4 ${
                  isIncome 
                    ? "focus:border-emerald-500 focus:ring-emerald-500/10" 
                    : "focus:border-orange-500 focus:ring-orange-500/10"
                } ${
                  isDark ? "bg-gray-900/50 border-gray-700 text-white" : "bg-gray-50 border-gray-100"
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}> 
                    {c.icon || c.emoji ? `${c.icon || c.emoji} ` : ""}{c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
              Note (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
              <textarea
                name="note"
                value={form.note || ""}
                onChange={handleInputChange}
                placeholder="Add a memo..."
                rows={3}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none resize-none transition-all focus:ring-4 ${
                  isIncome 
                    ? "focus:border-emerald-500 focus:ring-emerald-500/10" 
                    : "focus:border-orange-500 focus:ring-orange-500/10"
                } ${
                  isDark ? "bg-gray-900/50 border-gray-700 text-white" : "bg-gray-50 border-gray-100"
                }`}
              />
            </div>
          </div>

          <button
            onClick={onSubmit}
            className={`w-full mt-4 py-5 rounded-[1.5rem] text-white font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isIncome 
                ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20" 
                : "bg-orange-500 hover:bg-orange-400 shadow-orange-500/20"
            }`}
          >
            {submitLabel || (isEdit ? `Update ${isIncome ? 'Income' : 'Expense'}` : `Save ${isIncome ? 'Income' : 'Expense'}`)}
          </button>
        </div>
      </div>
    </div>
  );
}
