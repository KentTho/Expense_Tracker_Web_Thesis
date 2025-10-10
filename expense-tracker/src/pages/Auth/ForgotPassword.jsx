import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link } from "react-router-dom";
import { auth } from "../../components/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("✅ Email reset password đã được gửi. Kiểm tra hộp thư!", {
        position: "top-center",
      });
      setEmail("");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("❌ " + error.message, { position: "top-center" });
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1221]">
      {/* Cột trái - Form */}
      <div className="w-full flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-10">
          {/* Tiêu đề */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-purple-700">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your registered email to reset your password
            </p>
          </div>

          {/* Icon */}
          <div className="flex justify-center my-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow-inner">
              📧
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              SEND RESET LINK
            </button>
          </form>

          {/* Quay lại login */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-purple-600 font-medium hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
