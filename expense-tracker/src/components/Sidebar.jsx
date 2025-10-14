import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  Home,
  Search,
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
  Sun,
  Moon, 
  User,
  BarChart2, 
  Download ,
  Lock
} from "lucide-react";
import logo from "../assets/logo.png";

export default function Sidebar({ collapsed, setCollapsed, theme, setTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const menu = [
    { name: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart2  size={18} /> },
    { name: "Income", path: "/income", icon: <TrendingUp size={18} /> },
    { name: "Expense", path: "/expense", icon: <Wallet size={18} /> },
    { name: "Data Export", path: "/dataexport", icon: <Download size={18} /> },
    { name: "Security", path: "/security", icon: <Lock size={18} /> }, // ✅ Trang bảo mật
    { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
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

  return (
    <aside
        onMouseEnter={() => setCollapsed(false)}   // 👉 Hover vào => mở rộng
        onMouseLeave={() => setCollapsed(true)}    // 👉 Rời chuột => thu lại
      // ✅ Click toàn vùng Sidebar để toggle
      className={`fixed top-0 left-0 h-screen flex flex-col justify-between cursor-pointer
        ${
          theme === "dark"
            ? "bg-gradient-to-b from-[#07142e] to-[#0d1f4a] text-gray-100"
            : "bg-white text-gray-800 border-r border-gray-200"
        }
        shadow-lg transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* --- Header --- */}
      <div className="flex flex-col relative select-none">
        <div className="flex items-center justify-between px-3 py-5">
          {/* --- Logo + Title --- */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Expense Tracker Logo"
              className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-300 hover:scale-110"
            />
            {!collapsed && (
              <h2
                className={`text-lg font-semibold tracking-wide ${
                  theme === "dark"
                    ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                    : "text-blue-600"
                }`}
              >
                Expense Tracker
              </h2>
            )}
          </div>
        </div>

        {/* --- Menu --- */}
        <nav className="flex flex-col items-center md:items-start gap-1 px-2 mt-2">
          {menu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <div key={item.path} className="relative group w-full">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all duration-200
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg"
                      : theme === "dark"
                      ? "text-gray-300 hover:bg-white/10 hover:text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                      active
                        ? "bg-blue-500/30"
                        : theme === "dark"
                        ? "bg-transparent"
                        : "bg-gray-100"
                    }`}
                  >
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  )}
                </Link>

                {/* 🟢 Tooltip hiển thị khi sidebar collapsed */}
                {collapsed && (
                  <span
                    className={`absolute left-full top-1/2 -translate-y-1/2 ml-3
                    opacity-0 group-hover:opacity-100
                    px-3 py-1 text-xs font-medium rounded-lg shadow-lg
                    transition-all duration-200 whitespace-nowrap z-50
                    ${
                      theme === "dark"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {item.name}
                    {/* Tam giác nhỏ phía dưới tooltip */}
                    <span
                      className={`absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45
                      ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                      }`}
                    ></span>
                  </span>
                )}
              </div>
            );
          })}


        </nav>
      </div>

      {/* --- Footer --- */}
      <div
        className={`border-t pt-4 mt-4 w-full px-3 pb-4 ${
          theme === "dark" ? "border-white/10" : "border-gray-200"
        }`}
      >
        {/* Avatar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate("/profile");
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
        >
          <img
            src={user?.profile_image || "https://i.pravatar.cc/40"}
            alt="avatar"
            className="w-9 h-9 rounded-full border border-white/10"
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-semibold text-sm">{user?.name || "User"}</p>
              <p className="text-xs opacity-70 text-blue-400">View profile</p>
            </div>
          )}
        </div>


        {/* --- Theme Toggle --- */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // ✅ tránh toggle khi click nút theme
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          className={`group flex items-center gap-3 w-full mt-4 px-3 py-2 rounded-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-white/10 hover:bg-white/20"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-300 ${
              theme === "dark" ? "bg-white/10" : "bg-gray-300"
            }`}
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-gray-700" />
            )}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        {/* --- Logout --- */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // ✅ tránh toggle khi click Logout
            handleLogout();
          }}
          className="group relative flex items-center gap-3 mt-4 w-full overflow-hidden rounded-lg 
                    bg-gradient-to-r from-blue-600 to-cyan-500 
                    hover:from-cyan-500 hover:to-blue-600 
                    text-white px-3 py-2 transition-all duration-300 
                    shadow-md hover:shadow-[0_0_15px_rgba(34,211,238,0.6)]"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></span>
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10 group-hover:bg-white/20 transition-all duration-300">
            <LogOut
              size={18}
              className="text-white group-hover:rotate-12 transition-transform duration-300"
            />
          </div>
          {!collapsed && (
            <span className="relative text-sm font-medium tracking-wide">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
