import { signOut } from "firebase/auth";
import { auth } from "../components/firebase";

export const BACKEND_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
