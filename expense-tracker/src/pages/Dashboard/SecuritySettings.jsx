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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { auth } from "../../components/firebase";
import { onAuthStateChanged, getIdToken, signOut } from "firebase/auth";
import { getSecuritySettings, updateSecuritySettings, start2FA, verify2FA } from "../../services/securityService"; 

// ===========================
// 💡 COMPONENT: CUSTOM TOGGLE SWITCH (Mobile Optimized)
// ===========================
const ToggleSwitch = ({ checked, onChange, name, disabled }) => (
  <div 
    onClick={() => !disabled && onChange({ target: { name, checked: !checked } })}
    className={`w-12 h-6 sm:w-14 sm:h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${
      checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <div
      className={`bg-white w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
        checked ? "translate-x-6 sm:translate-x-7" : "translate-x-0"
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
    token: "Verifying...",
    userId: "Loading...",
    expiresAt: null,
  });
  const [sessionActive, setSessionActive] = useState(true);

  const [settings, setSettings] = useState({
    is_2fa_enabled: false,
    restrict_multi_device: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // 2FA Modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState({ qr_url: "", secret: "" });
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);


  // ===========================
  // 🧩 LOGIC: FETCH DATA
  // ===========================
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
          console.warn("Session fetch warning:", error);
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
          is_2fa_enabled: data?.is_2fa_enabled || false,
          restrict_multi_device: data?.restrict_multi_device || false 
      });
    } catch (error) {
      console.warn("Security settings fetch warning (using defaults):", error);
      setSettings({ is_2fa_enabled: false, restrict_multi_device: false });
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionInfo();
    fetchSecuritySettings();
  }, [fetchSessionInfo, fetchSecuritySettings]);

  // ===========================
  // 🧩 HANDLE REFRESH TOKEN (ĐÃ BỔ SUNG)
  // ===========================
  const handleRefreshToken = async () => {
    const toastId = toast.loading("Refreshing session...");
    try {
      const user = auth.currentUser;
      if (user) {
        await getIdToken(user, true);
        await fetchSessionInfo();
        toast.update(toastId, { render: "Session refreshed!", type: "success", isLoading: false, autoClose: 2000 });
      }
    } catch (error) {
      toast.update(toastId, { render: "Failed to refresh.", type: "error", isLoading: false, autoClose: 2000 });
    }
  };

  const handleStart2FA = async () => {
    const toastId = toast.loading("Initializing 2FA setup...");
  
    try {
      const data = await start2FA();
  
      setQrData({
        qr_url: data.qr_url,
        secret: data.secret
      });
  
      setShowQRModal(true);
  
      toast.dismiss(toastId);
      toast.success("Scan QR with Authenticator");
    } catch (error) {
      toast.update(toastId, {
        render: "Failed to start 2FA",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Please enter a 6-digit code.');
      return;
    }
  
    setIsVerifying(true);
  
    try {
      await verify2FA({ code: verifyCode }); // ✅ FIX
  
      toast.success("2FA Enabled Successfully! 🎉");
  
      setSettings(prev => ({
        ...prev,
        is_2fa_enabled: true
      }));
  
      setShowQRModal(false);
      setVerifyCode("");
  
    } catch (error) {
      toast.error(error.message || "Invalid code.");
    } finally {
      setIsVerifying(false); // ✅ FIX
    }
  };

  // --- LOGIC HANDLERS ---
  const handleSettingsChange = async (e) => {
    const { name, checked } = e.target;
  
    // ===== 2FA =====
    if (name === "is_2fa_enabled") {
      if (checked) {
        const user = auth.currentUser;
  
        if (user) {
          await user.reload();
  
          if (!user.emailVerified) {
            toast.error("Please verify your email first.");
            setTimeout(() => navigate("/profile"), 2000);
            return;
          }
        }
  
        handleStart2FA();
      } else {
        try {
          await updateSecuritySettings({ is_2fa_enabled: false });
  
          setSettings(prev => ({
            ...prev,
            is_2fa_enabled: false,
            restrict_multi_device: false
          }));
  
          toast.info("2FA Disabled");
        } catch {
          toast.error("Failed to update settings.");
        }
      }
  
      return;
    }
  
    // ===== RESTRICT DEVICE =====
    if (name === "restrict_multi_device") {
      if (checked && !settings.is_2fa_enabled) {
        toast.warn("Please enable 2FA first!");
        return;
      }
    }
  
    setSettings(prev => ({ ...prev, [name]: checked }));
  
    try {
      await updateSecuritySettings({ [name]: checked });
  
      toast.success(
        name === "restrict_multi_device"
          ? (checked ? "Single Device Enabled 🛡️" : "Single Device Disabled")
          : "Settings updated"
      );
  
    } catch {
      toast.error("Update failed");
  
      // rollback
      setSettings(prev => ({ ...prev, [name]: !checked }));
    }
  };

  // ===========================
  // 🧩 LOGIC: LOGOUT
  // ===========================
  const handleLogout = () => {
    signOut(auth);
    setSessionActive(false);
    toast.success("Logged out successfully.");
    setTimeout(() => navigate("/login"), 800);
  };

  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      <ToastContainer position="top-right" autoClose={3000} theme={isDark ? "dark" : "light"} />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
              <Shield className="text-blue-500" size={28} />
              Security Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Manage authentication and device security.
            </p>
          </div>
          
          <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg ${
             sessionActive ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/50" : "bg-red-500/10 text-red-500 ring-1 ring-red-500/50"
          }`}>
             <div className={`w-2 h-2 rounded-full ${sessionActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
             {sessionActive ? "System Secure" : "Session Inactive"}
          </div>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* CỘT 1: SESSION INFO (Mobile Optimized) */}
          <div className={`lg:col-span-1 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between border-t-4 border-blue-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <div>
                <h3 className="text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 text-blue-500">
                    <Key size={20} /> Session Details
                </h3>
                
                <div className="space-y-4 sm:space-y-6">
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-2">User Identifier</p>
                        <div className={`p-3 rounded-xl flex items-center gap-3 ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
                            <Lock size={16} className="text-gray-400" />
                            {/* Shortened ID for Mobile */}
                            <span className="font-mono text-sm tracking-widest text-gray-500">••••••••••</span>
                        </div>
                    </div>
                    <div>
                         <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500 mb-1">Expires At</p>
                         <p className="text-sm font-medium text-gray-400">
                            {sessionInfo.expiresAt 
                                ? new Date(sessionInfo.expiresAt).toLocaleString() 
                                : "Syncing..."}
                         </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                 <button 
                    onClick={handleRefreshToken} 
                    className={`w-full py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base ${isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                 >
                    <RefreshCw size={16} /> Refresh Session
                 </button>
                 <button 
                    onClick={handleLogout} 
                    className="w-full py-2.5 sm:py-3 rounded-xl font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base"
                 >
                    <LogOut size={16} /> Terminate Session
                 </button>
            </div>
          </div>

          {/* CỘT 2: CÁC NÚT BẬT TẮT (Mobile Optimized) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* 1. 2FA CARD */}
            <div className={`p-4 sm:p-6 rounded-2xl shadow-xl flex items-center justify-between transition-all gap-3 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${settings.is_2fa_enabled ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}>
                        <ShieldCheck size={24} className="sm:w-[28px] sm:h-[28px]" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold">Two-Factor Auth</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] sm:max-w-sm">
                           Require code when login.
                        </p>
                        {settings.is_2fa_enabled && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-wide">
                                <CheckCircle size={10} /> Active
                            </span>
                        )}
                    </div>
                </div>
                <ToggleSwitch 
                    name="is_2fa_enabled"
                    checked={settings.is_2fa_enabled}
                    onChange={handleSettingsChange}
                    disabled={loadingSettings}
                />
            </div>

            {/* 2. DEVICE LOCK CARD */}
            <div className={`p-4 sm:p-6 rounded-2xl shadow-xl flex items-center justify-between transition-all gap-3 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${settings.restrict_multi_device ? "bg-blue-500/20 text-blue-500" : "bg-gray-500/20 text-gray-500"}`}>
                        <Smartphone size={24} className="sm:w-[28px] sm:h-[28px]" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold">Single Device</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] sm:max-w-sm">
                           Log out others when login.
                        </p>
                        
                        {!settings.is_2fa_enabled && (
                            <p className="text-[10px] sm:text-xs text-red-500 flex items-center gap-1 mt-2 font-semibold">
                                <Lock size={10} /> Requires 2FA.
                            </p>
                        )}
                    </div>
                </div>
                
                <div className={!settings.is_2fa_enabled ? "opacity-50 pointer-events-none" : ""}>
                    <ToggleSwitch 
                        name="restrict_multi_device"
                        checked={settings.restrict_multi_device}
                        onChange={handleSettingsChange}
                        disabled={loadingSettings}
                    />
                </div>
            </div>

             {/* 3. ALERT CARD */}
            <div className={`mt-4 sm:mt-6 p-4 rounded-xl border-l-4 flex items-start gap-3 ${isDark ? "bg-yellow-500/10 border-yellow-500 text-yellow-200" : "bg-yellow-50 border-yellow-500 text-yellow-800"}`}>
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
                <div>
                    <h4 className="font-bold text-xs sm:text-sm">Recommendation</h4>
                    <p className="text-[10px] sm:text-xs mt-1 opacity-90 leading-relaxed">
                        Enable 2FA to protect your financial data.
                    </p>
                </div>
            </div>

          </div>
        </div>

      </main>

      {showQRModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm sm:max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <QrCode size={20} /> Kích hoạt 2FA
            </h3>

            <div className="flex flex-col items-center gap-4 mb-6">
              {qrData.qr_url ? (
                <img 
                  src={qrData.qr_url} 
                  alt="QR Code 2FA" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg border"
                />
              ) : (
                <Loader2 className="animate-spin text-blue-500" size={48} />
              )}
              
              <div className="text-center text-sm opacity-80">
                <p>Quét mã QR bằng Google Authenticator / Microsoft Authenticator</p>
                <p className="mt-1 font-mono text-xs break-all">
                  Secret: {qrData.secret}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="Nhập mã 6 số"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className={`w-full px-4 py-3 rounded-xl border text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className={`py-3 rounded-xl font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isVerifying || verifyCode.length !== 6}
                  onClick={handleVerify2FA}
                  className="py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Loader2 className="animate-spin" size={18} /> : null}
                  Xác thực
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}