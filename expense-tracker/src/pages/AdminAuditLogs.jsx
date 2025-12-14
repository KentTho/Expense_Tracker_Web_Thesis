// pages/AdminAuditLogs.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    FileText, AlertCircle, CheckCircle2, RefreshCw, Search, Terminal, SearchX, Loader2 
} from "lucide-react";
import { adminGetAuditLogs } from "../services/adminService";
import { toast, Toaster } from "react-hot-toast";

// Helper format thời gian an toàn
const formatDateTime = (isoString) => {
    try {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch (e) {
        return isoString;
    }
};

export default function AdminAuditLogs() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // --- FETCH DATA (SILENT FAIL) ---
  const fetchLogs = async () => {
    setLoading(true);
    try {
        const data = await adminGetAuditLogs(100);
        // console.log("AUDIT LOGS DATA:", data); // Debug nếu cần

        // Nếu data trả về mảng thì set, nếu lỗi/null thì set rỗng -> Không báo lỗi
        if (Array.isArray(data)) {
            setLogs(data);
        } else {
            setLogs([]);
        }
    } catch (error) {
        console.warn("Audit logs fetch silent fail:", error);
        // Silent Fail: Không hiển thị toast error để tránh làm phiền admin
        setLogs([]);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- OPTIMIZED FILTER (useMemo) ---
  // Giúp thao tác search mượt hơn khi dữ liệu lớn
  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    
    const lowerFilter = filter.toLowerCase();
    return logs.filter(log => 
        (log.action || "").toLowerCase().includes(lowerFilter) ||
        (log.target || "").toLowerCase().includes(lowerFilter) ||
        (log.actor_email || "").toLowerCase().includes(lowerFilter)
    );
  }, [logs, filter]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-right" />
      
      {/* Header Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                <Terminal className="text-purple-500" size={32} />
                System Activity
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                Track all administrative actions and system events.
            </p>
        </div>
        <button 
            onClick={fetchLogs} 
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-2 font-medium shadow-sm active:scale-95 ${
                isDark 
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700" 
                : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
        >
            <RefreshCw size={18} className={loading ? "animate-spin text-purple-500" : ""} /> 
            Refresh Logs
        </button>
      </div>

      {/* Search Bar */}
      <div className={`p-2 rounded-2xl mb-6 shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
         <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Filter logs by Action, Admin Email, or Target..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none transition-all placeholder-gray-400 ${isDark ? "text-white" : "text-gray-900"}`}
            />
         </div>
      </div>

      {/* Logs Table (Terminal Style - Responsive) */}
      <div className={`rounded-2xl shadow-xl overflow-hidden border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full text-sm font-mono whitespace-nowrap">
                <thead className={`${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                    <tr>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Status</th>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Timestamp</th>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Action</th>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Actor (Admin)</th>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Target</th>
                        <th className="py-4 px-6 text-left font-bold uppercase text-xs tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {loading ? (
                         <tr>
                            <td colSpan="6" className="text-center py-12">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <Loader2 className="animate-spin mb-2 text-purple-500" size={32} />
                                    <p>Loading audit logs...</p>
                                </div>
                            </td>
                         </tr>
                    ) : filteredLogs.length === 0 ? (
                        // --- EMPTY STATE UI ---
                        <tr>
                            <td colSpan="6" className="text-center py-16">
                                <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                                    <SearchX size={48} className="mb-2" />
                                    <p className="font-medium text-base">No logs found.</p>
                                    <p className="text-xs mt-1">System activity will appear here once recorded.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className={`transition-colors ${isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
                                {/* Status */}
                                <td className="py-4 px-6">
                                    {log.status === "SUCCESS" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                            <CheckCircle2 size={12} /> OK
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                            <AlertCircle size={12} /> ERR
                                        </span>
                                    )}
                                </td>
                                {/* Timestamp */}
                                <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                                    {formatDateTime(log.created_at)}
                                </td>
                                {/* Action */}
                                <td className="py-4 px-6 font-bold text-purple-600 dark:text-purple-400">
                                    {log.action}
                                </td>
                                {/* Actor */}
                                <td className="py-4 px-6 text-blue-600 dark:text-blue-400 font-medium">
                                    {log.actor_email}
                                </td>
                                {/* Target */}
                                <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                                    {log.target || <span className="text-gray-400 italic">N/A</span>}
                                </td>
                                {/* Details (IP + Msg) */}
                                <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate" title={log.details}>
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono text-[10px]">
                                            {log.ip_address || "IP:N/A"}
                                        </span>
                                        <span className="truncate">{log.details}</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Footer info */}
        {!loading && filteredLogs.length > 0 && (
            <div className={`px-6 py-3 border-t text-xs font-medium ${isDark ? "border-gray-800 text-gray-500 bg-gray-800/30" : "border-gray-200 text-gray-400 bg-gray-50"}`}>
                Showing {filteredLogs.length} records
            </div>
        )}
      </div>

    </div>
  );
}