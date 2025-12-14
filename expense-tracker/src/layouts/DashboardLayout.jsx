// layouts/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../components/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import FinBotWidget from "../components/FinBotWidget";
import { getUserProfile, updateUserProfile } from "../services/profileService"; 
import WelcomeSplash from "../components/WelcomeSplash";
import AppGuide from "../components/AppGuide"; 

export default function DashboardLayout() {
  // State quản lý UI
  const [isOpen, setIsOpen] = useState(false); // Trạng thái mở menu Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop: Mặc định mở rộng
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [theme, setTheme] = useState("dark");
  
  // State Auth & User
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [runTour, setRunTour] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 1. Hàm lấy User mới nhất
  const refreshUserProfile = async () => {
    try {
        const data = await getUserProfile();
        setCurrentUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        return data; 
    } catch (error) {
        console.error("Fetch profile failed", error);
        return null;
    }
  };

  // 2. Check Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const localToken = localStorage.getItem("idToken");
      if (!user || !localToken) {
        localStorage.removeItem("idToken"); localStorage.removeItem("user");
        navigate("/login");
      } else {
        await refreshUserProfile();
        setIsAuthChecked(true); 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 3. Xử lý Resize & Mobile Detection
  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (!mobile) setIsOpen(true); // Desktop luôn hiện
        else setIsOpen(false); // Mobile mặc định ẩn
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 4. Tự đóng Menu khi chuyển trang trên Mobile
  useEffect(() => {
      if (isMobile) {
          setIsOpen(false);
      }
  }, [location.pathname, isMobile]);

  // Logic Tour & Theme
  useEffect(() => {
    if (!showSplash && isAuthChecked && currentUser?.has_onboard === false) {
         setTimeout(() => setRunTour(true), 2500);
    }
  }, [showSplash, isAuthChecked, currentUser]);

  useEffect(() => {
    if (theme === "dark") { document.documentElement.className = 'dark'; document.body.classList.add("bg-[#0F172A]", "text-gray-100"); }
    else { document.documentElement.className = 'light'; document.body.classList.add("bg-gray-100", "text-gray-900"); }
  }, [theme]);

  const handleTourFinish = async () => {
      setRunTour(false);
      if (currentUser) setCurrentUser({ ...currentUser, has_onboard: true });
      try { await updateUserProfile({ has_onboard: true }); } catch (e) {}
  };

  if (!isAuthChecked) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div key="splash">
            <WelcomeSplash onComplete={() => setShowSplash(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
          <div className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 ${theme === "dark" ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"}`}>
            
            {/* SIDEBAR WRAPPER */}
            <AnimatePresence>
                {(isOpen || !isMobile) && (
                <motion.div 
                    key="sidebar" 
                    initial={isMobile ? { x: -280 } : { x: 0 }} 
                    animate={{ x: 0 }} 
                    exit={isMobile ? { x: -280 } : { x: 0 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`fixed md:fixed h-full z-50`}
                >
                    <Sidebar 
                        collapsed={isMobile ? false : sidebarCollapsed} 
                        setCollapsed={isMobile ? () => {} : setSidebarCollapsed} 
                        theme={theme} 
                        setTheme={setTheme} 
                        isMobile={isMobile}
                    />
                </motion.div>
                )}
            </AnimatePresence>
            
            {/* OVERLAY CHO MOBILE */}
            {isOpen && isMobile && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
                    onClick={() => setIsOpen(false)} 
                />
            )}

            {/* MAIN CONTENT */}
            <motion.main 
                key="main-content" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`flex-1 min-h-screen transition-all duration-300 ${theme === "dark" ? "bg-[#111827]" : "bg-white"}`}
                style={{ 
                    marginLeft: !isMobile ? (sidebarCollapsed ? "6rem" : "18rem") : "0" 
                }}
            >
                {/* 🔥 FIX: Nút Menu Mobile Floating (Trôi nổi & Tự ẩn) */}
                {!isOpen && (
                     <button 
                        onClick={() => setIsOpen(true)}
                        className="md:hidden fixed top-4 left-4 z-40 p-3 rounded-xl bg-purple-600 text-white shadow-xl shadow-purple-500/30 active:scale-95 transition-all hover:scale-105 animate-fadeIn"
                     >
                        <Menu size={24} />
                     </button>
                )}

                {/* Nội dung trang (Thêm padding-top trên mobile để ko bị nút che) */}
                <div className="p-4 md:p-6 pt-16 md:pt-6">
                    <Outlet context={{ theme, setTheme, currentUser, refreshUserProfile, currencyCode: currentUser?.currency_code || "USD" }} />
                </div>

                <FinBotWidget theme={theme} />
            </motion.main>
            
            {/* APP GUIDE */}
            {runTour && (
                <AppGuide run={true} theme={theme} onFinish={handleTourFinish} />
            )}
        </div>
      )}
    </>
  );
}