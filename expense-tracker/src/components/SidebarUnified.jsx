import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  Download,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MenuSquare,
  Moon,
  Palette,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  Wallet,
} from "lucide-react";
import logo from "../assets/logo.png";
import LanguageSwitcher from "./LanguageSwitcher";
import { logout } from "../services/authService";

function getInitials(name) {
  if (!name) {
    return "ET";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

const personalSections = [
  {
    label: "Command",
    items: [
      { label: "Overview", to: "/dashboard", icon: Home },
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Flow",
    items: [
      { label: "Income", to: "/income", icon: ArrowLeftRight },
      { label: "Expense", to: "/expense", icon: Wallet },
      { label: "Categories", to: "/categories", icon: Palette },
      { label: "Exports", to: "/dataexport", icon: Download },
    ],
  },
  {
    label: "Profile",
    items: [
      { label: "Security", to: "/security", icon: Lock },
      { label: "Profile", to: "/profile", icon: User },
    ],
  },
];

const adminSections = [
  {
    label: "Admin",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Default Categories", to: "/admin/categories", icon: Shield },
      { label: "Settings", to: "/admin/system", icon: Settings2 },
      { label: "Audit Logs", to: "/admin/logs", icon: MenuSquare },
    ],
  },
];

export default function SidebarUnified({
  collapsed,
  setCollapsed,
  theme,
  setTheme,
  isMobile,
  isOpen,
  onClose,
  currentUser,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const user = currentUser || storedUser;
  const isAdmin = Boolean(user?.is_admin);
  const isDark = theme === "dark";
  const isAdminView = location.pathname.startsWith("/admin");
  const sections = useMemo(() => (isAdminView ? adminSections : personalSections), [isAdminView]);
  const widthClass = isMobile ? "w-[18.5rem]" : collapsed ? "w-24" : "w-80";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 ${widthClass} px-3 py-3 transition-transform duration-300 ${
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
      }`}
    >
      <div
        className={`flex h-full flex-col overflow-hidden rounded-[2rem] border shadow-2xl backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-slate-950/85 text-slate-100 shadow-cyan-950/40"
            : "border-white/70 bg-white/80 text-slate-900 shadow-orange-200/70"
        }`}
      >
        <div className="px-4 pb-4 pt-5">
          <div className={`flex items-center ${collapsed && !isMobile ? "justify-center" : "justify-between"} gap-3`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 ${
                isDark ? "border-white/10 bg-white/5 shadow-inner" : "border-slate-200 bg-white shadow-sm"
              }`}>
                <img src={logo} alt="Expense Tracker" className="h-6 w-6 object-contain" />
              </div>

              {(!collapsed || isMobile) && (
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isDark ? "text-cyan-400" : "text-orange-500"}`}>Moneyboard</p>
                  <h2 className="truncate text-lg font-black tracking-tight">FinBot</h2>
                </div>
              )}
            </div>

            {!collapsed && !isMobile && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all hover:scale-105 ${
                  isDark ? "border-white/10 bg-white/5 text-slate-400 hover:text-slate-100" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                <ArrowLeftRight size={14} className="rotate-45" />
              </button>
            )}
          </div>

          {(!collapsed || isMobile) && (
            <div
              className={`mt-5 rounded-3xl border p-4 shadow-sm transition-all duration-300 ${
                isDark
                  ? "border-white/5 bg-gradient-to-br from-white/[0.08] to-transparent"
                  : "border-slate-200/60 bg-gradient-to-br from-slate-50 to-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user?.name || "User"} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-orange-400 text-sm font-black text-slate-950 shadow-lg">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 ${isDark ? "border-slate-900 bg-emerald-400" : "border-white bg-emerald-500"} shadow-sm`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight">{user?.name || "Workspace member"}</p>
                  <p className={`truncate text-[11px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>{user?.email || "No email"}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-slate-700/20 pt-4">
                <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold ${isDark ? "bg-white/5 text-cyan-300" : "bg-slate-100 text-slate-600"}`}>
                  <Sparkles size={10} className="text-cyan-400" />
                  {user?.currency_code || "USD"}
                </div>
                <div className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold ${isDark ? "bg-orange-500/10 text-orange-300" : "bg-orange-50 text-orange-600"}`}>
                  {isAdmin ? "Admin Access" : "Personal Zone"}
                </div>
              </div>
            </div>
          )}
        </div>

        {isAdmin && (!collapsed || isMobile) && (
          <div className="px-4 pt-4">
            <div className={`grid grid-cols-2 gap-2 rounded-2xl p-1 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => {
                  navigate("/dashboard");
                  onClose?.();
                }}
                className={`rounded-2xl px-3 py-3 text-xs font-bold transition ${
                  !isAdminView ? "bg-cyan-500 text-slate-950" : isDark ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/admin/dashboard");
                  onClose?.();
                }}
                className={`rounded-2xl px-3 py-3 text-xs font-bold transition ${
                  isAdminView ? "bg-orange-400 text-slate-950" : isDark ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-4 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.label} className="mb-8 last:mb-0">
              {(!collapsed || isMobile) && (
                <div className="flex items-center gap-2 mb-3 px-3">
                  <div className={`h-px flex-1 ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {section.label}
                  </p>
                  <div className={`h-px w-4 ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
                </div>
              )}

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                        active
                          ? isDark 
                            ? "bg-cyan-500/10 text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]"
                            : "bg-orange-500/10 text-orange-600 shadow-[inset_0_0_20px_rgba(251,146,60,0.05)]"
                          : isDark
                          ? "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      } ${collapsed && !isMobile ? "justify-center px-0 mx-auto w-12 h-12" : ""}`}
                    >
                      {active && !collapsed && (
                        <div className={`absolute left-0 top-1/4 h-1/2 w-1 rounded-full ${isDark ? "bg-cyan-400" : "bg-orange-400"}`} />
                      )}
                      
                      <Icon 
                        size={18} 
                        className={`transition-transform duration-300 group-hover:scale-110 ${
                          active ? "text-current" : "opacity-70 group-hover:opacity-100"
                        }`} 
                      />
                      
                      {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      
                      {active && !collapsed && (
                        <div className={`ml-auto h-1.5 w-1.5 rounded-full ${isDark ? "bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "bg-orange-400/50 shadow-[0_0_8px_rgba(251,146,60,0.5)]"}`} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-6 border-t border-white/5">
          {(!collapsed || isMobile) && (
            <div className={`mb-4 rounded-2xl border p-3.5 transition-all ${isDark ? "border-white/5 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-cyan-400" : "text-orange-500"}`}>Appearance</p>
                  <p className={`mt-0.5 text-[11px] font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Theme preference
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 ${
                    isDark ? "bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]" : "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  }`}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className={`flex flex-col gap-2`}>
            {(!collapsed || isMobile) && (
              <div
                className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                  isDark ? "border-white/5 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Palette size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />
                  <LanguageSwitcher />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`group inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                isDark 
                  ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white" 
                  : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-600/20"
              } ${collapsed && !isMobile ? "w-12 h-12 p-0 mx-auto" : "w-full"}`}
            >
              <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
              {(!collapsed || isMobile) && "Logout"}
            </button>
          </div>

          {collapsed && !isMobile && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={`inline-flex h-12 w-full items-center justify-center rounded-2xl border transition-all hover:scale-105 ${
                  isDark ? "border-white/5 bg-white/5 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-900 hover:text-white shadow-sm"
                }`}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate(isAdminView ? "/dashboard" : "/admin/dashboard")}
                  className={`inline-flex h-12 w-full items-center justify-center rounded-2xl border transition-all hover:scale-105 ${
                    isDark 
                      ? "border-white/5 bg-orange-400/10 text-orange-300 hover:bg-orange-400 hover:text-slate-950" 
                      : "border-slate-200 bg-white text-orange-600 hover:bg-orange-600 hover:text-white shadow-sm"
                  }`}
                >
                  {isAdminView ? <Sparkles size={18} /> : <ShieldCheck size={18} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
