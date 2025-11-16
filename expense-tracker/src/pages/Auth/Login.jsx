// Login.jsx
// - REDESIGN: "Right Content" được làm mới thành "Hero Card" sáng tạo.
// - UPDATED: Form đăng nhập (icon, inputs) được tinh chỉnh.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthLayout from "../../components/AuthLayout";
import { loginAndSync } from "../../services/authService";
import { LogIn, Wallet } from "lucide-react"; // ✅ Thêm icon

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Thêm loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    setLoading(true); // Bắt đầu loading
    try {
      const { user, idToken } = await loginAndSync(email, password);
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (err) {
      toast.error("❌ Invalid email or password.");
      console.error(err);
      setLoading(false); // Dừng loading nếu lỗi
    }
  };

  // ===========================================
  // 💡 IDEA MỚI: "BRAND HERO CARD" CHO BÊN PHẢI
  // ===========================================
  const LoginHeroCard = (
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-10 shadow-2xl text-white overflow-hidden">
      <div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
          <Wallet size={32} />
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">
          All Your Finances,
          <br />
          One Single View.
        </h2>
        <p className="text-lg text-white/80">
          Track, analyze, and optimize your spending and income with ease.
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
      // Sử dụng component "Hero Card" mới
      rightContent={LoginHeroCard}
    >
      {/* Login Section (UI Tinh chỉnh) */}
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-lg flex flex-col justify-center bg-white shadow-xl rounded-3xl p-10 relative">
          
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-800">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Please enter your details to log in
            </p>
          </div>

          {/* Icon (Thay thế Emoji) */}
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow-inner">
              <LogIn size={28} />
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="flex-1 flex flex-col justify-center space-y-5"
          >
            {/* Email (Input mới) */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password (Input mới) */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

              {/* Forgot password link */}
              <div className="text-right -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>


            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/30
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
            >
              {loading ? "Logging In..." : "LOGIN"}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-purple-600 font-bold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </AuthLayout>
  );
}