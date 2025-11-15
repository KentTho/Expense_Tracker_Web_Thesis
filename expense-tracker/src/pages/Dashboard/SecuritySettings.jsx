import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  RefreshCw,
  LogOut,
  KeyRound,
  AlertTriangle,
  Loader2,
  QrCode,
} from "lucide-react";
import { toast } from "react-toastify";
import { auth } from "../../components/firebase";// Import auth từ Firebase
import { onAuthStateChanged, getIdToken, signOut } from "firebase/auth";

// Import các service API mới (Giả sử bạn đã tạo file này)
import { getSecuritySettings, updateSecuritySettings, start2FA, verify2FA } from "../../services/securityService"; 

export default function SecuritySettings() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // State cho thông tin session (Từ Firebase)
  const [sessionInfo, setSessionInfo] = useState({
    token: "Loading...",
    userId: "Loading...",
    expiresAt: "Loading...",
  });
  const [sessionActive, setSessionActive] = useState(true);

  // State cho cài đặt bảo mật (Từ BE)
  const [settings, setSettings] = useState({
    is_2fa_enabled: false,
    restrict_multi_device: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // State cho quá trình bật 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);


  // 1. Lấy thông tin Session từ Firebase
  const fetchSessionInfo = useCallback(async () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          setSessionInfo({
            token: tokenResult.token,
            userId: user.uid, // Firebase UID
            expiresAt: tokenResult.expirationTime,
          });
          setSessionActive(true);
        } catch (error) {
          toast.error("Failed to get session token.");
          handleLogout();
        }
      } else {
        // Đã đăng xuất hoặc chưa đăng nhập
        setSessionActive(false);
        // Không tự động điều hướng từ đây, để user có thể ở trang login
      }
    });
  }, []); // Bỏ navigate ra khỏi dependency

  // 2. Lấy Cài đặt Bảo mật từ BE
  const fetchSecuritySettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const data = await getSecuritySettings();
      setSettings(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Effect chính: Tải cả hai khi component mount
  useEffect(() => {
    fetchSessionInfo();
    fetchSecuritySettings();
  }, [fetchSessionInfo, fetchSecuritySettings]);


  // 3. Xử lý Cập nhật Cài đặt
  const handleSettingsChange = async (e) => {
    const { name, checked } = e.target;
    
    // Nếu bật 2FA, mở modal thay vì cập nhật ngay
    if (name === "is_2fa_enabled" && checked) {
      handleStart2FA();
      return;
    }

    // Cập nhật state ngay lập tức
    setSettings(prev => ({ ...prev, [name]: checked }));

    // Gửi cập nhật lên BE
    try {
      await updateSecuritySettings({ [name]: checked });
      toast.success(`Setting ${name} updated!`);
    } catch (error) {
      toast.error(`Failed to update ${name}. Reverting...`);
      // Rollback nếu lỗi
      setSettings(prev => ({ ...prev, [name]: !checked }));
    }
  };

  // 4. Xử lý Bật 2FA (Bước 1: Lấy QR)
  const handleStart2FA = async () => {
    try {
      const data = await start2FA();
      setQrCodeUrl(data.qr_url); 
      setShow2FAModal(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 5. Xử lý Bật 2FA (Bước 2: Xác thực Code)
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await verify2FA(verificationCode);
      toast.success("✅ 2FA Enabled Successfully!");
      setSettings(prev => ({ ...prev, is_2fa_enabled: true }));
      setShow2FAModal(false);
      setVerificationCode("");
    } catch (error) {
      toast.error(error.message || "Invalid code. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };


  // 6. Xử lý Session (Firebase)
  const handleRefreshToken = async () => {
    toast.info("🔄 Requesting new token from Firebase...");
    try {
      const user = auth.currentUser;
      if (user) {
        await getIdToken(user, true); // true = force refresh
        await fetchSessionInfo(); // Lấy lại thông tin mới
        toast.success("✅ Token refreshed successfully!");
      }
    } catch (error) {
      toast.error("Failed to refresh token.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setSessionActive(false);
    toast.success("👋 Logged out successfully!");
    setTimeout(() => navigate("/login"), 800);
  };

  // (Mock component QR Code - bạn nên dùng thư viện thật)
  const QRCodeComponent = ({ url }) => (
    <div className="p-4 bg-white rounded-lg">
      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`} alt="QR Code" />
      <p className="text-xs text-black text-center mt-2">Scan with your Authenticator App</p>
    </div>
  );


  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <main className="p-8 space-y-10 max-w-4xl mx-auto">
        {/* --- Header --- */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="text-blue-500" /> Security & Session
          </h1>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              sessionActive
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {sessionActive ? "Session Active" : "Session Expired"}
          </div>
        </div>

        {/* --- Session Information (Firebase) --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock /> Session Information
          </h3>

          <div className="space-y-3 text-sm">
            {/* ✅ TASK 2: ĐÃ ẨN TOKEN */}
            <p>
              <strong>Token:</strong>{" "}
              <span className="text-xs break-all text-gray-400">
                ********************
              </span>
            </p>
            
            {/* ✅ TASK 1: ĐÃ ẨN USER ID */}
            <p>
              <strong>User ID (Firebase):</strong>{" "}
              <span className="text-gray-400">********************</span>
            </p>

            <p>
              <strong>Expires At:</strong>{" "}
              {new Date(sessionInfo.expiresAt).toLocaleString()}
            </p> 
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRefreshToken}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              <RefreshCw size={16} /> Refresh Token
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition"
            >
              <LogOut size={16} /> Force Logout
            </button>
          </div>
        </div>

        {/* --- Advanced Security Settings (BE) --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg relative ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          {loadingSettings && (
             <div className="absolute inset-0 bg-black/30 flex justify-center items-center rounded-2xl">
                <Loader2 className="animate-spin" />
             </div>
          )}
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <KeyRound /> Advanced Security Settings
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10">
              <span>Enable Two-Factor Authentication (2FA)</span>
              <input 
                type="checkbox" 
                name="is_2fa_enabled"
                checked={settings.is_2fa_enabled}
                onChange={handleSettingsChange}
                className="w-5 h-5 accent-blue-500" 
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10">
              <span>Restrict Multiple Device Sessions</span>
              <input 
                type="checkbox" 
                name="restrict_multi_device"
                checked={settings.restrict_multi_device}
                onChange={handleSettingsChange}
                className="w-5 h-5 accent-blue-500" 
              />
            </div>
          </div>
        </div>

        {/* --- Alert Card --- */}
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            isDark ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-700"
          }`}
        >
          <AlertTriangle size={18} />
          <p className="text-sm">
            Warning: Logging out will terminate your current session on this device.
          </p>
        </div>
      </main>

      {/* --- 2FA Modal --- */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${isDark ? "bg-[#1e293b]" : "bg-white"} max-w-sm w-full`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <QrCode /> Enable Two-Factor Authentication
            </h2>
            
            <p className="text-sm mb-4">
              Scan the QR code below with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code.
            </p>

            {qrCodeUrl ? (
              <div className="flex justify-center mb-4">
                <QRCodeComponent url={qrCodeUrl} />
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <Loader2 className="animate-spin" />
              </div>
            )}
            
            <form onSubmit={handleVerify2FA}>
              <label className="text-sm mb-1 block">Verification Code</label>
              <input 
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-gray-100 border-gray-300"
                }`}
              />
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-400 text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex justify-center"
                >
                  {isVerifying ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}