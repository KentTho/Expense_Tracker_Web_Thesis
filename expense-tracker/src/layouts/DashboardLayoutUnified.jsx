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
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
          <p className="mt-4 text-sm uppercase tracking-[0.25em] text-slate-400">Syncing workspace</p>
        </div>
      </div>
    );
  }

  const contentOffset = isMobile ? 0 : sidebarCollapsed ? 120 : 344;

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.15),_transparent_24%)]">
        <div className="absolute inset-0 hidden bg-[linear-gradient(120deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] dark:block" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(248,250,252,0.94),rgba(255,247,237,0.88))] dark:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),transparent)]" />

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
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          />
        )}

        {!isSidebarOpen && isMobile && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/85 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur"
          >
            <Menu size={18} />
            Menu
          </button>
        )}

        <main className="relative z-10 min-h-screen transition-all duration-300" style={{ paddingLeft: contentOffset }}>
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
