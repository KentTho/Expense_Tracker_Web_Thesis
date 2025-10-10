import React, { useState } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Lock, Save, X, ArrowLeft } from "lucide-react";

export default function ChangePassword() {
  const { theme } = useOutletContext();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async () => {
    setMessage(null);

    if (!user) {
      setMessage({ type: "error", text: "Bạn chưa đăng nhập!" });
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp." });
      return;
    }

    setLoading(true);
    try {
      // ✅ Xác thực lại người dùng
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // ✅ Cập nhật mật khẩu mới
      await updatePassword(user, newPassword);

      setMessage({ type: "success", text: "✅ Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("❌ Lỗi đổi mật khẩu:", error);
      let errorMsg = "Đổi mật khẩu thất bại.";
      if (error.code === "auth/wrong-password") errorMsg = "Mật khẩu hiện tại không đúng.";
      if (error.code === "auth/weak-password") errorMsg = "Mật khẩu mới quá yếu (ít nhất 6 ký tự).";
      if (error.code === "auth/requires-recent-login") errorMsg = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(null);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-[#111827] text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Change Password</h1>

        <div
          className={`rounded-2xl shadow-lg p-6 transition-all ${
            theme === "dark" ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border outline-none ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-300"
                }`}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* --- Buttons --- */}
            <div className="flex justify-between mt-6">
              {/* Nút quay lại */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
                  dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex gap-3">
                {/* Nút Clear */}
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 
                    dark:border-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 
                    text-red-600 dark:text-red-400 transition-all duration-200"
                >
                  <X size={16} />
                  Clear
                </button>

                {/* Nút Change Password */}
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 
                    text-white transition-all duration-200 shadow-md hover:shadow-blue-400/40 ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  <Lock size={16} />
                  {loading ? "Updating..." : "Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
