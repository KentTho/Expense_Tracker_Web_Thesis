// src/services/securityService.jsx
import { BACKEND_BASE } from "./api";
import { getToken } from "./incomeService"; 

// ✅ Hàm này dùng để bật/tắt Single Device Mode
// Nó thực chất là update profile user
export async function updateSecuritySettings(settings) {
  const token = await getToken();
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
  try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_BASE}/auth/user/profile`, {
         method: "GET",
         headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch settings");
      return await res.json();
  } catch (error) {
      console.error("Connection Error:", error);
      // Trả về mặc định để không crash trang web
      return { is_2fa_enabled: false, restrict_multi_device: false };
  }
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