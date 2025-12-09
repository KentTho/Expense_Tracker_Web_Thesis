// pages/AdminSystemSettings.jsx
// - ✅ FIXED: Tách biệt logic Toggle và Input Text.
// - ✅ FIXED: Hàm handleSave gửi đúng trạng thái hiện tại của nút gạt.
// - ✅ UX: Thêm nút "Clear" để xóa nhanh thông báo.

import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    Settings, Server, ShieldAlert, Radio, Save, Volume2, Activity, RefreshCw, XCircle
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { 
    fetchSystemSettings, 
    updateSystemSettings,
    adminGetSystemHealth 
} from "../services/adminService";

// Toggle Switch Component (Giữ nguyên giao diện đẹp)
const PowerSwitch = ({ label, description, checked, onChange, colorClass, isDark }) => (
    <div className={`flex items-center justify-between p-5 rounded-2xl shadow-lg border transition-all hover:shadow-xl ${
        isDark 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-slate-200"
    }`}>
        <div className="flex gap-4 items-center">
            <div className={`p-3 rounded-full transition-colors duration-500 ${
                checked ? colorClass.bg : (isDark ? "bg-gray-700" : "bg-slate-100")
            }`}>
                <ShieldAlert size={24} className={checked ? "text-white" : (isDark ? "text-gray-500" : "text-slate-400")} />
            </div>
            <div>
                <h3 className={`font-bold text-lg ${isDark ? "text-gray-100" : "text-slate-800"}`}>
                    {label}
                </h3>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {description}
                </p>
            </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={!!checked} // Đảm bảo luôn là boolean
                onChange={onChange} 
            />
            <div className={`w-14 h-8 rounded-full peer transition-colors duration-300 ease-in-out
                ${checked ? colorClass.activeBg : (isDark ? "bg-gray-600" : "bg-slate-300")}
                after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:duration-300 
                ${checked ? "after:translate-x-6 after:border-white" : ""}
            `}></div>
        </label>
    </div>
);

export default function AdminSystemSettings() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State cấu hình
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        allow_signup: true,
        broadcast_message: ""
    });

    const [serverStats, setServerStats] = useState({
        db_status: "Checking...",
        latency: 0,
        color: "gray"
    });

    const loadData = async () => {
        try {
            const [configData, healthData] = await Promise.all([
                fetchSystemSettings(),
                adminGetSystemHealth()
            ]);
            // Đảm bảo dữ liệu không bị null
            setSettings({
                maintenance_mode: configData.maintenance_mode || false,
                allow_signup: configData.allow_signup ?? true, // allow_signup có thể là false nên dùng ??
                broadcast_message: configData.broadcast_message || ""
            });
            setServerStats(healthData);
        } catch (err) {
            toast.error("Failed to load system status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            adminGetSystemHealth().then(setServerStats).catch(()=>{});
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // ✅ FIX LOGIC TOGGLE: Cập nhật trực tiếp vào state
    const handleToggle = (key) => {
        setSettings(prev => ({ 
            ...prev, 
            [key]: !prev[key] 
        }));
    };

    // ✅ FIX LOGIC SAVE: Gửi toàn bộ state hiện tại lên Server
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                maintenance_mode: settings.maintenance_mode,
                allow_signup: settings.allow_signup,
                broadcast_message: settings.broadcast_message
            };
            
            const updated = await updateSystemSettings(payload);
            setSettings(updated); // Cập nhật lại state với phản hồi từ server để chắc chắn đồng bộ
            
            toast.success("System configuration saved successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearMessage = () => {
        setSettings(prev => ({ ...prev, broadcast_message: "" }));
    };

    const getPingColor = () => {
        if (serverStats.color === "green") return isDark ? "text-green-400" : "text-green-600";
        if (serverStats.color === "yellow") return isDark ? "text-yellow-400" : "text-yellow-600";
        return "text-red-500";
    };

    return (
        <div className={`min-h-screen ${isDark ? "text-gray-100" : "text-slate-900"}`}>
            <Toaster position="top-center" />

            <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
                <Settings className="text-blue-500" size={36} />
                System Configuration
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Cột 1: Server Status */}
                <div className={`p-6 rounded-2xl shadow-xl transition-colors ${
                    isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-slate-200"
                }`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                            <Server className="text-purple-500" /> Server Status
                        </h2>
                        <button onClick={loadData} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <RefreshCw size={18} className={isDark ? "text-gray-400" : "text-slate-500"} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-medium flex items-center gap-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                                    <Activity size={18} /> API Latency
                                </span>
                                <span className={`font-bold font-mono text-lg ${getPingColor()}`}>
                                    {serverStats.latency}ms
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${
                                        serverStats.color === "green" ? "bg-green-500" : 
                                        serverStats.color === "yellow" ? "bg-yellow-500" : "bg-red-500"
                                    }`} 
                                    style={{ width: `${Math.min(serverStats.latency, 100)}%` }} 
                                ></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-medium flex items-center gap-2 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                                    <Radio size={18} /> Database Connection
                                </span>
                                <span className={`font-bold uppercase tracking-wider ${
                                    serverStats.db_status === "Active" ? "text-blue-500 animate-pulse" : "text-red-500"
                                }`}>
                                    {serverStats.db_status}
                                </span>
                            </div>
                             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${
                                        serverStats.db_status === "Active" ? "bg-blue-500 w-full" : "bg-red-500 w-[5%]"
                                    }`}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Toggles */}
                <div className="space-y-4">
                    <PowerSwitch 
                        label="Maintenance Mode" 
                        description="Block access for regular users."
                        checked={settings.maintenance_mode}
                        onChange={() => handleToggle("maintenance_mode")}
                        colorClass={{ bg: "bg-red-500", activeBg: "bg-red-600" }}
                        isDark={isDark}
                    />
                    <PowerSwitch 
                        label="Allow New Signups" 
                        description="Enable/Disable new user registrations."
                        checked={settings.allow_signup}
                        onChange={() => handleToggle("allow_signup")}
                        colorClass={{ bg: "bg-green-500", activeBg: "bg-green-600" }}
                        isDark={isDark}
                    />
                </div>
            </div>

            {/* Global Broadcast */}
            <div className={`mt-8 p-6 rounded-2xl shadow-xl border ${
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
            }`}>
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
                    <Volume2 className="text-orange-500" /> Global Broadcast
                </h2>
                <p className={`text-sm mb-4 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                    Message will be displayed on everyone's dashboard.
                </p>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            value={settings.broadcast_message}
                            onChange={(e) => setSettings(prev => ({...prev, broadcast_message: e.target.value}))}
                            placeholder="e.g., System maintenance at 10 PM..."
                            className={`w-full p-3 pr-10 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500 ${
                                isDark 
                                ? "bg-gray-900 border-gray-600 text-white placeholder-gray-600" 
                                : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                            }`}
                        />
                        {/* Nút Xóa nhanh */}
                        {settings.broadcast_message && (
                            <button 
                                onClick={handleClearMessage}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                            >
                                <XCircle size={20} />
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        <Save size={20} />
                        {isSaving ? "Saving..." : "Save Config"}
                    </button>
                </div>
            </div>

        </div>
    );
}