// pages/SecuritySettings.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  RefreshCw,
  LogOut,
  Smartphone,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Key,
  MailWarning
} from "lucide-react";
// ✅ IMPORT THÊM ToastContainer và CSS
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { auth } from "../../components/firebase";
import { onAuthStateChanged, getIdToken, signOut } from "firebase/auth";
import { getSecuritySettings, updateSecuritySettings, start2FA, verify2FA } from "../../services/securityService"; 

// ===========================
// 💡 COMPONENT: CUSTOM TOGGLE SWITCH
// ===========================
const ToggleSwitch = ({ checked, onChange, name, disabled }) => (
  <div 
    onClick={() => !disabled && onChange({ target: { name, checked: !checked } })}
    className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
      checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <div
      className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
        checked ? "translate-x-7" : "translate-x-0"
      }`}
    />
  </div>
);

export default function SecuritySettings() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // --- STATES ---
  const [sessionInfo, setSessionInfo] = useState({
    token: "Loading...",
    userId: "Loading...",
    expiresAt: "Loading...",
  });
  const [sessionActive, setSessionActive] = useState(true);

  const [settings, setSettings] = useState({
    is_2fa_enabled: false,
    restrict_multi_device: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // --- LOGIC FETCH DATA ---
  const fetchSessionInfo = useCallback(async () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setSessionInfo({
            token: tokenResult.token,
            userId: user.uid,
            expiresAt: tokenResult.expirationTime,
          });
          setSessionActive(true);
        } catch (error) {
          toast.error("Failed to get session token.");
          handleLogout();
        }
      } else {
        setSessionActive(false);
      }
    });
  }, []);

  const fetchSecuritySettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const data = await getSecuritySettings();
      setSettings({
          is_2fa_enabled: data.is_2fa_enabled,
          restrict_multi_device: data.restrict_multi_device 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionInfo();
    fetchSecuritySettings();
  }, [fetchSessionInfo, fetchSecuritySettings]);

  // --- LOGIC XỬ LÝ BẬT/TẮT ---
  const handleSettingsChange = async (e) => {
    const { name, checked } = e.target;
    
    // 1. Xử lý logic 2FA
    if (name === "is_2fa_enabled") {
        if (checked) {
            // ✅ KIỂM TRA EMAIL
            const user = auth.currentUser;
            if (user) {
                await user.reload(); 
                
                if (!user.emailVerified) {
                    // ✅ HIỂN THỊ TOAST (Giờ sẽ hiện vì đã có ToastContainer)
                    toast.error(
                        <div>
                            <p className="font-bold flex items-center gap-2">
                                <MailWarning size={18}/> Email Verification Required!
                            </p>
                            <p className="text-sm mt-1">Please verify your email first.</p>
                        </div>
                    );
                    
                    setTimeout(() => navigate("/profile"), 2500);
                    return; 
                }
            }
            handleStart2FA(); 
        } else {
             try {
                await updateSecuritySettings({ is_2fa_enabled: false });
                if (settings.restrict_multi_device) {
                    await updateSecuritySettings({ restrict_multi_device: false });
                    setSettings(prev => ({ ...prev, is_2fa_enabled: false, restrict_multi_device: false }));
                    toast.info("2FA & Single Device Mode Disabled.");
                } else {
                    setSettings(prev => ({ ...prev, is_2fa_enabled: false }));
                    toast.info("2FA Disabled.");
                }
            } catch (err) { toast.error("Failed to update"); }
        }
        return;
    }

    // 2. Xử lý logic Single Device Mode
    if (name === "restrict_multi_device") {
        if (checked && !settings.is_2fa_enabled) {
            toast.warn("🔒 Requirement: You must enable 2FA before using this feature!");
            return;
        }
    }

    setSettings(prev => ({ ...prev, [name]: checked }));
    try {
      await updateSecuritySettings({ [name]: checked });
      if (name === 'restrict_multi_device') {
          toast.success(checked ? "Single Device Mode Enabled 🛡️" : "Single Device Mode Disabled");
      } else {
          toast.success("Settings updated");
      }
    } catch (error) {
      toast.error(error.message);
      setSettings(prev => ({ ...prev, [name]: !checked }));
    }
  };

  const handleStart2FA = async () => {
    try {
      const data = await start2FA();
      setQrCodeUrl(data.qr_url); 
      setShow2FAModal(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await verify2FA(verificationCode);
      toast.success("2FA Enabled Successfully!");
      setSettings(prev => ({ ...prev, is_2fa_enabled: true }));
      setShow2FAModal(false);
      setVerificationCode("");
    } catch (error) {
      toast.error(error.message || "Invalid code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefreshToken = async () => {
    toast.info("Refreshing token...");
    try {
      const user = auth.currentUser;
      if (user) {
        await getIdToken(user, true);
        await fetchSessionInfo();
        toast.success("Token refreshed!");
      }
    } catch (error) {
      toast.error("Failed to refresh token.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setSessionActive(false);
    toast.success("Logged out.");
    setTimeout(() => navigate("/login"), 800);
  };

  const QRCodeComponent = ({ url }) => (
    <div className="p-4 bg-white rounded-xl shadow-inner">
      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`} alt="QR Code" className="mix-blend-multiply" />
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      {/* ✅ BỔ SUNG TOAST CONTAINER ĐỂ HIỆN THÔNG BÁO */}
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />

      <main className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Shield className="text-blue-500" size={36} />
              Security Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your session, authentication methods, and device security.
            </p>
          </div>
          
          <div className={`px-5 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg ${
             sessionActive ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/50" : "bg-red-500/10 text-red-500 ring-1 ring-red-500/50"
          }`}>
             <div className={`w-2.5 h-2.5 rounded-full ${sessionActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
             {sessionActive ? "System Secure & Active" : "Session Inactive"}
          </div>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT 1: SESSION INFO */}
          <div className={`lg:col-span-1 p-6 rounded-2xl shadow-2xl flex flex-col justify-between border-t-4 border-blue-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-500">
                    <Key size={20} /> Session Credentials
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Firebase User ID</p>
                        <div className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
                            <Lock size={16} className="text-gray-400" />
                            <span className="font-mono text-lg tracking-widest text-gray-500">••••••••••••••••</span>
                        </div>
                    </div>
                    <div>
                         <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Session Expires At</p>
                         <p className="text-sm font-medium text-gray-400">
                            {sessionInfo.expiresAt !== "Loading..." 
                                ? new Date(sessionInfo.expiresAt).toLocaleString() 
                                : "Loading..."}
                         </p>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col gap-3">
                 <button onClick={handleRefreshToken} className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}>
                    <RefreshCw size={18} className={loadingSettings ? "animate-spin" : ""} /> Refresh Session
                 </button>
                 <button onClick={handleLogout} className="w-full py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all">
                    <LogOut size={18} /> Terminate Session
                 </button>
            </div>
          </div>

          {/* CỘT 2: CÁC NÚT BẬT TẮT */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. 2FA CARD */}
            <div className={`p-6 rounded-2xl shadow-xl flex items-center justify-between transition-all ${isDark ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${settings.is_2fa_enabled ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}>
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                           Add an extra layer of security requiring a verification code.
                        </p>
                        {settings.is_2fa_enabled && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                                <CheckCircle size={12} /> Protected
                            </span>
                        )}
                    </div>
                </div>
                <ToggleSwitch 
                    name="is_2fa_enabled"
                    checked={settings.is_2fa_enabled}
                    onChange={handleSettingsChange}
                />
            </div>

            {/* 2. DEVICE LOCK CARD (SINGLE DEVICE MODE) */}
            <div className={`p-6 rounded-2xl shadow-xl flex items-center justify-between transition-all ${isDark ? "bg-gray-800 hover:bg-gray-800/80" : "bg-white hover:bg-gray-50"}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${settings.restrict_multi_device ? "bg-blue-500/20 text-blue-500" : "bg-gray-500/20 text-gray-500"}`}>
                        <Smartphone size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Single Device Mode</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                           Automatically log out other sessions when you log in on a new device.
                        </p>
                        
                        {!settings.is_2fa_enabled && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-2 font-semibold">
                                <Lock size={12} /> Requires 2FA to be enabled first.
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Nút gạt sẽ bị mờ đi nếu chưa bật 2FA */}
                <div className={!settings.is_2fa_enabled ? "opacity-60" : ""}>
                    <ToggleSwitch 
                        name="restrict_multi_device"
                        checked={settings.restrict_multi_device}
                        onChange={handleSettingsChange}
                    />
                </div>
            </div>

             {/* 3. ALERT CARD */}
            <div className={`mt-6 p-4 rounded-xl border-l-4 flex items-start gap-3 ${isDark ? "bg-yellow-500/10 border-yellow-500 text-yellow-200" : "bg-yellow-50 border-yellow-500 text-yellow-800"}`}>
                <AlertTriangle className="flex-shrink-0" size={20} />
                <div>
                    <h4 className="font-bold text-sm">Security Notice</h4>
                    <p className="text-xs mt-1 opacity-90">
                        Enable both features for maximum security. Always ensure your recovery email is up to date.
                    </p>
                </div>
            </div>

          </div>
        </div>

      </main>

      {/* --- 2FA MODAL --- */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode size={32} />
                </div>
                <h2 className="text-2xl font-bold">Setup 2FA</h2>
                <p className="text-sm text-gray-500 mt-2">
                   Scan this QR code with Google Authenticator or Authy App.
                </p>
            </div>
            <div className="flex justify-center mb-6">
                {qrCodeUrl ? <QRCodeComponent url={qrCodeUrl} /> : <Loader2 className="animate-spin text-blue-500" size={40} />}
            </div>
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Verification Code</label>
                  <input 
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000 000"
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-[0.5em] border outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button type="button" onClick={() => setShow2FAModal(false)} className={`px-4 py-3 rounded-xl font-medium transition ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>Cancel</button>
                <button type="submit" disabled={isVerifying} className="px-4 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex justify-center items-center">{isVerifying ? <Loader2 className="animate-spin" /> : "Activate 2FA"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}