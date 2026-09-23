// Single authority (Gate 04A2) validating VITE_API_URL as an ORIGIN-ONLY HTTPS URL.
// Dùng chung bởi runtime client (api.js) và build guard (vite.config.ts) — không nhân
// đôi logic. Dựa trên URL semantics thay vì regex mảnh.
//
// Origin-only nghĩa là: protocol https (localhost được phép http khi allowLocalhost),
// có hostname, KHÔNG userinfo, pathname là "/" hoặc rỗng, KHÔNG query, KHÔNG fragment.

const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1", "::1", "[::1]"];

export function isLocalHostname(hostname) {
  return LOCAL_HOSTNAMES.includes(hostname);
}

// Trả { ok: true, value } hoặc { ok: false, error }. KHÔNG throw (caller quyết định).
export function validateApiOrigin(raw, { allowLocalhost = false } = {}) {
  const value = (raw || "").trim().replace(/\/+$/, "");
  if (!value) {
    return { ok: false, error: "VITE_API_URL trống." };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "VITE_API_URL không phải URL hợp lệ." };
  }

  const local = isLocalHostname(url.hostname);

  if (!url.hostname) {
    return { ok: false, error: "VITE_API_URL thiếu hostname." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "VITE_API_URL không được chứa userinfo (user:pass@)." };
  }
  if (url.protocol !== "https:") {
    const localHttpOk = allowLocalhost && local && url.protocol === "http:";
    if (!localHttpOk) {
      return { ok: false, error: "VITE_API_URL phải là HTTPS origin." };
    }
  }
  if (url.pathname && url.pathname !== "/") {
    return { ok: false, error: "VITE_API_URL phải là origin-only (không kèm path)." };
  }
  if (url.search) {
    return { ok: false, error: "VITE_API_URL không được có query string." };
  }
  if (url.hash) {
    return { ok: false, error: "VITE_API_URL không được có fragment (#...)." };
  }
  if (!allowLocalhost && local) {
    return { ok: false, error: "localhost không hợp lệ ở optimized build." };
  }

  return { ok: true, value: url.origin };
}
