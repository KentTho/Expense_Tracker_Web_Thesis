import React from "react";
import { SearchX, PlusCircle } from "lucide-react";

export default function TransactionEmptyState({
  title = "No transactions found",
  description = "Try adjusting your filters or add a new entry.",
  actionLabel = "Add transaction",
  onAction,
  isDark,
  icon: Icon = SearchX,
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-fadeIn">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
        isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-300"
      }`}>
        <Icon size={48} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
        {title}
      </h3>
      <p className={`text-sm mb-6 max-w-xs mx-auto ${isDark ? "text-gray-500" : "text-gray-400"}`}>
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 font-medium"
        >
          <PlusCircle size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
