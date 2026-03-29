// src/utils/authHelper.js
import { auth } from "../components/firebase";
import { signOut } from "firebase/auth";

export const getToken = () => {
  const token = localStorage.getItem("idToken");
  return token || null;
};

export const handleForceLogout = async () => {
  localStorage.removeItem("idToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Logout error:", e);
  }
  // Chỉ chuyển hướng nếu đang không ở trang login
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

/**
 * Helper để gọi fetch có kèm Token và tự động xử lý lỗi 401 (Hết hạn Token)
 */
export async function authorizedFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    await handleForceLogout();
    throw new Error("No access token");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    await handleForceLogout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }

  return res.status === 204 ? { success: true } : res.json();
}