import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";  // ✅ thêm useNavigate
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TransactionChart from "../../components/TransactionChart";
import AuthLayout from "../../components/AuthLayout";
import { loginAndSync } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    try {
      const { user, idToken } = await loginAndSync(email, password);
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("✅ Login successful!");
      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (err) {
      toast.error("❌ Invalid email or password.");
      console.error(err);
    }
  };

  return (
    <AuthLayout
      rightContent={
        <div className="space-y-6">
          <div className="bg-white shadow-md rounded-2xl p-4">
            <p className="font-semibold">Track Your Income & Expenses</p>
            <p className="text-2xl font-bold text-purple-600">$430,000</p>
          </div>
          <TransactionChart />
        </div>
      }
    >
      {/* Login Section */}
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-lg h-[520px] flex flex-col justify-center bg-white shadow-xl rounded-2xl p-10 relative">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-purple-700">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Please enter your details to log in
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center my-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl shadow">
              🔑
            </div>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="flex-1 flex flex-col justify-center space-y-5"
          >
            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-green-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

              {/* Forgot password link */}
              <div className="text-right mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>


            {/* Submit Button */}
            <button className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
              LOGIN
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-purple-600 font-medium hover:underline"
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