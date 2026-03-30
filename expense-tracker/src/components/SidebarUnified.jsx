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
        <div className="border-b border-white/10 px-4 pb-4 pt-5">
          <div className={`flex items-center ${collapsed && !isMobile ? "justify-center" : "justify-between"} gap-3`}>
            <button
              type="button"
              onClick={() => (isMobile ? onClose?.() : setCollapsed(!collapsed))}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
              }`}
            >
              <img src={logo} alt="Expense Tracker" className="h-7 w-7 object-contain" />
            </button>

            {(!collapsed || isMobile) && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-400">Moneyboard</p>
                <h2 className="truncate text-lg font-black">Expense Tracker</h2>
              </div>
            )}

            {!collapsed && !isMobile && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"
                }`}
              >
                Fold
              </button>
            )}
          </div>

          {(!collapsed || isMobile) && (
            <div
              className={`mt-4 rounded-[1.75rem] border p-4 ${
                isDark
                  ? "border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.4))]"
                  : "border-orange-200 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(255,255,255,0.92))]"
              }`}
            >
              <div className="flex items-center gap-3">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt={user?.name || "User"} className="h-14 w-14 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-orange-400 text-lg font-black text-slate-950">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{user?.name || "Workspace member"}</p>
                  <p className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{user?.email || "No email"}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${isDark ? "bg-white/5 text-cyan-300" : "bg-white text-slate-600"}`}>
                  {user?.currency_code || "USD"}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${isDark ? "bg-orange-500/10 text-orange-300" : "bg-orange-50 text-orange-600"}`}>
                  {isAdmin ? "Admin access" : "Personal zone"}
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

        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-5">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              {(!collapsed || isMobile) && (
                <p className={`mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.3em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {section.label}
                </p>
              )}

              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-gradient-to-r from-cyan-400 to-orange-300 text-slate-950 shadow-lg shadow-cyan-400/20"
                          : isDark
                          ? "text-slate-300 hover:bg-white/5 hover:text-white"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      } ${collapsed && !isMobile ? "justify-center px-0" : ""}`}
                    >
                      <Icon size={18} className={active ? "" : "opacity-80 group-hover:opacity-100"} />
                      {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          {(!collapsed || isMobile) && (
            <div className={`mb-4 rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Theme</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Switch your workspace atmosphere
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isDark ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-white"
                  }`}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className={`grid ${collapsed && !isMobile ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
            {(!collapsed || isMobile) && (
              <div
                className={`rounded-2xl border px-3 py-2 ${
                  isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-orange-400">Guide</p>
                <LanguageSwitcher />
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold ${
                isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-600"
              } ${collapsed && !isMobile ? "w-full" : ""}`}
            >
              <LogOut size={16} />
              {(!collapsed || isMobile) && "Logout"}
            </button>
          </div>

          {collapsed && !isMobile && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl ${
                isDark ? "bg-white/5 text-cyan-300" : "bg-slate-100 text-slate-700"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {collapsed && !isMobile && isAdmin && (
            <button
              type="button"
              onClick={() => navigate(isAdminView ? "/dashboard" : "/admin/dashboard")}
              className={`mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl ${
                isDark ? "bg-orange-400/15 text-orange-300" : "bg-orange-50 text-orange-600"
              }`}
            >
              {isAdminView ? <Sparkles size={18} /> : <ShieldCheck size={18} />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
