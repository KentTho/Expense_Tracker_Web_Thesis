// layouts/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; 
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
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [theme, setTheme] = useState("dark");
  
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // State Splash: Lấy từ Session
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("hasSeenSplash"));
  
  // State Tour
  const [runTour, setRunTour] = useState(false);

  const navigate = useNavigate();

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
        setIsAuthChecked(true); // Đã check xong
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 3. Logic Kích hoạt Tour (Chạy khi Splash vừa tắt)
  useEffect(() => {
    if (!showSplash && isAuthChecked && currentUser) {
        // ✅ KIỂM TRA CHÍNH XÁC: User có has_onboard = false không?
        // Lưu ý: Dùng đúng tên biến 'has_onboard' (khớp với DB)
        if (currentUser.has_onboard === false) {
             console.log("✨ User mới -> Bật Tour sau 1s");
             setTimeout(() => setRunTour(true), 1000);
        }
    }
  }, [showSplash, isAuthChecked, currentUser]);

  // 4. Xử lý khi Splash xong
  const handleSplashComplete = () => {
      setShowSplash(false);
      sessionStorage.setItem("hasSeenSplash", "true");
  };

  // 5. Xử lý khi Tour xong
  const handleTourFinish = async () => {
      setRunTour(false);
      
      // Update State ngay lập tức để UI không bị giật
      if (currentUser) {
          const updated = { ...currentUser, has_onboard: true };
          setCurrentUser(updated);
      }

      // Gọi API lưu DB
      try {
          // ✅ SỬA TÊN BIẾN: has_onboard
          await updateUserProfile({ has_onboard: true });
      } catch (e) { console.error(e); }
  };

  // Theme & Responsive
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsOpen(true); else setIsOpen(false); };
    handleResize(); window.addEventListener("resize", handleResize); return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (theme === "dark") { document.documentElement.className = 'dark'; document.body.classList.add("bg-[#0F172A]", "text-gray-100"); }
    else { document.documentElement.className = 'light'; document.body.classList.add("bg-gray-100", "text-gray-900"); }
  }, [theme]);

  if (!isAuthChecked) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div key="splash">
            <WelcomeSplash onComplete={handleSplashComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHỈ HIỆN DASHBOARD KHI SPLASH ĐÃ TẮT */}
      {!showSplash && (
          <div className={`flex min-h-screen relative overflow-hidden transition-colors duration-300 ${theme === "dark" ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"}`}>
            
            <AnimatePresence>
                {(isOpen || window.innerWidth >= 768) && (
                <motion.div key="sidebar" initial={{ x: -250 }} animate={{ x: 0 }} exit={{ x: -250 }} className={`fixed md:fixed h-full z-40`}>
                    <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} theme={theme} setTheme={setTheme} isMobile={window.innerWidth < 768}/>
                </motion.div>
                )}
            </AnimatePresence>
            
            {isOpen && window.innerWidth < 768 && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />}

            <motion.main 
                key="main-content" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                className={`flex-1 min-h-screen p-6 transition-all duration-300 ${theme === "dark" ? "bg-[#111827]" : "bg-white"}`}
                style={{ marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? "6rem" : "18rem") : "0" }}
            >
                <button className="md:hidden fixed top-4 left-4 z-50 bg-purple-600 p-2 rounded-lg shadow" onClick={() => setIsOpen(!isOpen)}><Menu size={22} className="text-white" /></button>
                <div className="mt-10 md:mt-0 transition-all duration-300">
                    <Outlet context={{ theme, setTheme, currentUser, refreshUserProfile, currencyCode: currentUser?.currency_code || "USD" }} />
                </div>
                <FinBotWidget />
            </motion.main>
            
            {/* APP GUIDE */}
            {runTour && (
                <AppGuide 
                    run={true} 
                    theme={theme}
                    onFinish={handleTourFinish} 
                />
            )}
        </div>
      )}
    </>
  );
}