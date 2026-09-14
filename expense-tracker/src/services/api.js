import { signOut } from "firebase/auth";
import { auth } from "../components/firebase";

// Canonical rule: VITE_API_URL = ORIGIN ONLY (vd https://api.example.com).
// KHÔNG kèm path (/api, /auth) và KHÔNG trailing slash — mọi route được ghép ở resolveUrl.
//
// FAIL-CLOSED (Gate 04A1): DEV thiếu biến → localhost:8000 (tiện dev). PRODUCTION
// thiếu/không hợp lệ → THROW rõ ràng, KHÔNG bao giờ âm thầm ship http://localhost:8000.
// Đây là NGUỒN DUY NHẤT chuẩn hoá origin backend cho toàn frontend.
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function isLocalOrigin(value) {
  return LOCAL_HOSTS.some(
    (host) => value === `http://${host}` || value.startsWith(`http://${host}:`)
  );
}

export function resolveBackendBase(raw, { isDev = false } = {}) {
  const value = (raw || "").trim().replace(/\/+$/, "");
  const hasPathSuffix = /\/(api|auth)$/i.test(value);

  if (!value) {
    if (isDev) return "http://localhost:8000";
    throw new Error(
      "[api] VITE_API_URL bắt buộc ở production build (origin-only, HTTPS). " +
        "Chưa cấu hình → từ chối chạy để tránh gọi nhầm localhost."
    );
  }

  if (isDev) {
    if (hasPathSuffix) {
      console.warn(
        `[api] VITE_API_URL nên là origin-only (không kèm path). Phát hiện đuôi path trong "${value}".`
      );
    }
    return value;
  }

  // Production: siết chặt. Ngoại lệ local/test mode = localhost origin (smoke build).
  if (hasPathSuffix) {
    throw new Error("[api] VITE_API_URL production KHÔNG được kèm path (/api, /auth).");
  }
  if (!/^https:\/\//i.test(value) && !isLocalOrigin(value)) {
    throw new Error("[api] VITE_API_URL production phải là HTTPS origin.");
  }
  return value;
}

export const BACKEND_BASE = resolveBackendBase(import.meta.env.VITE_API_URL, {
  isDev: import.meta.env.DEV,
});

export async function forceLogout() {
  localStorage.removeItem("idToken");
  localStorage.removeItem("user");
  sessionStorage.clear();

  try {
    await signOut(auth);
  } catch (error) {
    console.error("Failed to sign out from Firebase:", error);
  }

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function getAccessToken() {
  const token = localStorage.getItem("idToken");

  if (!token) {
    await forceLogout();
    throw new Error("No access token found. Please login again.");
  }

  return token;
}

function resolveUrl(pathOrUrl) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return `${BACKEND_BASE}${pathOrUrl}`;
}

function buildHeaders(options = {}, token = null) {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function parseResponse(response, responseType = "json") {
  if (response.status === 204) {
    return { success: true };
  }

  if (responseType === "blob") {
    return response.blob();
  }

  if (responseType === "text") {
    return response.text();
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getErrorMessage(response) {
  const payload = await parseResponse(response, "json");

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload?.detail) {
    return payload.detail;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  return `Request failed with status ${response.status}`;
}

export async function authorizedFetch(pathOrUrl, options = {}, config = {}) {
  const token = await getAccessToken();
  const responseType = config.responseType || "json";
  const response = await fetch(resolveUrl(pathOrUrl), {
    ...options,
    headers: buildHeaders(options, token),
  });

  if (response.status === 401) {
    await forceLogout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return parseResponse(response, responseType);
}

export async function publicFetch(pathOrUrl, options = {}, config = {}) {
  const responseType = config.responseType || "json";
  const response = await fetch(resolveUrl(pathOrUrl), {
    ...options,
    headers: buildHeaders(options),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return parseResponse(response, responseType);
}

export function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
