// services/expenseService.jsx
// - ✅ FIX: Đồng bộ logic Token Backend & Auto Logout

import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";
import { signOut } from "firebase/auth";

// Hàm getToken nội bộ (để tương thích code cũ)
const getToken = async () => {
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
  try {
    await signOut(auth);
  } catch (e) {
    // no-op: logout best-effort
    console.warn("ExpenseService signOut failed:", e);
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
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || errText);
        } catch {
            throw new Error(errText);
        }
    }
    return res.json();
}

function buildExpensePayload(form) {
    return {
        category_id: form.category_id || null, 
        category_name: form.category_name || null, 
        amount: Number(form.amount),
        date: form.date,
        emoji: form.emoji || null,
        currency_code: form.currency_code || "USD",
        note: form.note || "",
    };
}

// ====================================================
// 📤 CÁC HÀM API
// ====================================================

export async function createExpense(data) {
  const payload = buildExpensePayload(data);
  return authorizedFetch(`${BACKEND_BASE}/expenses/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getExpenses() {
  return authorizedFetch(`${BACKEND_BASE}/expenses/`, { method: "GET" });
}

export async function updateExpense(id, data) {
  const payload = buildExpensePayload(data);
  return authorizedFetch(`${BACKEND_BASE}/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id) {
  return authorizedFetch(`${BACKEND_BASE}/expenses/${id}`, { method: "DELETE" });
}

export async function getExpenseDailyTrend(days = 30) {
    return authorizedFetch(`${BACKEND_BASE}/expenses/summary/expense-trend/daily?days=${days}`, { 
        method: "GET" 
    });
}

export async function getExpenseBreakdown() {
    return authorizedFetch(`${BACKEND_BASE}/expenses/summary`, { method: "GET" });
}