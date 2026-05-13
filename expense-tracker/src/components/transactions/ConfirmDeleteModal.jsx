import React from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteModal({
  open,
  title = "Delete Transaction?",
  description = "This action cannot be undone. Are you sure you want to proceed?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDark,
  tone = "danger", // 'income' | 'expense' | 'danger'
}) {
  if (!open) return null;

  const toneConfig = {
    danger: {
      bg: "bg-red-100 dark:bg-red-900/30",
      icon: "text-red-600 dark:text-red-500",
      button: "bg-red-600 hover:bg-red-500 shadow-red-500/30",
    },
    income: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      icon: "text-emerald-600 dark:text-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30",
    },
    expense: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      icon: "text-orange-600 dark:text-orange-500",
      button: "bg-orange-600 hover:bg-orange-500 shadow-orange-500/30",
    }
  };

  const config = toneConfig[tone] || toneConfig.danger;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse ${config.bg}`}>
            <Trash2 className={config.icon} size={32} />
          </div>
          
          <h3 className="text-2xl font-black mb-2 tracking-tight">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm px-2">
            {description}
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className={`flex-1 py-3.5 rounded-2xl font-bold transition-all active:scale-95 ${
                isDark 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${config.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
