import { BACKEND_BASE } from "./api";
import { getToken } from "./incomeService"; // Lấy hàm getToken

export async function getSecuritySettings() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/security/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return await res.json();
}

export async function updateSecuritySettings(settings) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/security/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return await res.json();
}

export async function start2FA() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/security/2fa/enable-start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to start 2FA process");
  return await res.json(); // Trả về { secret, qr_url }
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
  return await res.json(); // Trả về { success: true }
}