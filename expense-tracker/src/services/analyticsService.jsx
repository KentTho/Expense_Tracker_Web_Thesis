// services/analyticsService.jsx
// - ✅ FIX: Độc lập hóa hàm getToken để tránh phụ thuộc chéo và xử lý 401 chuẩn.

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
  try {
    await signOut(auth);
  } catch (e) {
    // no-op: logout best-effort
    console.warn("AnalyticsService signOut failed:", e);
  }
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
        const errText = await res.text();
        throw new Error(`Analytics Error: ${errText}`);
    }
    return res.json();
}

// ====================================================
// 📤 CÁC HÀM API
// ====================================================

export async function getAnalyticsSummary(filters) {
    const params = new URLSearchParams();
    params.append('type', filters.type || 'all');
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.categoryId) params.append('category_id', filters.categoryId);

    return authorizedFetch(`${BACKEND_BASE}/analytics/summary?${params.toString()}`, {
        method: "GET"
    });
}

export async function getRecentTransactions(limit = 5) {
    return authorizedFetch(`${BACKEND_BASE}/transactions/recent?limit=${limit}`, {
        method: "GET"
    });
}