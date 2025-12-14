// ChangePassword.jsx

import React, { useState, useEffect } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  Lock, ArrowLeft, KeyRound, Eye, EyeOff, ShieldCheck, Loader2
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
// 💡 COMPONENT INPUT (Tối ưu Mobile & UX)
// =======================================================
const PasswordInput = ({ label, name, value, placeholder, show, onToggle, onChange }) => { 
    const { theme } = useOutletContext(); 
    const isDark = theme === "dark";

    return (
        <div className="relative group">
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 ml-1">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={show ? "text" : "password"}
                  name={name}
                  value={value}
                  onChange={onChange}
                  placeholder={placeholder}
                  className={`w-full pl-11 pr-11 py-3.5 rounded-xl border outline-none transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500/30 placeholder-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={onToggle}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
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
  const auth = getAuth();

  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // Trạng thái kiểm tra auth
  const [strength, setStrength] = useState(0);
  const [user, setUser] = useState(null);

  // 1. Silent Auth Check (Tránh lỗi "User null" khi refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            // Nếu không có user, redirect về login mà không báo lỗi
            navigate("/login"); 
        }
        setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    setStrength(calculateStrength(form.new));
  }, [form.new]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleShow = (field) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!form.current || !form.new || !form.confirm) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    if (form.new !== form.confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    if (strength < 40) {
        toast.error("Password is too weak.");
        return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(user.email, form.current);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, form.new);
      
      toast.success("Password updated successfully!", { id: toastId });
      setForm({ current: "", new: "", confirm: "" });
      
      setTimeout(() => navigate("/profile"), 1500);
    } catch (error) {
      console.error("Change Password Error:", error);
      let msg = "Failed to update password.";
      if (error.code === "auth/wrong-password") msg = "Current password is incorrect.";
      if (error.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      if (error.code === "auth/requires-recent-login") msg = "Session expired. Please login again.";
      if (error.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
      
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Màn hình Loading khi đang check auth
  if (checkingAuth) {
      return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Toaster position="top-center" />

      {/* --- MAIN CARD --- */}
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
      }`}>
        
        {/* Header Area */}
        <div className="relative h-40 bg-gradient-to-r from-blue-600 to-purple-600 flex flex-col items-center justify-center text-center p-6">
            <div className="absolute -bottom-10 w-20 h-20 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-xl p-1.5 transition-transform hover:scale-105">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={40} />
                </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Secure Account</h1>
            <p className="text-blue-100 text-sm sm:text-base opacity-90">Manage your access security</p>
        </div>

        {/* Form Body */}
        <div className="px-6 sm:px-10 pt-14 pb-10 space-y-6">
            
            {/* Current Password */}
            <PasswordInput 
                label="Current Password" 
                name="current" 
                value={form.current} 
                placeholder="••••••••"
                show={showPass.current}
                onToggle={() => toggleShow("current")}
                onChange={handleChange}
            />

            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-2"></div>

            {/* New Password */}
            <div>
                <PasswordInput 
                    label="New Password" 
                    name="new" 
                    value={form.new} 
                    placeholder="••••••••"
                    show={showPass.new}
                    onToggle={() => toggleShow("new")}
                    onChange={handleChange} 
                />
                
                {/* Strength Meter */}
                <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${getStrengthColor(strength)}`} 
                            style={{ width: `${strength}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold uppercase text-gray-500 min-w-[3rem] text-right">
                        {strength === 0 ? "" : strength < 40 ? "Weak" : strength < 80 ? "Good" : "Strong"}
                    </span>
                </div>
            </div>

            {/* Confirm Password */}
            <PasswordInput 
                label="Confirm Password" 
                name="confirm" 
                value={form.confirm} 
                placeholder="••••••••"
                show={showPass.confirm}
                onToggle={() => toggleShow("confirm")}
                onChange={handleChange} 
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-4">
                <button
                    onClick={() => navigate(-1)}
                    className={`w-full sm:flex-1 py-3.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isDark 
                        ? "border-gray-600 hover:bg-gray-700 text-gray-300" 
                        : "border-gray-300 hover:bg-gray-100 text-gray-600"
                    }`}
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full sm:flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
      </div>

      {/* Footer Tip */}
      <p className="mt-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center leading-relaxed">
        <strong>Tip:</strong> Create a strong password by mixing uppercase letters, numbers, and symbols.
      </p>
    </div>
  );
}