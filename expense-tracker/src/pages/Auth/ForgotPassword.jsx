// src/pages/Auth/ForgotPassword.jsx

import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../../components/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios"; 

// 💡 Imports UI + Icons
import AuthLayout from "../../components/AuthLayout";
import { MailCheck, Wallet, AlertTriangle, Send, ShieldAlert, ChevronRight } from "lucide-react"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 STATE FOR SUPPORT FORM
  const [supportData, setSupportData] = useState({ email: "", message: "", issue: "LOST_2FA" });
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  // 👇 HANDLE RESCUE REQUEST
  const handleSendSupport = async (e) => {
    e.preventDefault();
    if (!supportData.email || !supportData.message) {
        toast.warning("⚠️ Please enter your email and describe the issue!");
        return;
    }
    setIsSendingSupport(true);
    try {
        // Gọi API Backend
        await axios.post("http://localhost:8000/auth/api/public/support-request", {
            email: supportData.email,
            issue_type: supportData.issue,
            message: supportData.message
        });
        
        toast.success("✅ Rescue request sent! Admin will contact you soon.");
        setSupportData({ ...supportData, message: "" }); // Reset form
    } catch (error) {
        console.error(error);
        toast.error("❌ Error: Email does not exist or system is busy.");
    } finally {
        setIsSendingSupport(false);
    }
  };

  // --- Logic Reset Password ---
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
        toast.error("⚠️ Please enter your email address.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast.error("❌ Invalid email format.");
        return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("✅ Reset link sent! Please check your inbox.");
      setEmail("");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        toast.error("❌ This email is not registered.");
      } else {
        toast.error("❌ Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // UI Hero Card
  const ForgotPasswordHeroCard = (
    <div className="flex flex-col justify-between h-full bg-gradient-to-br from-purple-600 to-blue-700 rounded-3xl p-10 shadow-2xl text-white overflow-hidden relative">
      <div className="relative z-10">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10 shadow-inner">
          <Wallet size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight">Forgot Your Key?</h2>
        <p className="text-lg text-blue-100 font-medium leading-relaxed">
          No problem. Security is our priority. Just enter your email and we'll send you a secure link to recover your account.
        </p>
      </div>
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="mt-auto pt-8 relative z-10 opacity-40">
        <div className="flex items-end h-32 gap-3">
            <div className="flex-1 bg-white/60 rounded-t-lg animate-pulse" style={{ height: '60%' }} />
            <div className="flex-1 bg-white/60 rounded-t-lg animate-pulse" style={{ height: '40%', animationDelay: '0.2s' }} />
            <div className="flex-1 bg-white/60 rounded-t-lg animate-pulse" style={{ height: '80%', animationDelay: '0.4s' }} />
            <div className="flex-1 bg-white/60 rounded-t-lg animate-pulse" style={{ height: '50%', animationDelay: '0.6s' }} />
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout rightContent={ForgotPasswordHeroCard}>
      <div className="w-full flex items-center justify-center py-6 sm:py-0">
        <div className="w-full max-w-lg bg-white sm:shadow-2xl sm:rounded-[32px] p-6 sm:p-10 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Enter your registered email to receive instructions
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
              <MailCheck size={32} className="animate-bounce-slow" />
            </div>
          </div>

          {/* Form Reset Password */}
          <form onSubmit={handleReset} className="flex flex-col space-y-5 relative z-10">
            <div className="group">
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all duration-300
                            focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-400"
                required
                />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-2xl font-bold text-sm tracking-wide uppercase hover:shadow-lg hover:shadow-gray-500/30 transition-all duration-300 transform active:scale-[0.98]
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-1"}`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {/* 👇 EMERGENCY SUPPORT FORM (REDESIGNED) */}
          <div className="mt-12 pt-8 border-t border-dashed border-gray-200">
            
            {/* Title Section */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Emergency Support</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Lost 2FA or Account Hacked?</p>
                    </div>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                    SOS
                </span>
            </div>
            
            <div className="bg-gradient-to-b from-red-50/50 to-white border border-red-100 rounded-3xl p-1 shadow-sm">
                <div className="p-5 space-y-4">
                    {/* Inputs */}
                    <input 
                        type="email" 
                        placeholder="Your Account Email"
                        className="w-full px-4 py-3 rounded-xl border border-red-100 bg-white text-sm font-medium focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition-all placeholder:text-gray-400"
                        value={supportData.email}
                        onChange={(e) => setSupportData({...supportData, email: e.target.value})}
                    />
                    
                    <div className="relative">
                        <select 
                            className="w-full px-4 py-3 rounded-xl border border-red-100 bg-white text-sm font-medium focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none transition-all appearance-none cursor-pointer text-gray-700"
                            value={supportData.issue}
                            onChange={(e) => setSupportData({...supportData, issue: e.target.value})}
                        >
                            <option value="LOST_2FA">📱 Lost Device / Authenticator</option>
                            <option value="HACKED">🚨 Account Hacked / Compromised</option>
                            <option value="LOCKED">🔒 Account Locked</option>
                            <option value="OTHER">❓ Other Critical Issue</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-red-300">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>

                    <textarea 
                        placeholder="Please describe your situation in detail so Admin can verify you..."
                        className="w-full px-4 py-3 rounded-xl border border-red-100 bg-white text-sm font-medium focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none min-h-[80px] resize-none transition-all placeholder:text-gray-400"
                        value={supportData.message}
                        onChange={(e) => setSupportData({...supportData, message: e.target.value})}
                    />

                    {/* Action Button */}
                    <button 
                        onClick={handleSendSupport}
                        disabled={isSendingSupport}
                        className="w-full group relative overflow-hidden py-3.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all duration-300 transform active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isSendingSupport ? (
                                "Sending Request..." 
                            ) : (
                                <>
                                    <Send size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> 
                                    Submit Rescue Request
                                </>
                            )}
                        </span>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                    </button>
                    
                    <p className="text-center text-[10px] text-gray-400 font-medium">
                        *Request will be sent directly to Admin Dashboard securely.
                    </p>
                </div>
            </div>
          </div>
          {/* 👆 END OF REDESIGNED SECTION */}

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Remember your password?{" "}
            <Link to="/login" className="text-purple-600 font-bold hover:text-purple-700 hover:underline transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
    </AuthLayout>
  );
}