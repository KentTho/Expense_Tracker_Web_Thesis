// DashboardLayout.jsx
// - ADDED: Hiệu ứng chuyển trang (Page Transition) sáng tạo cho Outlet.
// - UPDATED: Đồng bộ logic 'marginLeft' với 'w-20' / 'w-64' của Sidebar.
// - RETAINED: Logic theme, logic mobile.

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom"; // ✅ Thêm useLocation
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false); // Cho mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Cho desktop
  const [theme, setTheme] = useState("dark");
  const location = useLocation(); // ✅ Lấy location cho page transition

  // Tự động set theo kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(true);
      else setIsOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tự cập nhật class cho body
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("bg-gray-900", "text-gray-100");
      document.body.classList.remove("bg-gray-50", "text-gray-900");
    } else {
      document.body.classList.add("bg-gray-50", "text-gray-900");
      document.body.classList.remove("bg-gray-900", "text-gray-100");
    }
    // Gán class theme vào <html> để Tailwind CSS dark: hoạt động
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div
      className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900" // Nền chính ngoài
          : "bg-gray-50" // Nền chính ngoài
      }`}
    >
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block z-40">
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          setTheme={setTheme} 
        />
      </div>

      {/* Sidebar (Mobile - Overlay) */}
      <AnimatePresence>
        {isOpen && window.innerWidth < 768 && (
          <motion.div
            key="sidebar-mobile"
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full z-50"
          >
            <Sidebar
              collapsed={false} // Luôn mở rộng trên mobile
              setCollapsed={() => {}} // Không cho phép thu gọn
              theme={theme}
              setTheme={setTheme} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Overlay (Nút close) */}
      {isOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content (Nội dung chính) */}
      <motion.main
        key="main-content"
        animate={{
          // ✅ Cập nhật margin khớp với w-20 (5rem) và w-64 (16rem)
          marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? "5rem" : "16rem") : "0",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`flex-1 min-h-screen ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Nút toggle menu cho mobile */}
        <button
          className="md:hidden fixed top-5 left-5 z-50 bg-blue-600 p-2.5 rounded-full shadow-lg text-white hover:bg-blue-500 transition"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {/* ======================================================= */}
        {/* 💡 SÁNG TẠO: THÊM HIỆU ỨNG CHUYỂN TRANG */}
        {/* ======================================================= */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname} // Key là đường dẫn, khi key đổi -> animation chạy
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-4 sm:p-6" // Thêm padding cho nội dung
          >
            <Outlet context={{ theme, setTheme, displayCurrency: "USD" }} /> 
            {/* ✅ Truyền displayCurrency xuống đây */}
          </motion.div>
        </AnimatePresence>

      </motion.main>
    </div>
  );
}