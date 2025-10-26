import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [theme, setTheme] = useState("dark");

  // ✅ Tự động set theo kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(true);
      else setIsOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Tự cập nhật class cho body để theme ảnh hưởng toàn bộ app
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("bg-[#0F172A]", "text-gray-100");
      document.body.classList.remove("bg-gray-100", "text-gray-900");
    } else {
      document.body.classList.add("bg-gray-100", "text-gray-900");
      document.body.classList.remove("bg-[#0F172A]", "text-gray-100");
    }
  }, [theme]);

  return (
    <div
      className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#0F172A] text-gray-100"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed md:static z-40"
          >
            <Sidebar
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
              theme={theme}
              setTheme={setTheme} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        key="main-content"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          marginLeft: sidebarCollapsed ? "4rem" : "16rem",
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`flex-1 min-h-screen p-6 transition-all duration-300 ${
          theme === "dark" ? "bg-[#111827]" : "bg-white"
        }`}
      >
        {/* Nút toggle menu cho mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-purple-600 p-2 rounded-lg shadow hover:bg-purple-700 transition"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="toggle sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Nội dung trang */}
        <div className="mt-10 md:mt-0 transition-all duration-300">
          <Outlet context={{ theme, setTheme }} />
        </div>
      </motion.main>
    </div>
  );
}
