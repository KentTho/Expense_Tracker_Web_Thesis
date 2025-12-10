// services/adminService.jsx
// - ✅ FIX: Dùng Token từ LocalStorage và xử lý 401

import { getToken } from "./incomeService"; 
import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";
import { signOut } from "firebase/auth";

// Helper chung cho Admin
async function adminRequest(endpoint, options = {}) {
    const token = await getToken();
    const res = await fetch(`${BACKEND_BASE}/admin${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        await signOut(auth);
        window.location.href = "/login";
        throw new Error("Session expired.");
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Admin request failed");
    }
    
    if (res.status === 204) return { success: true }; 
    return res.json();
}

// Helper riêng cho System (vì nó không nằm trong /admin)
async function systemRequest(endpoint, method, body = null) {
    const token = await getToken();
    const res = await fetch(`${BACKEND_BASE}/system${endpoint}`, { 
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 401) {
        localStorage.clear();
        sessionStorage.clear();
        await signOut(auth);
        window.location.href = "/login";
        throw new Error("Session expired.");
    }

    if (!res.ok) throw new Error("System request failed");
    return res.json();
}

// --- CÁC HÀM EXPORT (GIỮ NGUYÊN) ---

export async function adminGetAllUsers() {
    return adminRequest("/users", { method: "GET" });
}

export async function adminUpdateUser(userId, data) {
    return adminRequest(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function adminDeleteUser(userId) {
    return adminRequest(`/users/${userId}`, { method: "DELETE" });
}

export async function adminGetGlobalKPIs() {
    return adminRequest("/kpis", { method: "GET" }); // Lưu ý: check lại route BE chuẩn là /admin/kpis hay /admin/stats/kpis
}

export async function adminGetGlobalUserGrowth(days = 30) {
    return adminRequest(`/charts/user-growth?days=${days}`, { method: "GET" });
}

export async function adminGetDefaultCategories(type = null) {
    const endpoint = type ? `/categories?type=${type}` : "/categories";
    return adminRequest(endpoint, { method: "GET" });
}

export async function adminCreateDefaultCategory(payload) {
    return adminRequest("/categories", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export async function adminUpdateDefaultCategory(id, payload) {
    return adminRequest(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
}

export async function adminDeleteDefaultCategory(id) {
    return adminRequest(`/categories/${id}`, { method: "DELETE" });
}

export async function getSystemSettings() {
    return systemRequest("/settings", "GET");
}

export async function fetchSystemSettings() {
    return systemRequest("/settings", "GET");
}

export async function updateSystemSettings(data) {
    return systemRequest("/settings", "PUT", data);
}

export async function adminGetAuditLogs(limit = 50) {
    return adminRequest(`/logs?limit=${limit}`, { method: "GET" });
}

export async function adminGetSystemHealth() {
    return systemRequest("/health", "GET");
}