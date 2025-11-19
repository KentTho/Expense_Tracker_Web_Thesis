// pages/AdminSystemSettings.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    Settings, Server, ShieldAlert, Radio, Save, Volume2, Activity 
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { fetchSystemSettings, updateSystemSettings } from "../services/adminService";

// Custom Toggle Switch (Sáng tạo hơn)
const PowerSwitch = ({ label, description, checked, onChange, colorClass }) => (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:border-opacity-50">
        <div className="flex gap-4 items-center">
            <div className={`p-3 rounded-full ${checked ? colorClass.bg : "bg-gray-200 dark:bg-gray-700"} transition-colors duration-500`}>
                <ShieldAlert size={24} className={checked ? "text-white" : "text-gray-500"} />
            </div>
            <div>
                <h3 className="font-bold text-lg">{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
            <div className={`w-14 h-8 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 transition-colors duration-300 ease-in-out
                ${checked ? colorClass.activeBg : "bg-gray-300 dark:bg-gray-600"}
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
    
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        allow_signup: true,
        broadcast_message: ""
    });

    useEffect(() => {
        fetchSystemSettings()
            .then(data => setSettings(data))
            .catch(err => toast.error("Failed to load settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSystemSettings(settings);
            toast.success("System settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update settings.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            <Toaster position="top-center" />

            <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
                <Settings className="text-blue-500" size={36} />
                System Configuration
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cột 1: Trạng thái Server (Giả lập) */}
                <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Server className="text-purple-500" /> Server Status
                    </h2>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="font-medium flex items-center gap-2"><Activity size={18} /> API Latency</span>
                            <span className="text-green-500 font-bold">45ms</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="font-medium flex items-center gap-2"><Radio size={18} /> Database Connection</span>
                            <span className="text-blue-500 font-bold animate-pulse">Active</span>
                        </div>
                         <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Cấu hình Toggles */}
                <div className="space-y-4">
                    <PowerSwitch 
                        label="Maintenance Mode" 
                        description="Block all user access except Admins."
                        checked={settings.maintenance_mode}
                        onChange={() => handleToggle("maintenance_mode")}
                        colorClass={{ bg: "bg-red-500", activeBg: "bg-red-600" }}
                    />
                    <PowerSwitch 
                        label="Allow New Signups" 
                        description="Enable or disable new user registrations."
                        checked={settings.allow_signup}
                        onChange={() => handleToggle("allow_signup")}
                        colorClass={{ bg: "bg-green-500", activeBg: "bg-green-600" }}
                    />
                </div>
            </div>

            {/* Hàng dưới: Broadcast Message */}
            <div className={`mt-8 p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Volume2 className="text-orange-500" /> Global Broadcast
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    This message will be displayed on the dashboard of ALL users. Leave empty to disable.
                </p>
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={settings.broadcast_message || ""}
                        onChange={(e) => setSettings(prev => ({...prev, broadcast_message: e.target.value}))}
                        placeholder="e.g., System maintenance scheduled for 10 PM..."
                        className={`flex-1 p-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-900 border-gray-600" : "bg-gray-50 border-gray-300"}`}
                    />
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                    >
                        <Save size={20} />
                        {isSaving ? "Saving..." : "Save Config"}
                    </button>
                </div>
            </div>

        </div>
    );
}