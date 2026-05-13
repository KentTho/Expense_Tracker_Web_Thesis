import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../components/firebase";
import FinBotWidget from "../components/FinBotWidget";
import SidebarUnified from "../components/SidebarUnified.jsx";
import { getUserProfile } from "../services/profileService";

const THEME_KEY = "expense-theme";

function getInitialTheme() {
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export default function DashboardLayoutUnified() {
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(getInitialTheme);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1280);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  async function refreshUserProfile() {
    try {
      const data = await getUserProfile();
      setCurrentUser(data);

      const userForStorage = { ...data };
      delete userForStorage.profile_image;
      localStorage.setItem("user", JSON.stringify(userForStorage));
      window.dispatchEvent(new Event("user_profile_updated"));
      return data;
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const token = localStorage.getItem("idToken");

      if (!user || !token) {
        localStorage.removeItem("idToken");
        localStorage.removeItem("user");
        setCurrentUser(null);
        setIsAuthChecked(true);
        navigate("/login", { replace: true });
        return;
      }

      await refreshUserProfile();
      setIsAuthChecked(true);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);

      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.className = theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-stone-100 text-slate-900";
  }, [theme]);

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="relative">
          <div className="absolute inset-0 h-24 w-24 animate-ping rounded-full bg-cyan-500/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/10 bg-slate-900 shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-cyan-400" />
          </div>
          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-400/70 animate-pulse">
            Syncing Vault
          </p>
        </div>
      </div>
    );
  }

  const contentOffset = isMobile ? 0 : sidebarCollapsed ? 112 : 336;

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="relative min-h-screen overflow-hidden selection:bg-cyan-500/30">
        {/* Modern Background */}
        <div className="fixed inset-0 z-0">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === "dark" ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-slate-950" />
            <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${theme === "light" ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-slate-50" />
            <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-orange-200/40 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-200/40 blur-[120px]" />
          </div>
        </div>

        <SidebarUnified
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          setTheme={setTheme}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
        />

        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-md transition-all duration-500"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {!isSidebarOpen && isMobile && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-6 top-6 z-50 inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-950/80 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
          >
            <Menu size={16} className="text-cyan-400" />
            Menu
          </button>
        )}

        <main className="relative z-10 min-h-screen transition-all duration-500 ease-in-out" style={{ paddingLeft: contentOffset }}>
          <div className="min-h-screen p-4 pt-20 lg:p-6 lg:pt-6">
            <Outlet
              context={{
                theme,
                setTheme,
                currentUser,
                refreshUserProfile,
                currencyCode: currentUser?.currency_code || "USD",
              }}
            />
          </div>
        </main>

        <FinBotWidget theme={theme} />
      </div>
    </div>
  );
}
