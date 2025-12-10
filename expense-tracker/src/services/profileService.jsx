// src/services/profileService.jsx
// - ✅ FIX: Lấy idToken từ LocalStorage (Token Backend) thay vì Firebase.
// - ✅ LOGIC: Tự động đá (Logout) nếu gặp lỗi 401 (Single Device Mode).

import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";
import { signOut } from "firebase/auth";

/**
 * 🟢 Helper: Gửi request kèm token
 */
async function authorizedFetch(url, options = {}) {
  // 1. Lấy Token Hệ Thống từ LocalStorage (Token này có chứa session_key)
  const idToken = localStorage.getItem("idToken");

  // Nếu không có token -> Coi như chưa đăng nhập -> Đá ra
  if (!idToken) {
      await handleForceLogout();
      throw new Error("No access token found. Please login.");
  }

  // 2. Gửi request
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${idToken}`, // Gửi Token hệ thống
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // 3. 🔥 XỬ LÝ LỖI 401 (Bị đá do đăng nhập nơi khác hoặc hết hạn)
  if (res.status === 401) {
      console.warn("⚠️ Session expired / Logged in elsewhere (401).");
      await handleForceLogout();
      throw new Error("Session expired. You have logged in on another device.");
  }

  // 4. Xử lý dữ liệu trả về
  let responseData;
  try {
    responseData = await res.json();
  } catch {
    responseData = null;
  }

  if (!res.ok) {
    const message = responseData?.detail || responseData?.error || res.statusText || "Request failed";
    throw new Error(message);
  }

  return responseData;
}

// 🟢 Hàm xử lý đăng xuất cưỡng chế (Xóa sạch dấu vết)
async function handleForceLogout() {
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
    sessionStorage.clear(); // Xóa trạng thái Splash
    try {
        await signOut(auth); // Đăng xuất Firebase
    } catch (e) {
        console.error("Firebase signout error", e);
    }
    // Chuyển hướng thô (Force Reload) về Login
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

/**
 * 🟢 Lấy thông tin hồ sơ người dùng
 */
export async function getUserProfile() {
  return authorizedFetch(`${BACKEND_BASE}/auth/user/profile`, {
    method: "GET",
  });
}

/**
 * 🟢 Cập nhật hồ sơ người dùng
 */
export async function updateUserProfile(profileData) {
  return authorizedFetch(`${BACKEND_BASE}/auth/user/profile`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}