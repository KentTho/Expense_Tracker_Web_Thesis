// src/services/securityService.jsx
import { BACKEND_BASE } from "./api";
import { getToken } from "./incomeService"; 

// ✅ Hàm này dùng để bật/tắt Single Device Mode
// Nó thực chất là update profile user
export async function updateSecuritySettings(settings) {
  const token = await getToken();
  
  // Lưu ý: Backend xử lý update user tại /auth/user/profile
  // Settings ở đây sẽ là { restrict_multi_device: true/false }
  const res = await fetch(`${BACKEND_BASE}/auth/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) throw new Error("Failed to update security settings");
  return await res.json();
}

export async function getSecuritySettings() {
  const token = await getToken();
  // Lấy info user hiện tại (trong đó có restrict_multi_device)
  const res = await fetch(`${BACKEND_BASE}/auth/user/profile`, {
     method: "GET",
     headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) throw new Error("Failed to fetch settings");
  return await res.json();
}

// ... (Các hàm 2FA giữ nguyên) ...
export async function start2FA() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/security/2fa/enable-start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to start 2FA process");
  return await res.json();
}

export async function verify2FA(code) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/security/2fa/enable-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code: code }),
  });
  if (!res.ok) throw new Error("Invalid 2FA code");
  return await res.json();
}