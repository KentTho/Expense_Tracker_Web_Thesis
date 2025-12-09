// pages/AdminAuditLogs.jsx (TẠO MỚI)
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    FileText, AlertCircle, CheckCircle2, RefreshCw, Search, Terminal 
} from "lucide-react";
import { adminGetAuditLogs } from "../services/adminService";
import { toast } from "react-hot-toast";

// Helper format thời gian
const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

export default function AdminAuditLogs() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
        const data = await adminGetAuditLogs(100);
        console.log("AUDIT LOGS DATA:", data); // ✅ Thêm dòng này để debug
        if (Array.isArray(data)) {
            setLogs(data);
        } else {
            setLogs([]);
        }
    } catch (error) {
        toast.error("Failed to load audit logs");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Lọc logs theo từ khóa
  const filteredLogs = logs.filter(log => 
    (log.action || "").toLowerCase().includes(filter.toLowerCase()) ||
    (log.target || "").toLowerCase().includes(filter.toLowerCase()) ||
    (log.actor_email || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3">
                <Terminal className="text-purple-500" size={36} />
                System Activity
            </h1>
            <p className="text-gray-500 mt-1">Track all administrative actions and system events.</p>
        </div>
        <button 
            onClick={fetchLogs} 
            className="px-4 py-2 text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
        >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl mb-6 shadow-sm ${isDark ? "bg-gray-800" : "bg-white"}`}>
         <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Filter logs by Action, Admin Email, or Target..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-purple-500 ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}
            />
         </div>
      </div>

      {/* Logs Table (Terminal Style) */}
      <div className={`rounded-2xl shadow-xl overflow-hidden border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm font-mono">
                <thead className={`${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                    <tr>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Timestamp</th>
                        <th className="py-3 px-4 text-left">Action</th>
                        <th className="py-3 px-4 text-left">Actor (Admin)</th>
                        <th className="py-3 px-4 text-left">Target</th>
                        <th className="py-3 px-4 text-left">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 dark:divide-gray-800 divide-gray-200">
                    {loading ? (
                         <tr><td colSpan="6" className="text-center py-10">Loading logs...</td></tr>
                    ) : filteredLogs.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-10 text-gray-500">No logs found.</td></tr>
                    ) : (
                        filteredLogs.map((log) => (
                            <tr key={log.id} className={`transition-colors ${isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
                                {/* Status */}
                                <td className="py-3 px-4">
                                    {log.status === "SUCCESS" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500">
                                            <CheckCircle2 size={12} /> OK
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500">
                                            <AlertCircle size={12} /> ERR
                                        </span>
                                    )}
                                </td>
                                {/* Timestamp */}
                                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                    {formatDateTime(log.created_at)}
                                </td>
                                {/* Action */}
                                <td className="py-3 px-4 font-bold text-purple-400">
                                    {log.action}
                                </td>
                                {/* Actor */}
                                <td className="py-3 px-4 text-blue-400">
                                    {log.actor_email}
                                </td>
                                {/* Target */}
                                <td className="py-3 px-4 text-gray-400">
                                    {log.target || "-"}
                                </td>
                                {/* Details (IP + Msg) */}
                                <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate" title={log.details}>
                                    <span className="mr-2 opacity-50">[{log.ip_address}]</span>
                                    {log.details}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}