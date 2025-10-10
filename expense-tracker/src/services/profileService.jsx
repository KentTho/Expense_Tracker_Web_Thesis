// src/services/profileService.js
import { auth } from "../components/firebase";
import { BACKEND_BASE } from "../services/api";

/**
 * 🟢 Helper: Gửi request kèm token Firebase
 */
async function authorizedFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let responseData;
  try {
    responseData = await res.json();
  } catch {
    responseData = null;
  }

  if (!res.ok) {
    const message =
      responseData?.detail || responseData?.error || res.statusText || "Request failed";
    throw new Error(message);
  }

  return responseData;
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
