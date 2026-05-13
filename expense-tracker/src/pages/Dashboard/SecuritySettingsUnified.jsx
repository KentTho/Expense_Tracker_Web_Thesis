import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  QrCode,
  Shield,
  ShieldCheck,
  Smartphone,
  TimerReset,
  X,
  Lock,
  History,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "../../components/firebase";
import { logout } from "../../services/authService";
import QRCode from "qrcode";
import {
  getSecuritySettings,
  start2FA,
  updateSecuritySettings,
  verify2FA,
} from "../../services/securityService";

// UI Primitives
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import StatusBadge from "../../components/ui/StatusBadge";
import FormField from "../../components/ui/FormField";

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full transition-all duration-300 ${
        checked ? "bg-cyan-400 shadow-lg shadow-cyan-400/20" : "bg-slate-400/20"
      } ${disabled ? "cursor-not-allowed opacity-50" : "hover:brightness-110"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all duration-300 ease-spring ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SecuritySettingsUnified() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    is_2fa_enabled: false,
    restrict_multi_device: false,
  });
  const [sessionMeta, setSessionMeta] = useState({
    expiresAt: "",
    emailVerified: false,
  });
  const [twoFaSetup, setTwoFaSetup] = useState({
    open: false,
    qr_url: "",
    qrDataUrl: "",
    secret: "",
    code: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadSecurity() {
      const token = localStorage.getItem("idToken");
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [security, tokenInfo] = await Promise.all([
          getSecuritySettings(),
          auth.currentUser ? getIdTokenResult(auth.currentUser) : Promise.resolve(null),
        ]);

        if (!mounted) {
          return;
        }

        setSettings({
          is_2fa_enabled: Boolean(security?.is_2fa_enabled),
          restrict_multi_device: Boolean(security?.restrict_multi_device),
        });
        setSessionMeta({
          expiresAt: tokenInfo?.expirationTime || "",
          emailVerified: Boolean(auth.currentUser?.emailVerified),
        });
      } catch (error) {
        console.error("Failed to load security settings:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSecurity();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleToggle(key, nextValue) {
    if (key === "restrict_multi_device" && nextValue && !settings.is_2fa_enabled) {
      toast.error("Enable 2FA before locking the account to one device.");
      return;
    }

    if (key === "is_2fa_enabled" && nextValue) {
      if (!auth.currentUser?.emailVerified) {
        toast.error("Please verify your email before enabling 2FA.");
        navigate("/profile");
        return;
      }

      try {
        const setup = await start2FA();
        
        let qrDataUrl = "";
        // QR HOTFIX Logic - MUST PRESERVE
        if (setup.qr_url && setup.qr_url.startsWith("otpauth://")) {
          try {
            qrDataUrl = await QRCode.toDataURL(setup.qr_url);
          } catch (qrErr) {
            console.error("Failed to generate QR data URL:", qrErr);
          }
        }

        setTwoFaSetup({
          open: true,
          qr_url: setup.qr_url,
          qrDataUrl: qrDataUrl || setup.qr_url,
          secret: setup.secret,
          code: "",
        });
      } catch (error) {
        toast.error(error.message || "Failed to start 2FA setup.");
      }
      return;
    }

    setSaving(true);
    const optimistic = {
      ...settings,
      [key]: nextValue,
    };

    if (key === "is_2fa_enabled" && !nextValue) {
      optimistic.restrict_multi_device = false;
    }

    setSettings(optimistic);

    try {
      const payload =
        key === "is_2fa_enabled" && !nextValue
          ? { is_2fa_enabled: false, restrict_multi_device: false }
          : { [key]: nextValue };

      const updated = await updateSecuritySettings(payload);
      setSettings({
        is_2fa_enabled: Boolean(updated?.is_2fa_enabled),
        restrict_multi_device: Boolean(updated?.restrict_multi_device),
      });
      toast.success("Security settings updated.");
    } catch (error) {
      console.error("Failed to update security settings:", error);
      setSettings((current) => ({ ...current, [key]: !nextValue }));
      toast.error(error.message || "Could not save security settings.");
    } finally {
      setSaving(false);
    }
  }

  async function complete2FASetup() {
    if (twoFaSetup.code.length !== 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }

    setSaving(true);

    try {
      await verify2FA(twoFaSetup.code);
      const updated = await getSecuritySettings();
      setSettings({
        is_2fa_enabled: Boolean(updated?.is_2fa_enabled),
        restrict_multi_device: Boolean(updated?.restrict_multi_device),
      });
      setTwoFaSetup({ open: false, qr_url: "", qrDataUrl: "", secret: "", code: "" });
      toast.success("Two-factor authentication is now active.");
    } catch (error) {
      toast.error(error.message || "Invalid verification code.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div
          className={`rounded-[2rem] border px-8 py-10 text-center ${
            isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
          }`}
        >
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Inspecting security</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />

      <PageHeader
        title="Security center"
        subtitle="Manage your account protections, 2FA settings, and session lifecycle."
        icon={Shield}
        isDark={isDark}
        eyebrow="Account control"
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_1.2fr]">
        <div className="space-y-8">
          {/* PROTECTIONS SECTION */}
          <SectionCard 
            title="Account protections" 
            description="Toggle advanced security layers to harden your login flow."
            icon={Lock} 
            isDark={isDark}
          >
            <div className="space-y-6">
              <div className={`flex items-center justify-between gap-6 rounded-2xl border p-5 transition ${
                isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${isDark ? "bg-cyan-400/10 text-cyan-400" : "bg-cyan-100 text-cyan-600"}`}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Two-factor authentication</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add an authenticator code requirement when signing in.
                    </p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.is_2fa_enabled} 
                  disabled={saving} 
                  onChange={(value) => handleToggle("is_2fa_enabled", value)} 
                />
              </div>

              <div className={`flex items-center justify-between gap-6 rounded-2xl border p-5 transition ${
                isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${isDark ? "bg-orange-400/10 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Single-device mode</p>
                    <p className="mt-1 text-sm text-slate-400">
                      If enabled, a new login forces older sessions to sign out.
                    </p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.restrict_multi_device} 
                  disabled={saving} 
                  onChange={(value) => handleToggle("restrict_multi_device", value)} 
                />
              </div>
            </div>
          </SectionCard>

          {/* SESSION METRICS */}
          <SectionCard title="Session lifecycle" icon={History} isDark={isDark}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl border p-5 ${isDark ? "border-white/5 bg-slate-950/40" : "border-slate-100 bg-white shadow-sm"}`}>
                <div className="mb-3 flex items-center justify-between">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity state</p>
                   {sessionMeta.emailVerified ? (
                     <StatusBadge tone="success" icon={CheckCircle} isDark={isDark}>Verified</StatusBadge>
                   ) : (
                     <StatusBadge tone="warning" icon={AlertCircle} isDark={isDark}>Pending</StatusBadge>
                   )}
                </div>
                <p className="text-sm font-bold text-slate-400">Email verification</p>
                <p className="mt-2 text-2xl font-black">
                  {sessionMeta.emailVerified ? "Trust confirmed" : "Verification required"}
                </p>
              </div>

              <div className={`rounded-2xl border p-5 ${isDark ? "border-white/5 bg-slate-950/40" : "border-slate-100 bg-white shadow-sm"}`}>
                <div className="mb-3 flex items-center justify-between">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security TTL</p>
                   <StatusBadge tone="info" icon={Activity} isDark={isDark}>Active</StatusBadge>
                </div>
                <p className="text-sm font-bold text-slate-400">Token expires at</p>
                <p className="mt-2 text-xl font-black tracking-tight">
                  {sessionMeta.expiresAt ? new Date(sessionMeta.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                   {sessionMeta.expiresAt ? new Date(sessionMeta.expiresAt).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-8">
           {/* RECOMMENDATIONS */}
           <SectionCard title="Insights" icon={Activity} isDark={isDark}>
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-400">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">2FA state</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {settings.is_2fa_enabled
                          ? "Your account requires an authenticator code for login."
                          : "Enable 2FA to significantly harden your login flow."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-400">
                      <TimerReset size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Session integrity</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Logout cleans up local tokens and notifies the server to revoke access.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 py-4 text-sm font-black text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
                >
                  <LogOut size={16} />
                  Terminate session
                </button>
              </div>
           </SectionCard>

           <div className={`rounded-[2rem] border border-dashed p-6 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                 <Shield size={20} />
              </div>
              <h4 className="text-sm font-bold">Privacy notice</h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Security settings are synchronized across all your devices in real-time.</p>
           </div>
        </div>
      </div>

      {/* SETUP MODAL */}
      {twoFaSetup.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl overflow-hidden rounded-[2.5rem] border shadow-2xl animate-in zoom-in-95 duration-300 ${
            isDark ? "border-white/10 bg-slate-900" : "border-white bg-white"
          }`}>
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Enable 2FA</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">Two-factor authentication</p>
                </div>
              </div>
              <button 
                onClick={() => setTwoFaSetup({ open: false, qr_url: "", qrDataUrl: "", secret: "", code: "" })}
                className={`rounded-full p-2 transition ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
                <div className="space-y-6">
                  <div className={`rounded-3xl border p-5 text-center transition ${isDark ? "border-white/5 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                    {twoFaSetup.qrDataUrl || twoFaSetup.qr_url ? (
                      <div className="relative group">
                        <img 
                          src={twoFaSetup.qrDataUrl || twoFaSetup.qr_url} 
                          alt="2FA QR code" 
                          className="mx-auto h-56 w-56 rounded-2xl bg-white p-3 shadow-inner" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                           <QrCode size={40} className="text-slate-900" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-56 items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-cyan-400" />
                      </div>
                    )}
                    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Scan with Authenticator</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Use an app like Google Authenticator or Authy to scan the QR code. If you can't scan, use the manual secret below.
                    </p>

                    <FormField label="Manual secret key" isDark={isDark}>
                       <div className="flex items-center gap-2">
                          <code className="flex-1 break-all rounded-xl bg-slate-950/60 px-4 py-3 text-[11px] font-bold text-cyan-300 border border-white/5">
                            {twoFaSetup.secret}
                          </code>
                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(twoFaSetup.secret);
                              toast.success("Secret copied.");
                            }}
                            className="shrink-0 rounded-xl bg-cyan-400 p-3 text-slate-950 hover:brightness-110 active:scale-95 transition-all"
                          >
                            <Copy size={18} />
                          </button>
                       </div>
                    </FormField>

                    <FormField label="Verification code" isDark={isDark} required>
                       <input
                        type="text"
                        maxLength={6}
                        value={twoFaSetup.code}
                        onChange={(event) =>
                          setTwoFaSetup((current) => ({
                            ...current,
                            code: event.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="000000"
                        className="text-center text-3xl font-black tracking-[0.3em]"
                      />
                    </FormField>
                  </div>

                  <button
                    type="button"
                    onClick={complete2FASetup}
                    disabled={saving || twoFaSetup.code.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-4 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Complete setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
