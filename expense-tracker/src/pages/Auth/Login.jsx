// Login.jsx
// - REDESIGN: "Right Content" được làm mới thành "Hero Card" sáng tạo.
// - UPDATED: Form đăng nhập (icon, inputs) được tinh chỉnh.

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthLayout from "../../components/AuthLayout";
// ✅ Import hàm mới
import { loginAndSync, verify2FALogin } from "../../services/authService"; 
import { LogIn, Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ✅ State quản lý bước 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  const navigate = useNavigate();

  // Chỉ check token nếu KHÔNG phải đang ở màn hình nhập 2FA
  useEffect(() => {
    const token = localStorage.getItem("idToken");
    // Nếu có token và user chưa bật 2FA (hoặc đã verify xong), mới đá về dashboard
    // Logic này hơi lắt léo: Ta sẽ check sau khi login thành công
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      // Bước 1: Đăng nhập Firebase & Sync BE
      const { user, idToken } = await loginAndSync(email, password);
      
      // Lưu tạm token
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ KIỂM TRA: Nếu user có bật 2FA
      if (user.is_2fa_enabled) {
          setShow2FA(true); // Chuyển sang màn hình nhập mã
          toast.info("🔐 2FA Enabled. Please enter code from Authenticator app.");
      } else {
          // Nếu không bật 2FA -> Vào thẳng Dashboard
          toast.success("✅ Login successful!");
          setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      toast.error("❌ Invalid email or password.");
      console.error(err);
    } finally {
        // Chỉ tắt loading nếu KHÔNG chuyển sang màn 2FA
        // Nếu chuyển sang 2FA thì giữ loading hoặc tắt tùy UI
        if (!show2FA) setLoading(false);
    }
  };

  // ✅ Hàm xử lý nhập mã 2FA
  const handleVerify2FA = async (e) => {
      e.preventDefault();
      if (otpCode.length !== 6) {
          toast.error("Code must be 6 digits");
          return;
      }
      setLoading(true);
      try {
          await verify2FALogin(otpCode);
          toast.success("✅ 2FA Verified! Redirecting...");
          setTimeout(() => navigate("/dashboard"), 1000);
      } catch (error) {
          toast.error("❌ " + error.message);
          setLoading(false);
      }
  };

  // ===========================================
  // 💡 GIAO DIỆN 2FA FORM
  // ===========================================
  if (show2FA) {
      return (
        <AuthLayout rightContent={
            <div className="flex flex-col justify-center h-full items-center text-white bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-10 shadow-2xl">
                <ShieldCheck size={64} className="mb-6" />
                <h2 className="text-3xl font-bold mb-4">Two-Factor Authentication</h2>
                <p className="text-center opacity-90">Your account is protected. Please enter the code from your Google Authenticator app.</p>
            </div>
        }>
            <div className="w-full flex items-center justify-center">
                <div className="w-full max-w-lg bg-white shadow-xl rounded-3xl p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Verification</h1>
                        <p className="text-gray-500 mt-2">Enter the 6-digit code</p>
                    </div>
                    <form onSubmit={handleVerify2FA} className="space-y-6">
                        <input
                            type="text"
                            maxLength="6"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))} // Chỉ cho nhập số
                            className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none"
                            placeholder="000000"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            {loading ? "Verifying..." : <>Verify <ArrowRight size={20}/></>}
                        </button>
                    </form>
                    <button onClick={() => window.location.reload()} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800">
                        Cancel & Back to Login
                    </button>
                </div>
            </div>
        </AuthLayout>
      );
  }

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
    <AuthLayout rightContent={LoginHeroCard}>
       {/* ... Form Login cũ ... */}
       <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-lg flex flex-col justify-center bg-white shadow-xl rounded-3xl p-10 relative">
          {/* ... Header, Icon ... */}
           <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-800">Welcome Back</h1>
            <p className="text-sm text-gray-500">Please enter your details to log in</p>
          </div>
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow-inner">
              <LogIn size={28} />
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-center space-y-5">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
             <div className="text-right -mt-2">
                <Link to="/forgot-password" class="text-sm text-purple-600 hover:underline font-medium">Forgot Password?</Link>
              </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
            >
              {loading ? "Logging In..." : "LOGIN"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don’t have an account? <Link to="/signup" className="text-purple-600 font-bold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </AuthLayout>
  );
}