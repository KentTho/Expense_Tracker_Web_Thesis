import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  RefreshCw,
  LogOut,
  Activity,
  KeyRound,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

export default function SecuritySettings() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [tokenInfo, setTokenInfo] = useState({
    token: localStorage.getItem("idToken") || "N/A",
    expiresIn: "2025-10-10T12:00:00Z", // mock
    userId: JSON.parse(localStorage.getItem("user"))?.id || "USER-001",
  });

  const [systemStatus, setSystemStatus] = useState({
    hashMethod: "bcrypt (12 rounds)",
    tokenValidation: "Active",
    throttling: "Enabled (100 req/min)",
    secureConnection: true,
  });

  const [sessionActive, setSessionActive] = useState(true);

  // ✅ Giả lập kiểm tra token hết hạn
  useEffect(() => {
    const checkToken = () => {
      const now = new Date();
      const expiry = new Date(tokenInfo.expiresIn);
      if (expiry < now) {
        toast.warning("🔒 Session expired. Please log in again.");
        handleLogout();
      }
    };
    const interval = setInterval(checkToken, 10000);
    return () => clearInterval(interval);
  }, [tokenInfo]);

  // ✅ Làm mới token (mock)
  const handleRefreshToken = async () => {
    toast.info("🔄 Requesting new token...");
    setTimeout(() => {
      const newToken = "NEW_FAKE_JWT_" + Date.now();
      localStorage.setItem("idToken", newToken);
      setTokenInfo((prev) => ({ ...prev, token: newToken }));
      toast.success("✅ Token refreshed successfully!");
    }, 1000);
  };

  // ✅ Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
    setSessionActive(false);
    toast.success("👋 Logged out successfully!");
    setTimeout(() => navigate("/login"), 800);
  };

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
            <Shield className="text-blue-500" /> Security & Session Management
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

        {/* --- Token Information --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock /> Token Information
          </h3>

          <div className="space-y-3 text-sm">
            <p>
              <strong>Token:</strong>{" "}
              <span className="text-xs break-all text-blue-400">
                {tokenInfo.token}
              </span>
            </p>
            <p>
              <strong>User ID:</strong> {tokenInfo.userId}
            </p>
            <p>
              <strong>Expires In:</strong>{" "}
              {new Date(tokenInfo.expiresIn).toLocaleString()}
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

        {/* --- System Security Overview --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity /> System Security Overview
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <p className="font-medium text-blue-400">Hashing Method</p>
              <p>{systemStatus.hashMethod}</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <p className="font-medium text-green-400">Token Validation</p>
              <p>{systemStatus.tokenValidation}</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <p className="font-medium text-yellow-400">Rate Limiting</p>
              <p>{systemStatus.throttling}</p>
            </div>

            <div
              className={`p-4 rounded-lg ${
                isDark ? "bg-[#0f172a]" : "bg-gray-100"
              }`}
            >
              <p className="font-medium text-purple-400">Secure HTTPS</p>
              <p>
                {systemStatus.secureConnection ? "Enabled ✅" : "Disabled ❌"}
              </p>
            </div>
          </div>
        </div>

        {/* --- Advanced Security Settings --- */}
        <div
          className={`p-6 rounded-2xl shadow-lg ${
            isDark ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <KeyRound /> Advanced Security Settings
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Enable Two-Factor Authentication (2FA)</span>
              <input type="checkbox" className="w-5 h-5 accent-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <span>Restrict Multiple Device Sessions</span>
              <input type="checkbox" className="w-5 h-5 accent-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <span>Session Timeout Alert (15 mins idle)</span>
              <input type="checkbox" className="w-5 h-5 accent-blue-500" />
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
            Warning: Token validation and session security are critical for your
            account. Never share your token or password.
          </p>
        </div>
      </main>
    </div>
  );
}
