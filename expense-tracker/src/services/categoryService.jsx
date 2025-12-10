// services/categoryService.jsx
// - ✅ FIX: Dùng Token từ LocalStorage (Backend Token)
// - ✅ LOGIC: Xử lý 401 Auto Logout

import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";
import { signOut } from "firebase/auth";

// ----------------------------------------------------
// 🧩 Helper: Lấy Token & Xử lý Logout
// ----------------------------------------------------
export const getToken = async () => {
  const token = localStorage.getItem("idToken");
  if (!token) {
      await handleForceLogout();
      throw new Error("No access token found");
  }
  return token;
};

async function handleForceLogout() {
    localStorage.clear();
    sessionStorage.clear();
    try { await signOut(auth); } catch (e) {}
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

// ----------------------------------------------------
// 🧩 Helper: Fetch Wrapper
// ----------------------------------------------------
async function authorizedFetch(url, options = {}) {
    const token = await getToken();
    const res = await fetch(url, {
        ...options,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (res.status === 401) {
        await handleForceLogout();
        throw new Error("Session expired.");
    }

    if (!res.ok) {
        const errText = await res.text();
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || errText);
        } catch (e) {
            throw new Error(errText);
        }
    }
    return res.json();
}

// ====================================================
// 📤 CÁC HÀM API
// ====================================================

export async function getCategories(type) {
  // Backend trả về danh sách category theo type
  return authorizedFetch(`${BACKEND_BASE}/categories?type=${type}`, { method: "GET" });
}

export async function createCategory(payload) {
  return authorizedFetch(`${BACKEND_BASE}/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id, payload) {
  return authorizedFetch(`${BACKEND_BASE}/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id) {
  return authorizedFetch(`${BACKEND_BASE}/categories/${id}`, {
    method: "DELETE",
  });
}