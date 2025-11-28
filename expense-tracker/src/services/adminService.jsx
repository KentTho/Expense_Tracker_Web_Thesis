// services/adminService.jsx (File đầy đủ)
import { getToken } from "./incomeService"; 
import { BACKEND_BASE } from "./api";

// Helper chung
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

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Admin request failed");
    }
    // Một số hàm DELETE không trả về JSON
    if (res.status === 204) return { success: true }; 
    return res.json();
}

// --- User Management ---
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

// --- Stats ---
export async function adminGetGlobalKPIs() {
    return adminRequest("/stats/kpis", { method: "GET" });
}


// ✅ HÀM MỚI ĐỂ LẤY DỮ LIỆU BIỂU ĐỒ
export async function adminGetGlobalUserGrowth(days = 30) {
    return adminRequest(`/stats/user-growth?days=${days}`, { method: "GET" });
}


// --- Default Categories (CÁC HÀM MỚI) ---
export async function adminGetDefaultCategories(type = null) {
    const endpoint = type ? `/categories?type=${type}` : "/categories";
    return adminRequest(endpoint, { method: "GET" });
}

// (Tạm thời chúng ta chưa tạo API, nên các hàm này sẽ báo lỗi 404
// cho đến khi chúng ta cập nhật Backend ở bước 4)

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
    return adminRequest(`/categories/${id}`, {
        method: "DELETE"
    });
}

export async function getSystemSettings() {
    // Dùng chung cho cả Admin và User (để hiển thị Broadcast)
    return adminRequest("/../system/settings", { method: "GET" }); 
    // Mẹo: adminRequest gọi vào /admin..., ta lùi lại để gọi /system
    // Hoặc bạn có thể tạo hàm request riêng. Ở đây tôi dùng tạm adminRequest và sửa URL.
}

// services/adminService.jsx

// ...

// Helper riêng cho System (vì nó không nằm trong /admin)
async function systemRequest(endpoint, method, body = null) {
    const token = await getToken();
    // ✅ Đảm bảo đường dẫn là /system + endpoint
    const res = await fetch(`${BACKEND_BASE}/system${endpoint}`, { 
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) throw new Error("System request failed");
    return res.json();
}

export async function fetchSystemSettings() {
    return systemRequest("/settings", "GET");
}

export async function updateSystemSettings(data) {
    return systemRequest("/settings", "PUT", data);
}

// services/adminService.jsx

// ... (các hàm khác)

// ✅ PHẢI CÓ HÀM NÀY:
export async function adminGetAuditLogs(limit = 50) {
    // Gọi đến /admin/logs (vì adminRequest đã có prefix /admin)
    return adminRequest(`/logs?limit=${limit}`, { method: "GET" });
}