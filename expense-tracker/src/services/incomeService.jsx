// services/incomeService.jsx
// - ✅ FIX: Lấy Token từ LocalStorage (Token Backend) thay vì Firebase.
// - ✅ LOGIC: Tự động Logout nếu gặp lỗi 401.

import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";
import { signOut } from "firebase/auth";

// ----------------------------------------------------
// 🧩 Helper: Lấy Token từ LocalStorage (Backend Token)
// ----------------------------------------------------
export const getToken = async () => {
  const token = localStorage.getItem("idToken");
  if (!token) {
      await handleForceLogout();
      throw new Error("No access token found. Please login.");
  }
  return token;
};

// ----------------------------------------------------
// 🧩 Helper: Xử lý Đăng xuất cưỡng chế
// ----------------------------------------------------
async function handleForceLogout() {
    localStorage.clear();
    sessionStorage.clear();
    try { await signOut(auth); } catch (e) { console.error(e); }
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

// ----------------------------------------------------
// 🧩 Helper: Fetch Wrapper (Tự động thêm Token & Check 401)
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

    // 🔥 KÍCH HOẠT SINGLE DEVICE MODE (Đá văng nếu 401)
    if (res.status === 401) {
        console.warn("⚠️ Session expired (401). Logging out...");
        await handleForceLogout();
        throw new Error("Session expired. Please login again.");
    }

    if (!res.ok) {
        const errText = await res.text();
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || errText);
        } catch (e) {
            throw new Error(errText || `Request failed: ${res.status}`);
        }
    }

    return res.json();
}

// ----------------------------------------------------
// 🧩 Helper: Payload Builder (Giữ nguyên)
// ----------------------------------------------------
function buildIncomePayload(form) {
    return {
        category_name: form.category_name || null,
        amount: Number(form.amount),
        date: form.date,
        emoji: form.emoji || null,
        category_id: form.category_id || null, 
        currency_code: form.currency_code || "USD",
        note: form.note || "",
    };
}

// ====================================================
// 📤 CÁC HÀM API (GIỮ NGUYÊN CẤU TRÚC GỌI)
// ====================================================

export async function createIncome(data) {
  const payload = buildIncomePayload(data);
  return authorizedFetch(`${BACKEND_BASE}/incomes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getIncomes() {
  const data = await authorizedFetch(`${BACKEND_BASE}/incomes`, { method: "GET" });
  return data.items || [];
}

export async function updateIncome(id, data) {
  const payload = buildIncomePayload(data);
  return authorizedFetch(`${BACKEND_BASE}/incomes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteIncome(id) {
  return authorizedFetch(`${BACKEND_BASE}/incomes/${id}`, { method: "DELETE" });
}

export async function getIncomeSummary() {
  return authorizedFetch(`${BACKEND_BASE}/incomes/summary`, { method: "GET" });
}

export async function getFinancialKpiSummary() {
    return authorizedFetch(`${BACKEND_BASE}/summary/kpis`, { method: "GET" });
}