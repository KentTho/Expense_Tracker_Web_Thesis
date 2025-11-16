// Sidebar.jsx (Đã có import useLocation)

import React from "react";
// ✅ LỖI PHÁT SINH TỪ ĐÂY: Phải import useLocation
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  Home,
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
  Sun,
  Moon, 
  BarChart2, 
  Download ,
  Lock,
  Tag,
  Users,     // Icon Admin
  Shield     // Icon Admin
} from "lucide-react";
import logo from "../assets/logo.png";

export default function Sidebar({ collapsed, setCollapsed, theme, setTheme }) {
  const location = useLocation(); // ✅ Đã import
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const userMenu = [
    { name: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart2 size={18} /> },
    { name: "Income", path: "/income", icon: <TrendingUp size={18} /> },
    { name: "Expense", path: "/expense", icon: <Wallet size={18} /> },
    { name: "Category", path: "/categories", icon: <Tag size={18} /> },
    { name: "Data Export", path: "/dataexport", icon: <Download size={18} /> },
  ];
  
  const settingsMenu = [
    { name: "Security", path: "/security", icon: <Lock size={18} /> }, 
    { name: "Profile", path: "/profile", icon: <Settings size={18} /> }, 
  ];

  const adminMenu = [
    { name: "User Management", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Default Categories", path: "/admin/categories", icon: <Shield size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("idToken");
      localStorage.removeItem("user");
      toast.success("👋 Logged out successfully!");
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      console.error(error);
      toast.error("❌ Logout failed!");
    }
  };

  // Helper render menu item
  const renderMenuItem = (item) => {
    const active = location.pathname === item.path;
    return (
      <div key={item.path} className="relative group w-full">
        <Link
          to={item.path}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl w-full transition-all duration-200
            ${
              active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                : theme === "dark"
                ? "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-blue-600"
            }
            ${collapsed ? "justify-center" : ""}`}
        >
          {item.icon}
          {!collapsed && (
            <span className="text-sm font-semibold truncate">{item.name}</span>
          )}
        </Link>
        {collapsed && (
          <span
            className={`absolute left-full top-1/2 -translate-y-1/2 ml-4
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              px-3 py-1.5 text-xs font-medium rounded-lg shadow-lg
              transition-all duration-200 whitespace-nowrap z-50
              ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
          >
            {item.name}
            <span className={`absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}></span>
          </span>
        )}
      </div>
    );
  };

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`fixed top-0 left-0 h-screen flex flex-col justify-between
        transition-[width] duration-300 ease-in-out shadow-2xl z-50
        ${theme === "dark" ? "bg-gray-900 border-r border-gray-700/50" : "bg-white text-gray-800 border-r border-gray-200"}
        ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="flex flex-col relative select-none">
        {/* Header (Logo & Tên) */}
        <div className="flex items-center justify-center px-3 py-5 h-[80px]"> 
          <div className="flex items-center gap-3">
            <img src={logo} alt="Expense Tracker Logo" className={`w-10 h-10 transition-all duration-300 transform-gpu drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] hover:scale-110`} />
            {!collapsed && (
              <h2 className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Expense Tracker
              </h2>
            )}
          </div>
        </div>

        {/* Menu (Đã cập nhật) */}
        <nav className="flex flex-col gap-2 px-3 mt-4">
          {userMenu.map(renderMenuItem)}
          
          <div className="my-2 border-t border-gray-700/50 mx-3"></div>
          {settingsMenu.map(renderMenuItem)}

          {/* KIỂM TRA QUYỀN ADMIN */}
          {user.is_admin && (
            <>
              <div className="my-3">
                <span className={`text-xs font-semibold uppercase ${collapsed ? 'hidden' : 'ml-4 text-gray-500'}`}>
                  Admin
                </span>
              </div>
              {adminMenu.map(renderMenuItem)}
            </>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className={`border-t pt-4 mt-4 w-full px-4 pb-4 ${theme === "dark" ? "border-white/10" : "border-gray-200"}`}>
        {/* Avatar */}
        <div
          onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
          className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${collapsed ? "justify-center" : ""} ${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}
        >
          <img
            src={user?.profile_image || "https://i.pravatar.cc/40"}
            alt="avatar"
            className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover"
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-semibold text-sm truncate">{user?.name || "User"}</p>
              <p className="text-xs text-blue-400 hover:underline">View profile</p>
            </div>
          )}
        </div>
        {/* Theme Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setTheme(theme === "dark" ? "light" : "dark"); }}
          className={`group flex items-center gap-3 w-full mt-3 px-2 py-2 rounded-lg transition-all duration-300 ${collapsed ? "justify-center" : ""}
            ${theme === "dark" ? "bg-gray-700/50 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-700" />}
          {!collapsed && (<span className="text-sm font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>)}
        </button>
        {/* Logout */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLogout(); }}
          className={`group flex items-center gap-3 mt-2 w-full overflow-hidden rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 py-2 transition-all duration-300 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} />
          {!collapsed && (<span className="text-sm font-medium">Logout</span>)}
        </button>
      </div>
    </aside>
  );
}