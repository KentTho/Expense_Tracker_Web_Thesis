// pages/AdminAuditLogs.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    FileText, AlertCircle, CheckCircle2, RefreshCw, Search, Terminal, SearchX, Loader2,
    User, Target, Clock, ShieldAlert, Zap, LifeBuoy
} from "lucide-react";
import { adminGetAuditLogs } from "../services/adminService";
import { toast, Toaster } from "react-hot-toast";

// Helper format thời gian
const formatDateTime = (isoString) => {
    try {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return isoString; }
};

export default function AdminAuditLogs() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // --- FETCH DATA ---
  const fetchLogs = async () => {
    setLoading(true);
    try {
        const data = await adminGetAuditLogs(100);
        setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
        console.warn("Logs fetch fail:", error);
        setLogs([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    const lowerFilter = filter.toLowerCase();
    return logs.filter(log => 
        (log.action || "").toLowerCase().includes(lowerFilter) ||
        (log.target || "").toLowerCase().includes(lowerFilter) ||
        (log.actor_email || "").toLowerCase().includes(lowerFilter)
    );
  }, [logs, filter]);

  // --- COMPONENT: STATUS BADGE ---
  const StatusBadge = ({ status }) => (
    status === "SUCCESS" || status === "PENDING" ? ( // PENDING của SOS cũng tính là OK để hiển thị
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <CheckCircle2 size={12} /> OK
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle size={12} /> ERR
        </span>
    )
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-right" />
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-4 pt-4">
        <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-3">
                <Terminal className="text-purple-500" size={28} />
                System Activity
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">Monitor system events & security.</p>
        </div>
        <button onClick={fetchLogs} className={`w-full md:w-auto px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 font-medium shadow-sm active:scale-95 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700" : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"}`}>
            <RefreshCw size={16} className={loading ? "animate-spin text-purple-500" : ""} /> Refresh
        </button>
      </div>

      {/* --- SEARCH --- */}
      <div className="px-4 mb-6">
        <div className={`p-2 rounded-xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search logs..." value={filter} onChange={(e) => setFilter(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg bg-transparent outline-none transition-all placeholder-gray-400 text-sm ${isDark ? "text-white" : "text-gray-900"}`} />
            </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="px-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500"><Loader2 className="animate-spin mb-2 text-purple-500" size={32} /><p className="text-sm">Loading data...</p></div>
        ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 opacity-70"><SearchX size={48} className="mb-2" /><p className="font-medium">No logs found.</p></div>
        ) : (
            <>
                {/* 📱 MOBILE VIEW: CARDS (Responsive & Styled) */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredLogs.map((log) => {
                        // 🔥 LOGIC KIỂM TRA SOS (QUAN TRỌNG)
                        const isSOS = log.action === "SOS_REQUEST";
                        
                        return (
                            <div key={log.id} 
                                className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden transition-all
                                ${isSOS 
                                    // 🎨 Style cho SOS: Nền đỏ, Viền đỏ, Shadow đỏ
                                    ? (isDark ? "bg-red-900/20 border-red-500/50 shadow-red-900/20" : "bg-red-50 border-red-200 shadow-red-100") 
                                    // 🎨 Style thường
                                    : (isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")
                                }`}
                            >
                                {/* Dải màu trang trí bên trái */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                                    ${isSOS 
                                        ? "bg-red-500 animate-pulse"  // SOS nhấp nháy
                                        : (log.status === 'SUCCESS' ? 'bg-green-500' : 'bg-orange-500')}
                                `}></div>

                                {/* Header Card */}
                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {isSOS && <LifeBuoy size={16} className="text-red-500 animate-bounce" />} {/* Icon Phao cứu sinh */}
                                            <h3 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-2
                                                ${isSOS ? "text-red-600 dark:text-red-400" : "text-purple-500"}
                                            `}>
                                                {log.action}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <Clock size={10} /> {formatDateTime(log.created_at)}
                                        </div>
                                    </div>
                                    
                                    {/* Badge Status (SOS thì hiện thẻ KHẨN CẤP riêng) */}
                                    {isSOS ? (
                                        <span className="px-2 py-1 rounded bg-red-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                                            URGENT
                                        </span>
                                    ) : (
                                        <StatusBadge status={log.status} />
                                    )}
                                </div>

                                {/* Body Card */}
                                <div className="space-y-2 pl-3 text-xs">
                                    {/* Actor */}
                                    <div className={`flex items-center gap-2 ${isSOS ? "text-red-700 dark:text-red-300 font-bold" : "text-gray-600 dark:text-gray-300"}`}>
                                        <User size={12} className={isSOS ? "text-red-500" : "text-blue-500"} />
                                        <span className="truncate">{log.actor_email}</span>
                                    </div>
                                    
                                    {/* Message Detail Box */}
                                    <div className={`mt-2 p-3 rounded-lg border text-[11px] font-mono break-words leading-relaxed
                                        ${isSOS 
                                            ? (isDark ? "bg-red-950/50 border-red-500/30 text-red-200" : "bg-white border-red-200 text-red-800")
                                            : (isDark ? "bg-black/30 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-600")
                                        }`}>
                                        {/* Hiển thị IP nếu có */}
                                        {log.ip_address && (
                                            <div className="mb-1 opacity-70 flex items-center gap-1">
                                                <Target size={10}/> IP: {log.ip_address}
                                            </div>
                                        )}
                                        {log.details}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 💻 DESKTOP VIEW: TABLE (Giữ nguyên, chỉ thêm highlight nhẹ cho dòng SOS) */}
                <div className="hidden md:block rounded-2xl shadow-xl overflow-hidden border dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-sm font-mono whitespace-nowrap">
                            <thead className={`${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                                <tr>
                                    <th className="py-4 px-6 text-left font-bold uppercase text-xs">Status</th>
                                    <th className="py-4 px-6 text-left font-bold uppercase text-xs">Time</th>
                                    <th className="py-4 px-6 text-left font-bold uppercase text-xs">Action</th>
                                    <th className="py-4 px-6 text-left font-bold uppercase text-xs">Actor</th>
                                    <th className="py-4 px-6 text-left font-bold uppercase text-xs">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {filteredLogs.map((log) => {
                                    const isSOS = log.action === "SOS_REQUEST";
                                    return (
                                        <tr key={log.id} className={`transition-colors 
                                            ${isSOS 
                                                ? (isDark ? "bg-red-900/10 hover:bg-red-900/20" : "bg-red-50 hover:bg-red-100") 
                                                : (isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50")}
                                        `}>
                                            <td className="py-4 px-6"><StatusBadge status={log.status} /></td>
                                            <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{formatDateTime(log.created_at)}</td>
                                            <td className={`py-4 px-6 font-bold ${isSOS ? "text-red-600" : "text-purple-600 dark:text-purple-400"}`}>
                                                {isSOS && <LifeBuoy size={14} className="inline mr-1 mb-0.5 animate-pulse"/>}
                                                {log.action}
                                            </td>
                                            <td className="py-4 px-6 text-blue-600 dark:text-blue-400">{log.actor_email}</td>
                                            <td className="py-4 px-6 text-xs text-gray-500 max-w-xs truncate" title={log.details}>
                                                <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded mr-2">{log.ip_address || "IP:N/A"}</span>
                                                {log.details}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}