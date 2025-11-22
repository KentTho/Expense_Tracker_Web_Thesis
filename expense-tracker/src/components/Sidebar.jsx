// Sidebar.jsx
// - ✅ FIXED: Chuyển từ 'sticky' sang 'fixed' để đảm bảo Sidebar luôn đứng yên khi cuộn.
// - ✅ RETAINED: Giữ nguyên thiết kế Floating Glassmorphism.
// - ✅ REMOVED: Không có phần dịch thuật (theo yêu cầu).

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  Home, TrendingUp, Wallet, Settings, LogOut, Sun, Moon, 
  BarChart2, Download, Lock, Tag, Users, Shield, LayoutDashboard,
  FileText, Settings2, User, ShieldCheck
} from "lucide-react";
import logo from "../assets/logo.png";

// Helper lấy Tên Viết Tắt
const getInitials = (name) => {
  if (!name) return "U";
  const names = name.split(' ');
  const first = names[0] ? names[0][0] : '';
  const last = names.length > 1 ? names[names.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
};

export default function Sidebar({ collapsed, setCollapsed, theme, setTheme, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userInitials = getInitials(user?.name);

  // State cho Workspace Switcher
  const [viewMode, setViewMode] = useState(
    location.pathname.startsWith('/admin') ? 'admin' : 'personal'
  );

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
        setViewMode('admin');
    } else {
        setViewMode('personal');
    }
  }, [location.pathname]);

  // --- 1. MENU CÁ NHÂN (Personal) ---
  const personalMenu = [
    { category: "General", items: [
        { name: "Home", path: "/dashboard", icon: <Home size={20} /> },
        { name: "Analytics", path: "/analytics", icon: <BarChart2 size={20} /> },
    ]},
    { category: "Transactions", items: [
        { name: "Income", path: "/income", icon: <TrendingUp size={20} /> },
        { name: "Expense", path: "/expense", icon: <Wallet size={20} /> },
    ]},
    { category: "Management", items: [
        { name: "Category", path: "/categories", icon: <Tag size={20} /> },
        { name: "Data Export", path: "/dataexport", icon: <Download size={20} /> },
    ]},
    { category: "Settings", items: [
        { name: "Security", path: "/security", icon: <Lock size={20} /> }, 
        { name: "Profile", path: "/profile", icon: <Settings size={20} /> }, 
    ]}
  ];

  // --- 2. MENU QUẢN TRỊ (Admin) ---
  const adminMenuStructure = [
    { category: "Overview", items: [
        { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "Audit Logs", path: "/admin/logs", icon: <FileText size={20} /> },
    ]},
    { category: "Management", items: [
        { name: "Users", path: "/admin/users", icon: <Users size={20} /> },
        { name: "Default Categories", path: "/admin/categories", icon: <Shield size={20} /> },
    ]},
    { category: "System", items: [
        { name: "Settings", path: "/admin/system", icon: <Settings2 size={20} /> },
    ]}
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("idToken");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  const renderMenuItem = (item) => {
    const active = location.pathname === item.path;
    return (
      <div key={item.path} className="relative group w-full px-2 mb-1">
        <Link
          to={item.path}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full transition-all duration-300 ease-out
            ${
              active
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 translate-x-1"
                : theme === "dark"
                ? "text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1"
                : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1"
            }
            ${collapsed ? "justify-center px-0" : ""}`}
        >
          <div className={`${active ? "animate-pulse-slow" : ""}`}>
             {item.icon}
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide truncate">{item.name}</span>
          )}
        </Link>
        {collapsed && (
          <span className={`absolute left-full top-1/2 -translate-y-1/2 ml-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible px-4 py-2 text-xs font-bold rounded-xl shadow-xl transition-all duration-300 whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0 ${theme === "dark" ? "bg-gray-800 text-white border border-gray-700" : "bg-white text-gray-900 border border-gray-100"}`}>
            {item.name}
            <span className={`absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 rounded-sm ${theme === "dark" ? "bg-gray-800 border-l border-b border-gray-700" : "bg-white border-l border-b border-gray-100"}`}></span>
          </span>
        )}
      </div>
    );
  };

  // ==============================================================
  // 🎨 MAIN RENDER
  // ==============================================================
  return (
    // ✅ THAY ĐỔI QUAN TRỌNG: 
    // Dùng 'fixed' thay vì 'sticky'. 
    // 'fixed' sẽ neo chặt element vào cửa sổ trình duyệt (viewport),
    // không bị ảnh hưởng bởi thanh cuộn của phần nội dung chính.
    <div className={`fixed top-0 left-0 h-screen py-3 pl-3 transition-[width] duration-300 z-50 ${collapsed ? "w-24" : "w-72"}`}>
        
        {/* Phần Sidebar bên trong (Floating Glassmorphism) */}
        <aside
            onMouseEnter={!isMobile ? () => setCollapsed(false) : undefined}
            onMouseLeave={!isMobile ? () => setCollapsed(true) : undefined}
            className={`h-full flex flex-col justify-between rounded-3xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-colors duration-300
                ${theme === "dark" 
                    ? "bg-gray-900/95 border-white/10 shadow-black/50" 
                    : "bg-white/90 border-white/40 shadow-blue-100"
                }
            `}
        >
            {/* Nội dung menu có thể cuộn độc lập nếu màn hình quá ngắn */}
            <div className="flex flex-col relative select-none h-full overflow-y-auto custom-scrollbar no-scrollbar">
                
                {/* --- Header --- */}
                <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4"> 
                    <div className={`flex items-center gap-3 mb-6 ${collapsed ? "flex-col" : "flex-row"}`}>
                        <img src={logo} alt="Logo" className={`transition-all duration-500 transform hover:rotate-12 ${collapsed ? "w-10 h-10" : "w-10 h-10"}`} />
                        {!collapsed && (
                        <div className="flex flex-col">
                            <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                                Expense Tracker
                            </h2>
                        </div>
                        )}
                    </div>

                    {/* Workspace Switcher (Admin Only) */}
                    {user.is_admin && !collapsed && (
                        <div className={`flex p-1 rounded-xl w-full mb-2 ${theme === 'dark' ? 'bg-black/40' : 'bg-gray-100'}`}>
                            <button
                                onClick={() => { setViewMode('personal'); navigate('/dashboard'); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                                    viewMode === 'personal' 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <User size={14} /> Personal
                            </button>
                            <button
                                onClick={() => { setViewMode('admin'); navigate('/admin/dashboard'); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                                    viewMode === 'admin' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <ShieldCheck size={14} /> Admin
                            </button>
                        </div>
                    )}
                     {/* Icon Switcher khi thu gọn */}
                     {user.is_admin && collapsed && (
                        <div className="mb-4 flex flex-col gap-2">
                             <button 
                                onClick={() => { setViewMode('personal'); navigate('/dashboard'); }}
                                className={`p-2 rounded-lg ${viewMode === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                             >
                                <User size={16} />
                             </button>
                             <button 
                                onClick={() => { setViewMode('admin'); navigate('/admin/dashboard'); }}
                                className={`p-2 rounded-lg ${viewMode === 'admin' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                             >
                                <ShieldCheck size={16} />
                             </button>
                        </div>
                     )}
                </div>

                {/* --- Dynamic Menu --- */}
                <nav className="flex flex-col gap-1 px-2 flex-1 pb-20">
                    {(viewMode === 'admin' ? adminMenuStructure : personalMenu).map((section, index) => (
                        <div key={index} className="mb-4">
                            {!collapsed && (
                                <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                                    {section.category}
                                </h3>
                            )}
                            {section.items.map(renderMenuItem)}
                        </div>
                    ))}
                </nav>
            </div>

            {/* --- Footer --- */}
            <div className={`p-3 mt-auto absolute bottom-0 left-0 w-full ${theme === "dark" ? "bg-gray-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-md"}`}>
                <div className={`rounded-2xl p-3 transition-all duration-300 group ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-white hover:shadow-md"}`}>
                    <div 
                        onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                        className={`flex items-center gap-3 cursor-pointer ${collapsed ? "justify-center" : ""}`}
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                                {userInitials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                        </div>
                        {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate text-gray-700 dark:text-gray-200">{user?.name || "User"}</p>
                            <p className={`text-[10px] font-bold uppercase ${user.is_admin ? 'text-purple-500' : 'text-gray-500'}`}>
                                {user.is_admin ? "Administrator" : "Member"}
                            </p>
                        </div>
                        )}
                    </div>

                    {!collapsed && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); setTheme(theme === "dark" ? "light" : "dark"); }}
                                className={`flex items-center justify-center py-2 rounded-lg transition-colors ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700 text-yellow-400" : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-600"}`}
                                title="Toggle Theme"
                            >
                                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                                className="flex items-center justify-center py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    </div>
  );
}