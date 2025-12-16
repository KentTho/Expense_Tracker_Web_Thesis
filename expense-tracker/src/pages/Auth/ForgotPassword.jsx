// ForgotPassword.jsx

import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../../components/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 💡 Imports cho giao diện mới
import AuthLayout from "../../components/AuthLayout";
import { MailCheck, Wallet } from "lucide-react"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false); // Thêm loading state

  const handleReset = async (e) => {
    e.preventDefault();
    
    // Validate cơ bản
    if (!email) {
        toast.error("⚠️ Vui lòng nhập địa chỉ email.");
        return;
    }

    // Validate định dạng Email (Regex giống bên SignUp để đồng bộ)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast.error("❌ Email không hợp lệ (Ví dụ: name@gmail.com)");
        return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      
      // ✅ Thành công
      toast.success("✅ Đã gửi link khôi phục! Vui lòng kiểm tra hộp thư.", {
        position: "top-center",
      });
      setEmail("");
      
    } catch (error) {
      console.error("Reset error:", error);
      
      // 🆕 LOGIC MỚI: Bắt lỗi Email chưa đăng ký
      if (error.code === "auth/user-not-found") {
        toast.error("❌ Email này chưa được đăng ký trong hệ thống.", {
            position: "top-center"
        });
      } 
      // Bắt lỗi định dạng email sai (từ phía Firebase)
      else if (error.code === "auth/invalid-email") {
        toast.error("❌ Định dạng email không đúng.", {
            position: "top-center"
        });
      }
      // Các lỗi khác
      else {
        toast.error("❌ Lỗi: " + error.message, { position: "top-center" });
      }
    } finally {
      setLoading(false); // Dừng loading
    }
  };

  // ===========================================
  // 💡 "BRAND HERO CARD" (Nội dung mới - GIỮ NGUYÊN)
  // ===========================================
  const ForgotPasswordHeroCard = (
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-10 shadow-2xl text-white overflow-hidden">
      <div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <Wallet size={32} />
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">
          Forgot Your Key?
        </h2>
        <p className="text-lg text-white/80">
          No problem. Just enter your email and we'll send you a link to get back into your account.
        </p>
      </div>
      
      {/* Biểu đồ trang trí (Abstract chart) */}
      <div className="mt-auto pt-8 opacity-30">
        <div className="flex items-end h-32 gap-3">
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '60%', animationDelay: '0.1s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '30%', animationDelay: '0.2s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '80%', animationDelay: '0.3s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '50%', animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );


  return (
    // 💡 Sử dụng AuthLayout
    <AuthLayout
      rightContent={ForgotPasswordHeroCard}
    >
      {/* Cột trái - Form */}
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-10">
          
          {/* Tiêu đề */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-800">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your registered email to reset your password
            </p>
          </div>

          {/* Icon (Thay thế Emoji) */}
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow-inner">
              <MailCheck size={28} />
            </div>
          </div>

          {/* Form reset */}
          <form
            onSubmit={handleReset}
            className="flex flex-col space-y-5"
          >
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              // 💡 Input style mới
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              required
            />

            <button
              type="submit"
              disabled={loading}
              // 💡 Button style mới
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/30
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
            >
              {loading ? "Sending Link..." : "SEND RESET LINK"}
            </button>
          </form>

          {/* Quay lại login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{" "}
            <Link
              to="/login"
              // 💡 Style link mới
              className="text-purple-600 font-bold hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </AuthLayout>
  );
}