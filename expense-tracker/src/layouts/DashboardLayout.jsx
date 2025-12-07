// layouts/DashboardLayout.jsx
// - ✅ FULL FEATURE: Auth Guard, Welcome Splash, Global State (Currency), Responsive Sidebar.

import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../components/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import FinBotWidget from "../components/FinBotWidget";
import { getUserProfile } from "../services/profileService"; 
import WelcomeSplash from "../components/WelcomeSplash";

export default function DashboardLayout() {
  // --- STATE QUẢN LÝ GIAO DIỆN ---
  const [isOpen, setIsOpen] = useState(false); // Mobile menu
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Desktop sidebar
  const [theme, setTheme] = useState("dark"); // Dark/Light mode
  
  // --- STATE QUẢN LÝ DỮ LIỆU & BẢO MẬT ---
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Kiểm tra xem đã hiện Splash chưa (trong phiên này)
  const [showSplash, setShowSplash] = useState(() => {
      return !sessionStorage.getItem("hasSeenSplash");
  });

  const navigate = useNavigate();

  // ✅ HÀM ĐỒNG BỘ DỮ LIỆU USER (Gọi khi Login hoặc Update Profile)
  const refreshUserProfile = async () => {
    try {
        const data = await getUserProfile();
        setCurrentUser(data);
        localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
        console.error("Failed to refresh user profile", error);
    }
  };

  // ✅ BẢO MẬT: KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const localToken = localStorage.getItem("idToken");
      
      if (!user || !localToken) {
        // Nếu không hợp lệ -> Xóa sạch và đá về Login
        localStorage.removeItem("idToken");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        // Hợp lệ -> Cho phép vào và tải dữ liệu mới nhất
        setIsAuthChecked(true);
        await refreshUserProfile();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ RESPONSIVE: Tự động ẩn/hiện Sidebar theo màn hình
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(true);
      else setIsOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ THEME: Cập nhật class cho Body
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.className = 'dark';
      document.body.classList.add("bg-[#0F172A]", "text-gray-100");
      document.body.classList.remove("bg-gray-100", "text-gray-900");
    } else {
      document.documentElement.className = 'light';
      document.body.classList.add("bg-gray-100", "text-gray-900");
      document.body.classList.remove("bg-[#0F172A]", "text-gray-100");
    }
  }, [theme]);

  // ✅ HÀM TẮT SPLASH SCREEN
  const handleSplashComplete = () => {
      setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem("hasSeenSplash", "true");
      }, 1500);
  };

  // Chưa check xong Auth thì không hiện gì (tránh chớp trang)
  if (!isAuthChecked) return null;

  return (
    <>
      {/* 1. MÀN HÌNH CHÀO MỪNG (SPLASH) */}
      <AnimatePresence>
        {showSplash && (
            <WelcomeSplash onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {/* 2. GIAO DIỆN CHÍNH */}
      <div 
        className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 
          ${theme === "dark" ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"}
          ${showSplash ? "opacity-0" : "opacity-100 transition-opacity duration-1000"} 
        `}
      >
        {/* SIDEBAR (Hiển thị theo logic Responsive) */}
        <AnimatePresence>
            {(isOpen || window.innerWidth >= 768) && (
            <motion.div 
                key="sidebar" 
                initial={{ x: -250, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -250, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`fixed md:fixed h-full z-40`} // Sidebar luôn fixed
            >
                <Sidebar 
                    collapsed={sidebarCollapsed} 
                    setCollapsed={setSidebarCollapsed} 
                    theme={theme} 
                    setTheme={setTheme} 
                    isMobile={window.innerWidth < 768}
                />
            </motion.div>
            )}
        </AnimatePresence>

        {/* OVERLAY CHO MOBILE (Khi mở menu) */}
        {isOpen && window.innerWidth < 768 && (
            <div 
                className="fixed inset-0 bg-black/50 z-30"
                onClick={() => setIsOpen(false)}
            />
        )}

        {/* MAIN CONTENT (NỘI DUNG CHÍNH) */}
        <motion.main 
            key="main-content" 
            className={`flex-1 min-h-screen p-6 transition-all duration-300 ${theme === "dark" ? "bg-[#111827]" : "bg-white"}`}
            initial={{ opacity: 0 }} 
            animate={{ 
                opacity: 1, 
                // Tự động đẩy lề trái để tránh bị Sidebar đè
                marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? "6rem" : "18rem") : "0" 
            }}
        >
            {/* Nút Menu Mobile */}
            <button className="md:hidden fixed top-4 left-4 z-50 bg-purple-600 p-2 rounded-lg shadow hover:bg-purple-700 transition" onClick={() => setIsOpen(!isOpen)}>
                <Menu size={22} className="text-white" />
            </button>

            <div className="mt-10 md:mt-0 transition-all duration-300">
                {/* TRUYỀN CONTEXT CHO CÁC TRANG CON:
                    - currencyCode: Để hiển thị tiền tệ đúng (USD/VND).
                    - refreshUserProfile: Để trang Profile gọi sau khi update.
                */}
                <Outlet context={{ 
                    theme, 
                    setTheme, 
                    currentUser, 
                    refreshUserProfile, 
                    currencyCode: currentUser?.currency_code || "USD" 
                }} />
            </div>

            {/* CHATBOT LUÔN HIỂN THỊ */}
            <FinBotWidget />
        </motion.main>

      </div>
    </>
  );
}