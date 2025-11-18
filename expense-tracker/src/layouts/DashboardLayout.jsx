// DashboardLayout.jsx
// - ✅ FIXED: Xử lý lại hoàn toàn logic hiển thị Mobile vs Desktop.
// - ✅ ADDED: Custom hook 'useMediaQuery' để phát hiện màn hình.
// - ✅ RETAINED: Hiệu ứng chuyển trang (Page Transition).

import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu, X } from "lucide-react"; // Thêm X
import { motion, AnimatePresence } from "framer-motion";

// 💡 SÁNG TẠO: Custom Hook để kiểm tra kích thước màn hình
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
};

export default function DashboardLayout() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // State cho Desktop (chỉ thu/gọn)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // State cho Mobile (chỉ đóng/mở)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState("dark");
  const location = useLocation();

  // Tự động cập nhật class cho body (Giữ nguyên)
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.className = 'dark';
      document.body.classList.add("bg-gray-900", "text-gray-100");
      document.body.classList.remove("bg-gray-50", "text-gray-900");
    } else {
      document.documentElement.className = 'light';
      document.body.classList.add("bg-gray-50", "text-gray-900");
      document.body.classList.remove("bg-gray-900", "text-gray-100");
    }
  }, [theme]);

  return (
    <div
      className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* ======================================================= */}
      {/* 1. SIDEBAR (LOGIC MỚI) */}
      {/* ======================================================= */}
      
      {/* Sidebar Desktop (Tĩnh, có hover) */}
      {isDesktop && (
        <Sidebar
          isMobile={false}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          setTheme={setTheme} 
        />
      )}

      {/* Sidebar Mobile (Overlay, có animation) */}
      <AnimatePresence>
        {!isDesktop && mobileMenuOpen && (
          <>
            {/* Lớp mờ nền */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sidebar */}
            <motion.div
              key="sidebar-mobile"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 h-full z-50"
            >
              <Sidebar
                isMobile={true} // Báo cho Sidebar biết đây là mobile
                collapsed={false} // Luôn mở rộng
                setCollapsed={() => {}} // Không làm gì cả
                theme={theme}
                setTheme={setTheme} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      

      {/* ======================================================= */}
      {/* 2. MAIN CONTENT (Nội dung chính) */}
      {/* ======================================================= */}
      <motion.main
        key="main-content"
        animate={{
          // Cập nhật margin khớp với w-20 (5rem) và w-64 (16rem)
          marginLeft: isDesktop ? (sidebarCollapsed ? "5rem" : "16rem") : "0",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`flex-1 min-h-screen ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {/* Nút toggle menu cho mobile (hiển thị cố định) */}
        {!isDesktop && (
          <button
            className="md:hidden fixed top-5 left-5 z-50 bg-blue-600 p-2.5 rounded-full shadow-lg text-white hover:bg-blue-500 transition"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Hiệu ứng chuyển trang (Giữ nguyên) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-4 sm:p-6 mt-12 md:mt-0" // Thêm margin-top cho mobile
          >
            {/* Truyền displayCurrency (ví dụ) */}
            <Outlet context={{ theme, setTheme, displayCurrency: "USD" }} /> 
          </motion.div>
        </AnimatePresence>

      </motion.main>
    </div>
  );
}