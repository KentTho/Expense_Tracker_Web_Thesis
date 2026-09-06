// Guard: chỉ cho vào route admin khi đã đăng nhập VÀ user.is_admin.
// Chưa đăng nhập -> /login; đã đăng nhập nhưng không phải admin -> /dashboard.
// Backend vẫn kiểm tra quyền admin ở mọi endpoint (authority cuối cùng).
import { Navigate, Outlet } from "react-router-dom";
import { getToken, getStoredUser } from "../utils/authHelper";

export default function AdminRoute() {
  if (!getToken()) return <Navigate to="/login" replace />;
  const user = getStoredUser();
  return user?.is_admin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
