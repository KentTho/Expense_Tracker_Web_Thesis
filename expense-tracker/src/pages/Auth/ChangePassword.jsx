// ChangePassword.jsx
// - ✅ FIXED: Sửa lỗi 'handleChange is not defined' bằng cách truyền prop 'onChange' vào Input.

import React, { useState, useEffect } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  Lock, Save, ArrowLeft, KeyRound, Eye, EyeOff, ShieldCheck 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Helper: Tính độ mạnh mật khẩu
const calculateStrength = (password) => {
  let strength = 0;
  if (password.length > 5) strength += 20;
  if (password.length > 9) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  return strength;
};

const getStrengthColor = (score) => {
  if (score <= 20) return "bg-red-500";
  if (score <= 40) return "bg-orange-500";
  if (score <= 60) return "bg-yellow-500";
  if (score <= 80) return "bg-blue-500";
  return "bg-green-500";
};

// =======================================================
// 💡 COMPONENT INPUT (ĐÃ SỬA LỖI)
// =======================================================
const PasswordInput = ({ label, name, value, placeholder, show, onToggle, onChange }) => { // 1. Thêm 'onChange'
    const { theme } = useOutletContext(); 
    const isDark = theme === "dark";

    return (
        <div className="relative group">
        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type={show ? "text" : "password"}
              name={name}
              value={value}
              onChange={onChange} // 2. Sử dụng 'onChange' (prop)
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border outline-none transition-all duration-300 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
            <button
              type="button"
              onClick={onToggle}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
        </div>
    );
};


// =======================================================
// 💡 COMPONENT CHÍNH
// =======================================================
export default function ChangePassword() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    setStrength(calculateStrength(form.new));
  }, [form.new]);

  // Hàm handleChange được định nghĩa ở đây
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleShow = (field) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    // ... (Logic handleSubmit giữ nguyên) ...
    if (!user) {
      toast.error("You need to log in first!");
      return;
    }
    if (!form.current || !form.new || !form.confirm) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (form.new !== form.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (strength < 40) {
        toast.error("Password is too weak. Try adding numbers or symbols.");
        return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, form.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, form.new);
      toast.success("🎉 Password updated successfully!");
      setForm({ current: "", new: "", confirm: "" });
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      console.error("Error:", error);
      let msg = "Failed to update password.";
      if (error.code === "auth/wrong-password") msg = "Current password is incorrect.";
      if (error.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      if (error.code === "auth/requires-recent-login") msg = "Session expired. Please login again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center justify-center p-4 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Toaster position="top-center" />

      {/* --- MAIN CARD --- */}
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isDark ? "bg-gray-800/50 border border-gray-700 backdrop-blur-sm" : "bg-white border border-white/50"
      }`}>
        
        {/* Header Area with Gradient */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center justify-center">
            <div className="absolute -bottom-8 w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg p-1">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={32} />
                </div>
            </div>
            <h1 className="text-2xl font-bold text-white -mt-4">Secure Your Account</h1>
            <p className="text-blue-100 text-sm">Update your password regularly</p>
        </div>

        {/* Form Body */}
        <div className="px-8 pt-12 pb-8 space-y-6">
            
            {/* Current Password */}
            <PasswordInput 
                label="Current Password" 
                name="current" 
                value={form.current} 
                placeholder="Enter current password"
                show={showPass.current}
                onToggle={() => toggleShow("current")}
                onChange={handleChange} // 3. Truyền hàm vào prop 'onChange'
            />

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            {/* New Password */}
            <div>
                <PasswordInput 
                    label="New Password" 
                    name="new" 
                    value={form.new} 
                    placeholder="Enter new password"
                    show={showPass.new}
                    onToggle={() => toggleShow("new")}
                    onChange={handleChange} // 3. Truyền hàm vào prop 'onChange'
                />
                {/* Strength Meter */}
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${getStrengthColor(strength)}`} 
                            style={{ width: `${strength}%` }}
                        />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-16 text-right">
                        {strength === 0 ? "Empty" : strength < 40 ? "Weak" : strength < 80 ? "Medium" : "Strong"}
                    </span>
                </div>
            </div>

            {/* Confirm Password */}
            <PasswordInput 
                label="Confirm New Password" 
                name="confirm" 
                value={form.confirm} 
                placeholder="Re-enter new password"
                show={showPass.confirm}
                onToggle={() => toggleShow("confirm")}
                onChange={handleChange} // 3. Truyền hàm vào prop 'onChange'
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-8 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className={`flex-1 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                        isDark 
                        ? "border-gray-600 hover:bg-gray-700 text-gray-300" 
                        : "border-gray-300 hover:bg-gray-100 text-gray-600"
                    }`}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    <Lock size={18} />
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
      </div>

      {/* Footer Tip */}
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 max-w-md text-center">
        Tip: Use a combination of uppercase letters, numbers, and symbols for a stronger password.
      </p>
    </div>
  );
}