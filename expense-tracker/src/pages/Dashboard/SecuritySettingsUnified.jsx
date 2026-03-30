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
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getIdTokenResult } from "firebase/auth";
import { auth } from "../../components/firebase";
import { logout } from "../../services/authService";
import {
  getSecuritySettings,
  start2FA,
  updateSecuritySettings,
  verify2FA,
} from "../../services/securityService";

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-16 rounded-full transition ${checked ? "bg-cyan-400" : "bg-slate-400/40"} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? "left-9" : "left-1"}`}
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
    secret: "",
    code: "",
  });

  useEffect(() => {
    let mounted = true;

    async function loadSecurity() {
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
        setTwoFaSetup({
          open: true,
          qr_url: setup.qr_url,
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
      setTwoFaSetup({ open: false, qr_url: "", secret: "", code: "" });
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
    <div className="space-y-6">
      <Toaster position="top-center" />

      <section
        className={`rounded-[2.25rem] border p-6 shadow-xl ${
          isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
        }`}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
              <Shield size={14} />
              Security center
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Protect the account</h1>
            <p className="mt-4 max-w-3xl text-base text-slate-400">
              These controls now talk directly to the backend security endpoints, so 2FA and single-device mode stay
              aligned with backend rules.
            </p>
          </div>

          <div className={`rounded-[1.75rem] border p-5 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Session details</p>
            <div className="mt-5 space-y-3">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Email verification</p>
                <p className="mt-2 text-lg font-black">{sessionMeta.emailVerified ? "Verified" : "Not verified"}</p>
              </div>
              <div className={`rounded-2xl p-4 ${isDark ? "bg-slate-950/60" : "bg-white"}`}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Token expires</p>
                <p className="mt-2 text-lg font-black">
                  {sessionMeta.expiresAt ? new Date(sessionMeta.expiresAt).toLocaleString() : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-lg font-black">Two-factor authentication</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Add an authenticator code requirement when signing in.
                  </p>
                </div>
              </div>
              <Toggle checked={settings.is_2fa_enabled} disabled={saving} onChange={(value) => handleToggle("is_2fa_enabled", value)} />
            </div>
          </div>

          <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-orange-300/15 p-3 text-orange-200">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-lg font-black">Single-device mode</p>
                  <p className="mt-1 text-sm text-slate-400">
                    If enabled, a new login forces older sessions to sign out.
                  </p>
                </div>
              </div>
              <Toggle checked={settings.restrict_multi_device} disabled={saving} onChange={(value) => handleToggle("restrict_multi_device", value)} />
            </div>
          </div>
        </div>

        <div className={`rounded-[2rem] border p-5 shadow-xl ${isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Recommended actions</p>
          <div className="mt-5 space-y-3">
            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                  <KeyRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-black">2FA state</p>
                  <p className="text-xs text-slate-400">
                    {settings.is_2fa_enabled
                      ? "Your account requires an authenticator code."
                      : "Enable 2FA to harden the login flow."}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                  <TimerReset size={18} />
                </div>
                <div>
                  <p className="text-sm font-black">Session lifecycle</p>
                  <p className="text-xs text-slate-400">
                    Use the logout action below if you want to terminate the current authenticated session cleanly.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-rose-500/15 px-5 py-4 text-sm font-black text-rose-300"
            >
              <LogOut size={16} />
              Terminate session
            </button>
          </div>
        </div>
      </section>

      {twoFaSetup.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-[2rem] border p-6 shadow-2xl ${isDark ? "border-white/10 bg-slate-900" : "border-white bg-white"}`}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-lg font-black">Activate two-factor authentication</p>
                <p className="text-sm text-slate-400">
                  Scan the QR code, then confirm with the six-digit code from your authenticator app.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className={`rounded-[1.5rem] border p-4 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
                {twoFaSetup.qr_url ? (
                  <img src={twoFaSetup.qr_url} alt="2FA QR code" className="mx-auto h-52 w-52 rounded-2xl bg-white p-3" />
                ) : (
                  <div className="flex h-52 items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-cyan-400" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50/80"}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Manual secret</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 break-all rounded-2xl bg-slate-950/80 px-3 py-3 text-xs text-cyan-300">
                      {twoFaSetup.secret}
                    </code>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(twoFaSetup.secret);
                        toast.success("Secret copied.");
                      }}
                      className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <label className="block text-sm font-semibold">
                  <span className="mb-2 block text-slate-400">Verification code</span>
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
                    className={`w-full rounded-2xl border px-4 py-4 text-center text-2xl font-black tracking-[0.5em] ${
                      isDark ? "border-white/10 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTwoFaSetup({ open: false, qr_url: "", secret: "", code: "" })}
                    className={`rounded-2xl px-4 py-4 text-sm font-black ${
                      isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={complete2FASetup}
                    disabled={saving || twoFaSetup.code.length !== 6}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-4 text-sm font-black text-slate-950 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Verify
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
