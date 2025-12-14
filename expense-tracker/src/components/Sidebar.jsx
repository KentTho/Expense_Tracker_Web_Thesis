// components/Sidebar.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  Home, TrendingUp, Wallet, Settings, LogOut, Sun, Moon,
  BarChart2, Download, Lock, Tag, Users, Shield,
  LayoutDashboard, FileText, Settings2, User, ShieldCheck
} from "lucide-react";
import logo from "../assets/logo.png";

/* ===================== UTIL ===================== */
const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
        return {};
    }
};

/* ===================== COMPONENT ===================== */
export default function Sidebar({
  collapsed,
  setCollapsed,
  theme,
  setTheme,
  isMobile
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  /* -------- USER STATE -------- */
  const [user, setUser] = useState(getStoredUser);
  const isAdmin = !!user?.is_admin;

  /* -------- VIEW MODE -------- */
  const viewMode = useMemo(
    () => (location.pathname.startsWith("/admin") ? "admin" : "personal"),
    [location.pathname]
  );

  /* -------- SYNC USER -------- */
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("user_profile_updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("user_profile_updated", sync);
    };
  }, [location.pathname]);

  /* -------- MOBILE UX -------- */
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [location.pathname, isMobile, setCollapsed]);

  /* -------- MENU STRUCTURE -------- */
  const personalMenu = useMemo(() => ([
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
    ]},
  ]), []);

  const adminMenu = useMemo(() => ([
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
    ]},
  ]), []);

  const menus = viewMode === "admin" ? adminMenu : personalMenu;

  /* -------- HANDLERS -------- */
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed");
    }
  }, [navigate]);

  /* -------- RENDER -------- */
  return (
    <div 
        id="tour-sidebar" 
        // 🔥 FIX 1: Dùng h-[100dvh] để không bị mất chân trang trên Mobile
        className={`sticky top-0 h-[100dvh] py-3 pl-3 transition-[width] duration-300 z-50 ${collapsed ? "w-24" : "w-72"}`}
    >
      <aside
        onMouseEnter={!isMobile ? () => setCollapsed(false) : undefined}
        onMouseLeave={!isMobile ? () => setCollapsed(true) : undefined}
        className={`h-full flex flex-col justify-between rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-300
          ${isDark 
            ? "bg-gray-900/95 border-white/10 shadow-black/50" 
            : "bg-white/95 border-white/40 shadow-xl shadow-blue-100/50"}`}
      >

        {/* ---------- HEADER & MENU ---------- */}
        <div className="flex flex-col relative select-none h-full overflow-y-auto custom-scrollbar no-scrollbar">
            <div className="flex flex-col items-center justify-center pt-8 pb-4 px-4">
            
            {/* Logo Section */}
            <div className={`flex items-center gap-3 mb-6 transition-all duration-500 ${collapsed ? "flex-col" : "flex-row"}`}>
                <img src={logo} alt="Logo" className={`transition-transform duration-500 hover:rotate-12 ${collapsed ? "w-10 h-10" : "w-10 h-10"}`} />
                {!collapsed && (
                    <div className="flex flex-col animate-fadeIn">
                        <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 whitespace-nowrap">
                            Expense Tracker
                        </h2>
                    </div>
                )}
            </div>

            {/* Admin Switcher */}
            {isAdmin && !collapsed && (
                <div className={`flex p-1 rounded-xl w-full mb-4 ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                <button
                    onClick={() => navigate("/dashboard")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 
                    ${viewMode === "personal" 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                >
                    <User size={14} /> Personal
                </button>
                <button
                    onClick={() => navigate("/admin/dashboard")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all duration-300 
                    ${viewMode === "admin" 
                        ? "bg-purple-600 text-white shadow-md" 
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                >
                    <ShieldCheck size={14} /> Admin
                </button>
                </div>
            )}
            
            {isAdmin && collapsed && (
                <div className="mb-6 flex flex-col gap-3 w-full items-center">
                    <button onClick={() => navigate("/dashboard")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <User size={18} />
                    </button>
                    <button onClick={() => navigate("/admin/dashboard")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'admin' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <ShieldCheck size={18} />
                    </button>
                </div>
            )}
            </div>

            {/* ---------- MENU ITEMS ---------- */}
            {/* 🔥 FIX 2: Tăng pb-32 để nội dung cuối không bị Footer che mất */}
            <nav className="flex flex-col gap-1 px-3 flex-1 pb-32">
            {menus.map((section, index) => (
                <div key={index} className="mb-4">
                {!collapsed && (
                    <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 animate-fadeIn">
                        {section.category}
                    </h3>
                )}
                {section.items.map(item => {
                    const active = location.pathname === item.path;
                    return (
                        <div key={item.path} className="relative group mb-1">
                            <Link
                                to={item.path}
                                className={`flex items-center gap-4 px-3 py-3 rounded-xl w-full transition-all duration-300 ease-out
                                ${active 
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 translate-x-1" 
                                    : isDark 
                                        ? "text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1" 
                                        : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1"
                                }
                                ${collapsed ? "justify-center px-0" : ""}`}
                            >
                                <div className={`${active ? "animate-pulse-slow" : ""}`}>{item.icon}</div>
                                {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.name}</span>}
                            </Link>
                            
                            {collapsed && (
                                <span className={`absolute left-full top-1/2 -translate-y-1/2 ml-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible px-3 py-1.5 text-xs font-bold rounded-lg shadow-xl transition-all duration-200 whitespace-nowrap z-50 transform translate-x-2 group-hover:translate-x-0 ${isDark ? "bg-gray-800 text-white border border-gray-700" : "bg-white text-gray-900 border border-gray-100"}`}>
                                    {item.name}
                                    <span className={`absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-gray-800" : "bg-white"}`}></span>
                                </span>
                            )}
                        </div>
                    );
                })}
                </div>
            ))}
            </nav>
        </div>

        {/* ---------- FOOTER (User Profile) ---------- */}
        <div className={`p-3 mt-auto absolute bottom-0 left-0 w-full border-t transition-colors duration-300 
            ${isDark ? "bg-gray-900/95 border-white/5" : "bg-white/95 border-gray-100"}`}>
          
          <div className={`rounded-2xl p-2 transition-all duration-300 group ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50 hover:shadow-sm"}`}>
            <div className={`flex items-center gap-3 cursor-pointer ${collapsed ? "justify-center" : ""}`} onClick={() => navigate("/profile")}>
                <div className="relative flex-shrink-0">
                    {user.profile_image ? (
                        <img 
                            src={user.profile_image} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-xl object-cover shadow-md border-2 border-white/20" 
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {getInitials(user?.name)}
                        </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></div>
                </div>
                
                {!collapsed && (
                    <div className="flex-1 overflow-hidden animate-fadeIn">
                        <p className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{user?.name || "User"}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-purple-500' : 'text-gray-400'}`}>
                            {isAdmin ? "Administrator" : "Member"}
                        </p>
                    </div>
                )}
            </div>

            {!collapsed && (
                <div className="grid grid-cols-2 gap-2 mt-3 animate-fadeIn">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setTheme(isDark ? "light" : "dark"); }} 
                        className={`flex items-center justify-center py-2 rounded-lg transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-yellow-400" : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-600"}`}
                        title="Switch Theme"
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                        className="flex items-center justify-center py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition-colors"
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