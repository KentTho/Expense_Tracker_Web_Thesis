// Guard: chỉ cho vào route khi đã đăng nhập (có idToken).
// Đây là UX + defense-in-depth; backend vẫn là authority phân quyền cuối cùng.
import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../utils/authHelper";

export default function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}
