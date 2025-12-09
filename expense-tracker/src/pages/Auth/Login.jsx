// pages/Auth/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthLayout from "../../components/AuthLayout";
import { loginAndSync, verify2FALogin } from "../../services/authService"; 
import { 
  LogIn, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle 
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State quản lý bước 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    // Logic check token giữ nguyên
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { user, idToken } = await loginAndSync(email, password);
      
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.is_2fa_enabled) {
          setShow2FA(true);
          toast.info("🔐 Security Check Required");
      } else {
          toast.success("✅ Welcome back!");
          setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      toast.error("❌ Invalid email or password.");
      console.error(err);
    } finally {
        if (!show2FA) setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
      e.preventDefault();
      if (otpCode.length !== 6) {
          toast.error("Code must be 6 digits");
          return;
      }
      setLoading(true);
      try {
          await verify2FALogin(otpCode);
          toast.success("✅ Verified! Redirecting...");
          setTimeout(() => navigate("/dashboard"), 1000);
      } catch (error) {
          toast.error("❌ " + error.message);
          setLoading(false);
      }
  };

  // ===========================================
  // 🎨 GIAO DIỆN HERO CARD (BÊN PHẢI)
  // ===========================================
  const LoginHeroCard = (
    <div className="relative w-full h-full flex flex-col justify-center items-center text-center p-8">
        {/* Background mờ trang trí */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 bg-white/30 backdrop-blur-md border border-white/50 p-8 rounded-3xl shadow-2xl max-w-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg transform -rotate-6">
                <LogIn className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-white-600 text-sm leading-relaxed">
                Access your financial dashboard, track expenses, and manage your budget intelligently with FinBot.
            </p>
            <div className="mt-6 flex justify-center gap-2">
                <div className="h-1.5 w-8 bg-blue-600 rounded-full"></div>
                <div className="h-1.5 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-1.5 w-2 bg-gray-300 rounded-full"></div>
            </div>
        </div>
    </div>
  );

  // ===========================================
  // 🎨 GIAO DIỆN 2FA FORM (BƯỚC 2)
  // ===========================================
  if (show2FA) {
      return (
        <AuthLayout rightContent={
            <div className="flex flex-col justify-center h-full items-center text-white bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <ShieldCheck size={80} className="mb-6 text-green-400 animate-pulse" />
                <h2 className="text-3xl font-bold mb-4">Security Verification</h2>
                <p className="text-center opacity-80 text-sm leading-relaxed">
                    Your account is protected by 2FA.<br/>Please enter the 6-digit code from your Authenticator App.
                </p>
            </div>
        }>
            <div className="w-full flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900">Two-Factor Auth</h1>
                        <p className="text-gray-500 mt-2 text-sm">Enter the code to continue</p>
                    </div>
                    <form onSubmit={handleVerify2FA} className="space-y-6">
                        <div className="relative">
                            <input
                                type="text"
                                maxLength="6"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g,''))}
                                className="w-full text-center text-4xl tracking-[0.5em] font-bold py-5 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder-gray-200 bg-gray-50"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? "Verifying..." : <>Verify & Login <CheckCircle size={20}/></>}
                        </button>
                    </form>
                    <button onClick={() => window.location.reload()} className="w-full mt-6 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
                        ← Cancel & Return to Login
                    </button>
                </div>
            </div>
        </AuthLayout>
      );
  }

  // ===========================================
  // 🎨 GIAO DIỆN LOGIN FORM (BƯỚC 1 - UPDATE)
  // ===========================================
  return (
    <AuthLayout rightContent={LoginHeroCard}>
       <div className="w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* EMAIL INPUT */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        // ✅ FIXED: text-gray-900 (Màu đen)
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="password"
                        placeholder="••••••••"
                        // ✅ FIXED: text-gray-900 (Màu đen)
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 bg-gray-50 hover:bg-white focus:bg-white"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="text-right mt-2">
                    <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</Link>
                </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? "Logging In..." : <>Login <ArrowRight size={20}/></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don’t have an account? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create account</Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
    </AuthLayout>
  );
}