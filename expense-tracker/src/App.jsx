// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ChangePassword from "./pages/Auth/ChangePassword";
import Dashboard from "./pages/Dashboard/Home";
import Income from "./pages/Dashboard/Income";
import Expense from "./pages/Dashboard/Expense";
import ExportData from "./pages/Dashboard/ExportData";
import Profile from "./pages/Dashboard/Profile";
import SecuritySettings from "./pages/Dashboard/SecuritySettings";
import Analytics from "./pages/Dashboard/Analytics";
import DashboardLayout from "./layouts/DashboardLayout"; // ✅ layout chứa Sidebar

// ✅ Hàm kiểm tra đăng nhập
const Root = () => {
  const isAuthenticated = !!localStorage.getItem("idToken");
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};



function App() {
  return (
    <Router>
      <Routes>
        {/* 🔹 Public Routes */}
        <Route path="/" element={<Root />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 🔹 Dashboard Layout - giữ nguyên Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/dataexport" element={<ExportData />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/security" element={<SecuritySettings />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* 🔹 fallback nếu route không tồn tại */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
