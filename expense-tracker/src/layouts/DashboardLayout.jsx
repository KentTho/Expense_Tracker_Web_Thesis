// layouts/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../components/firebase"; // ✅ Import Firebase Auth
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../services/profileService";
import FinBotWidget from "../components/FinBotWidget";

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [currentUser, setCurrentUser] = useState(null);
  // ✅ State để kiểm tra xem đã check xong auth chưa
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Hàm để các trang con gọi khi cần cập nhật lại thông tin User (ví dụ sau khi đổi tiền tệ)
  const refreshUserProfile = async () => {
    try {
        const data = await getUserProfile();
        setCurrentUser(data);
        // Cập nhật luôn vào localStorage để đồng bộ
        localStorage.setItem("user", JSON.stringify(data));
    } catch (error) {
        console.error("Failed to refresh user profile", error);
    }
  };
  // ✅ 1. BẢO MẬT: KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const localToken = localStorage.getItem("idToken");
      
      if (!user || !localToken) {
        // ⛔ Nếu không có user Firebase HOẶC không có token trong local
        // -> Xóa sạch và đá về Login
        localStorage.removeItem("idToken");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        // ✅ Đã đăng nhập -> Cho phép hiện nội dung
        setIsAuthChecked(true);
        await refreshUserProfile();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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

  // ✅ Tự cập nhật class cho body
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

  // ⛔ NẾU CHƯA CHECK XONG AUTH, KHÔNG RENDER GÌ CẢ (HOẶC HIỆN LOADING)
  if (!isAuthChecked) {
    return null; // Hoặc return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

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
        {(isOpen || window.innerWidth >= 768) && ( // Logic hiển thị sidebar fix nhẹ
          <motion.div
            key="sidebar"
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
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

      {/* Overlay cho Mobile */}
      {isOpen && window.innerWidth < 768 && (
        <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <motion.main
        key="main-content"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          // Margin left để tránh bị Sidebar đè
          marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? "6rem" : "18rem") : "0",
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
          <Menu size={22} className="text-white" />
        </button>

        {/* Nội dung trang */}
        <div className="mt-10 md:mt-0 transition-all duration-300">
          <Outlet context={{ 
                theme, 
                setTheme, 
                currentUser, 
                refreshUserProfile, // Để Profile.jsx gọi khi save
                currencyCode: currentUser?.currency_code || "USD" // Mặc định USD
            }} />
        </div>

        {/* Chatbot Widget */}
        <FinBotWidget />
      </motion.main>
    </div>
  );
}