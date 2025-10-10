import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import TransactionChart from "../../components/TransactionChart";
import React, { useState } from "react";
import { signupAndSync, loginAndSync } from "../../services/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
  e.preventDefault();
  try {
    const { user, idToken } = await signupAndSync(email, password, fullname);
    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(user));

    toast.success("🎉 Đăng ký thành công!", {
      position: "top-center",
      autoClose: 2000,
      onClose: () => navigate("/login"), // ✅ điều hướng sau khi toast đóng
    });

  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      try {
        const { user, idToken } = await loginAndSync(email, password);
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("user", JSON.stringify(user));
        toast.info("Email đã tồn tại — đăng nhập tự động ✅", {
          position: "top-center",
          autoClose: 2000,
          onClose: () => navigate("/dashboard"),
        });
      } catch (loginErr) {
        toast.error("❌ Email tồn tại nhưng mật khẩu sai.", { position: "top-center" });
      }
    } else {
      toast.error("Lỗi: " + err.message, { position: "top-center" });
    }
  }
};


  return (
    <AuthLayout
      rightContent={
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-2xl p-6">
            <p className="font-semibold text-gray-700">Track Your Income & Expenses</p>
            <p className="text-3xl font-bold text-purple-600">$430,000</p>
          </div>
          <TransactionChart />
        </div>
      }
    >
      {/* Form */}
      <div className="w-full flex items-center justify-center">
        <div className="w-[1200px] max-w-lg h-[600px] flex flex-col justify-center bg-white shadow-xl rounded-2xl p-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-purple-700">Create an Account</h1>
            <p className="text-sm text-gray-500">Join us today by entering your details below.</p>
          </div>

          <div className="flex justify-center my-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow">
              👤
            </div>
          </div>

          <form className="flex-1 flex flex-col justify-center space-y-5" onSubmit={onSubmit}>

              <input
                type="text"
                placeholder="Full Name"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFullname(e.target.value)}
                required
              />


            <input
              type="email"
              placeholder="Email Address"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
              type="submit"
            >
              SIGN UP
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-medium hover:underline">
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
