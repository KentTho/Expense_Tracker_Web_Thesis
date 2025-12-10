// services/chatService.jsx
// - ✅ FIX: Token & 401 Handling cho Chatbot

import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";
import { signOut } from "firebase/auth";

// ----------------------------------------------------
// 🧩 Helper: Authorization
// ----------------------------------------------------
const getToken = async () => {
  const token = localStorage.getItem("idToken");
  if (!token) {
      await handleForceLogout();
      throw new Error("No access token");
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
        const err = await res.json();
        throw new Error(err.detail || "Chat failed");
    }
    return res.json();
}

// ====================================================
// 📤 CÁC HÀM API
// ====================================================

export async function sendChatMessage(message) {
  return authorizedFetch(`${BACKEND_BASE}/chat/send`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}