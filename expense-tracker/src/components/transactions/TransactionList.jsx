import React from "react";
import { format } from "date-fns";
import { Edit, Trash2, Calendar, X, FileText } from "lucide-react";
import TransactionEmptyState from "./TransactionEmptyState";

export default function TransactionList({
  items = [],
  type = "income",
  isDark,
  currencyCode = "USD",
  filterDate,
  setFilterDate,
  onEdit,
  onDelete,
  onItemClick,
  onAdd,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  formatAmount, // optional formatter override
}) {
  const isIncome = type === "income";

  const defaultFormatAmount = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const displayAmount = formatAmount || defaultFormatAmount;

  return (
    <div className={`p-4 sm:p-6 rounded-[2.5rem] shadow-xl flex flex-col h-full transition-all ${
      isDark ? "bg-gray-800" : "bg-white border border-gray-100"
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
          <Calendar size={20} className={isIncome ? "text-emerald-500" : "text-orange-500"} /> 
          Recent {isIncome ? "Incomes" : "Expenses"}
        </h2>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              type="date"
              value={filterDate || ""}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`pl-3 pr-8 py-2 text-xs sm:text-sm rounded-xl border-2 outline-none transition-all focus:ring-4 ${
                isIncome ? "focus:border-emerald-500/50 focus:ring-emerald-500/5" : "focus:border-orange-500/50 focus:ring-orange-500/5"
              } ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
        {items.length === 0 ? (
          <TransactionEmptyState
            isDark={isDark}
            title={emptyTitle || `No ${type}s found`}
            description={emptyDescription || `Start tracking your finances by adding your first ${type}.`}
            actionLabel={emptyActionLabel || `Add ${type}`}
            onAction={onAdd}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick && onItemClick(item)}
                className={`group flex justify-between items-center p-4 rounded-3xl border-2 transition-all ${
                  isDark 
                    ? "bg-gray-700/30 border-transparent hover:border-gray-600 hover:bg-gray-700/60" 
                    : "bg-gray-50 border-transparent hover:border-gray-200 hover:bg-gray-100/50"
                } ${onItemClick ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110 ${
                    isDark ? "bg-gray-800" : "bg-white border border-gray-100"
                  }`}>
                    {item.emoji || item.icon || (isIncome ? '💰' : '💸')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm sm:text-base truncate tracking-tight">
                      {item.category_name || item.category?.name}
                    </p>
                    <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                        isDark ? "bg-gray-900/50 text-gray-400" : "bg-gray-200/50 text-gray-600"
                      }`}>
                        {item.date ? format(new Date(item.date), "dd MMM yyyy") : 'N/A'}
                      </span>
                      {item.note && (
                        <span className="italic truncate max-w-[100px] sm:max-w-[150px] flex items-center gap-1 opacity-70">
                          <FileText size={12}/> {item.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 ml-4">
                  <p className={`font-black text-sm sm:text-lg whitespace-nowrap ${isIncome ? "text-emerald-500" : "text-orange-500"}`}>
                    {isIncome ? "+ " : "- "} {displayAmount(item.amount)}
                  </p>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                      className={`p-2 rounded-xl transition-all ${
                        isDark ? "hover:bg-blue-500/20 text-gray-400 hover:text-blue-400" : "hover:bg-blue-50 text-gray-400 hover:text-blue-500"
                      }`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className={`p-2 rounded-xl transition-all ${
                        isDark ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
