// SignUp.jsx
// - REDESIGN: Sử dụng "Hero Card" đồng bộ với trang Login.
// - UPDATED: Form đăng ký (icon, inputs) được tinh chỉnh.

import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import React, { useState } from "react";
import { signupAndSync, loginAndSync } from "../../services/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserPlus, Wallet } from "lucide-react"; // ✅ Thêm icon

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [loading, setLoading] = useState(false); // Thêm loading state
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullname) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    setLoading(true); // Bắt đầu loading

    try {
      const { user, idToken } = await signupAndSync(email, password, fullname);
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("🎉 Signup successful!", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate("/login"), // Điều hướng về Login để họ đăng nhập
      });

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        toast.info("Email already exists — trying to log in...", { position: "top-center" });
        try {
          const { user, idToken } = await loginAndSync(email, password);
          localStorage.setItem("idToken", idToken);
          localStorage.setItem("user", JSON.stringify(user));
          toast.success("Auto-login successful! ✅", {
            position: "top-center",
            autoClose: 2000,
            onClose: () => navigate("/dashboard"),
          });
        } catch (loginErr) {
          toast.error("❌ Email exists, but password was incorrect.", { position: "top-center" });
          setLoading(false); // Dừng loading
        }
      } else {
        toast.error("Error: " + err.message, { position: "top-center" });
        setLoading(false); // Dừng loading
      }
    }
  };

  // ===========================================
  // 💡 "BRAND HERO CARD" (Đồng bộ với Login)
  // ===========================================
  const SignUpHeroCard = (
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-10 shadow-2xl text-white overflow-hidden">
      <div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <Wallet size={32} />
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">
          Start Your Journey
          <br />
          To Financial Clarity.
        </h2>
        <p className="text-lg text-white/80">
          Join us and take the first step towards mastering your money.
        </p>
      </div>
      
      {/* Biểu đồ trang trí (Abstract chart) */}
      <div className="mt-auto pt-8 opacity-30">
        <div className="flex items-end h-32 gap-3">
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '40%', animationDelay: '0.1s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '70%', animationDelay: '0.2s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '50%', animationDelay: '0.3s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '90%', animationDelay: '0.4s' }} />
          <div className="flex-1 bg-white/50 rounded-t-lg animate-pulse" style={{ height: '60%', animationDelay: '0.5s' }} />
        </div>
      </div>
    </div>
  );


  return (
    <AuthLayout
      rightContent={SignUpHeroCard}
    >
      {/* Form (UI Tinh chỉnh) */}
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-lg flex flex-col justify-center bg-white shadow-xl rounded-3xl p-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-800">Create an Account</h1>
            <p className="text-sm text-gray-500">Join us today by entering your details below.</p>
          </div>

          {/* Icon (Thay thế Emoji) */}
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow-inner">
              <UserPlus size={28} />
            </div>
          </div>

          <form className="flex-1 flex flex-col justify-center space-y-5" onSubmit={onSubmit}>

              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                onChange={(e) => setFullname(e.target.value)}
                required
              />

            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/30
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "SIGN UP"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-bold hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Hiển thị Toast */}
      <ToastContainer />
    </AuthLayout>
  );
}