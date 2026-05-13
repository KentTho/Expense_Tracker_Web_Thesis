import React from "react";
import { format } from "date-fns";
import { X, FileText, Calendar, Tag, DollarSign } from "lucide-react";

export default function TransactionDetailModal({
  open,
  item,
  type = "income",
  isDark,
  currencyCode = "USD",
  onClose,
  formatAmount,
}) {
  if (!open || !item) return null;

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
    <div 
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[110] backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`w-full sm:max-w-md rounded-t-[3rem] sm:rounded-[2.5rem] p-8 pb-10 relative animate-slideUp sm:animate-none ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Mobile handle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block"
        >
          <X size={24} className="text-gray-400" />
        </button>

        <div className="text-center mt-6">
          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-5xl shadow-2xl mb-6 transform transition-transform hover:scale-105 ${
            isDark ? "bg-gray-700" : "bg-gray-50 border border-gray-100"
          }`}>
            {item.emoji || item.icon || (isIncome ? '💰' : '💸')}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
            Transaction Details
          </p>
          <h2 className={`text-4xl font-black tracking-tight ${isIncome ? "text-emerald-500" : "text-orange-500"}`}>
            {isIncome ? "+ " : "- "} {displayAmount(item.amount)}
          </h2>
        </div>

        <div className={`mt-10 space-y-1 p-2 rounded-[2rem] ${isDark ? "bg-gray-900/50" : "bg-gray-50/50"}`}>
          <DetailRow 
            icon={<Tag size={18} className="text-gray-400" />} 
            label="Category" 
            value={item.category_name || item.category?.name} 
            isDark={isDark}
          />
          <DetailRow 
            icon={<Calendar size={18} className="text-gray-400" />} 
            label="Date" 
            value={item.date ? format(new Date(item.date), "dd MMMM yyyy") : "N/A"} 
            isDark={isDark}
          />
          <div className="p-4 pt-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={18} className="text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Note</span>
            </div>
            <p className={`text-sm leading-relaxed px-1 ${!item.note && "italic opacity-30"}`}>
              {item.note || "No memo provided for this transaction."}
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 shadow-lg ${
            isDark 
              ? "bg-gray-700 hover:bg-gray-600 text-white" 
              : "bg-gray-900 hover:bg-gray-800 text-white"
          }`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, isDark }) {
  return (
    <div className={`flex justify-between items-center p-4 rounded-2xl ${
      isDark ? "hover:bg-gray-800/50" : "hover:bg-white"
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <span className="font-black text-sm tracking-tight">{value}</span>
    </div>
  );
}
