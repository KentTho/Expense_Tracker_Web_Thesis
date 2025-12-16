// pages/Auth/SignUp.jsx
// - ✅ FIXED: Input text color is now Black (text-gray-900).
// - 🎨 REDESIGN: Giao diện "Rocket Launch" năng động, Gradient Tím/Hồng.
// - 🧩 LOGIC: Giữ nguyên logic đăng ký và đồng bộ.
// - 🆕 UPDATE: Thêm Confirm Password & Validate Email/Password chặt chẽ.

import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import React, { useState } from "react";
import { signupAndSync } from "../../services/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    User, Mail, Lock, ArrowRight, Rocket, Sparkles, ShieldCheck 
} from "lucide-react";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 🆕 Thêm state Confirm Pass
  const [fullname, setFullname] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- HÀM KIỂM TRA MẬT KHẨU MẠNH ---
  const isStrongPassword = (pass) => {
    // Tối thiểu 8 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
    return strongRegex.test(pass);
  };

  // --- HÀM KIỂM TRA EMAIL CHUẨN ---
  // --- HÀM KIỂM TRA EMAIL CHUẨN (ĐÃ FIX CHẶT CHẼ) ---
  const isValidEmail = (email) => {
    // 1. Regex chuẩn Quốc tế:
    // - Phần tên: Chữ, số, ký tự đặc biệt (._%+-).
    // - Phần @: Bắt buộc có.
    // - Phần domain: Chữ, số, dấu chấm.
    // - Phần đuôi (TLD): Bắt buộc là chữ cái, TỐI THIỂU 2 KÝ TỰ (Chặn .c, .m)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) return false;

    // 2. Logic chặn lỗi gõ thiếu phổ biến (User Experience)
    // Nếu user nhập @gmail.co (thiếu chữ m) hoặc @yahoo.c ... -> Báo lỗi ngay
    // (Vì thực tế ít ai dùng gmail cá nhân mà đuôi .co)
    const commonTypos = ["@gmail.co", "@yahoo.co", "@hotmail.co"];
    if (commonTypos.some(typo => email.toLowerCase().endsWith(typo))) {
        return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra điền đủ thông tin
    if (!email || !password || !fullname || !confirmPassword) {
      toast.error("⚠️ Vui lòng điền đầy đủ các trường.");
      return;
    }

    // 2. 🆕 Validate Email chặt chẽ
    // Trong hàm onSubmit:
    if (!isValidEmail(email)) {
      // Kiểm tra nếu lỗi do đuôi .co thì gợi ý luôn
      if (email.toLowerCase().endsWith("@gmail.co")) {
          toast.error("⚠️ Có phải ý bạn là '@gmail.com'?");
      } else {
          toast.error("❌ Email không hợp lệ hoặc thiếu tên miền (VD: .com, .vn)");
      }
      return;
    }

    // 3. 🆕 Validate Mật khẩu mạnh
    if (!isStrongPassword(password)) {
      toast.error("⚠️ Mật khẩu quá yếu! Cần ít nhất 8 ký tự, gồm chữ Hoa, thường và số.");
      return;
    }

    // 4. 🆕 Kiểm tra mật khẩu trùng khớp
    if (password !== confirmPassword) {
      toast.error("❌ Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);

    try {
      const { user, idToken } = await signupAndSync(email, password, fullname);
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("🎉 Đăng ký thành công!", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate("/dashboard"), 
      });

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
          toast.error("❌ Email này đã được sử dụng.");
      } else {
          toast.error("❌ Đăng ký thất bại. Vui lòng thử lại.");
          console.error(err);
      }
    } finally {
        setLoading(false);
    }
  };

  // ===========================================
  // 🎨 GIAO DIỆN HERO CARD (GIỮ NGUYÊN)
  // ===========================================
  const SignUpHeroCard = (
    <div className="relative w-full h-full flex flex-col justify-center items-center text-center p-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 bg-white/20 backdrop-blur-lg border border-white/40 p-10 rounded-[40px] shadow-2xl max-w-sm transform transition-all hover:scale-105 duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-purple-500/40">
                <Rocket className="text-white" size={40} />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-800 mb-3 flex justify-center items-center gap-2">
                Start Here <Sparkles size={24} className="text-yellow-500 animate-pulse"/>
            </h2>
            <p className="text-white-900 text-base font-medium leading-relaxed">
                Join thousands of users mastering their finances. Create your free account and start tracking today!
            </p>
        </div>
    </div>
  );

  // ===========================================
  // 🎨 GIAO DIỆN SIGNUP FORM
  // ===========================================
  return (
    <AuthLayout rightContent={SignUpHeroCard}>
       <div className="w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                Create Account
            </h1>
            <p className="text-gray-500 text-sm">It's free and easy to set up.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            
            {/* FULL NAME */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Full Name</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={20} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setFullname(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* EMAIL */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={20} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* PASSWORD */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={20} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        placeholder="Create a strong password"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {/* 🆕 Gợi ý mật khẩu mạnh */}
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                    *8+ chars, 1 Uppercase, 1 Number required.
                </p>
            </div>

            {/* 🆕 CONFIRM PASSWORD (MỚI THÊM) */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Confirm Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        {/* Dùng icon ShieldCheck cho khác biệt chút hoặc dùng Lock cũng được */}
                        <ShieldCheck size={20} className="text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        placeholder="Re-enter your password"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? "Creating Account..." : <>Get Started <ArrowRight size={20}/></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Already a member? <Link to="/login" className="text-purple-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar theme="colored" />
    </AuthLayout>
  );
}