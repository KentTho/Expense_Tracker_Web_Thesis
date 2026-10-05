// API client contract: origin-only base, query builder, error sanitization,
// và 401 -> forceLogout xoá session (single logout authority ở api.js).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../components/firebase", () => ({ auth: {}, default: {} }));
const mockSignOut = vi.fn();
vi.mock("firebase/auth", () => ({ signOut: (...a) => mockSignOut(...a) }));

import {
  BACKEND_BASE,
  resolveBackendBase,
  buildQuery,
  publicFetch,
  authorizedFetch,
} from "../services/api";

function mockFetch(ok, body, status) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status: status ?? (ok ? 200 : 400),
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    blob: async () => body,
  });
}

describe("api client contract", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSignOut.mockReset().mockResolvedValue();
  });
  afterEach(() => vi.restoreAllMocks());

  it("BACKEND_BASE defaults to localhost origin (no /api, no trailing slash)", () => {
    expect(BACKEND_BASE).toBe("http://localhost:8000");
  });

  it("resolveBackendBase DEV: missing -> localhost fallback; strips trailing slash", () => {
    expect(resolveBackendBase("", { isDev: true })).toBe("http://localhost:8000");
    expect(resolveBackendBase("https://api.x.com/", { isDev: true })).toBe("https://api.x.com");
  });

  it("resolveBackendBase PROD fail-closed: missing throws (never silently localhost)", () => {
    expect(() => resolveBackendBase("", { isDev: false })).toThrow(/VITE_API_URL/);
  });

  it("resolveBackendBase PROD rejects path suffix, non-HTTPS, query/hash", () => {
    expect(() => resolveBackendBase("https://api.x.com/auth", { isDev: false })).toThrow(/path/i);
    expect(() => resolveBackendBase("https://api.x.com/v1", { isDev: false })).toThrow(/path/i);
    expect(() => resolveBackendBase("http://api.x.com", { isDev: false })).toThrow(/HTTPS/i);
    expect(() => resolveBackendBase("https://api.x.com?a=1", { isDev: false })).toThrow(/query/i);
  });

  it("resolveBackendBase PROD accepts valid https origin; rejects localhost (Gate 04A2)", () => {
    expect(resolveBackendBase("https://api.x.com", { isDev: false })).toBe("https://api.x.com");
    // Localhost KHÔNG còn được chấp nhận ở optimized/prod build (chỉ dev/test).
    // http://localhost bị chặn ở luật HTTPS; https://localhost bị chặn ở luật localhost.
    expect(() => resolveBackendBase("http://localhost:8000", { isDev: false })).toThrow();
    expect(() => resolveBackendBase("https://localhost", { isDev: false })).toThrow(/localhost/i);
  });

  it("buildQuery skips empty/null and encodes the rest", () => {
    expect(buildQuery({ a: 1, b: "", c: null, d: "x" })).toBe("?a=1&d=x");
    expect(buildQuery({})).toBe("");
  });

  it("publicFetch surfaces backend detail (not raw dump) on error", async () => {
    mockFetch(false, { detail: "Email không hợp lệ" }, 400);
    await expect(publicFetch("/auth/x", { method: "POST" })).rejects.toThrow(
      "Email không hợp lệ"
    );
  });

  it("authorizedFetch on 401 without Firebase user clears session (forceLogout authority)", async () => {
    localStorage.setItem("idToken", "tok");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    mockFetch(false, { detail: "expired" }, 401);

    await expect(authorizedFetch("/dashboard/data")).rejects.toThrow(/Session expired/);
    expect(localStorage.getItem("idToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("authorizedFetch on 401 with active Firebase user silently refreshes session and retries once", async () => {
    const { auth } = await import("../components/firebase");
    auth.currentUser = {
      email: "qa@example.com",
      displayName: "QA User",
      photoURL: null,
      getIdToken: vi.fn().mockResolvedValue("new-firebase-id-token"),
    };

    localStorage.setItem("idToken", "expired-backend-jwt");

    // Sequence:
    // 1. Initial GET /dashboard/data -> 401
    // 2. POST /auth/sync -> 200 { access_token: "fresh-backend-jwt" }
    // 3. Retry GET /dashboard/data -> 200 { success: true, balance: 100 }
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
      callCount++;
      const getHeader = (name) => {
        if (!opts?.headers) return null;
        if (typeof opts.headers.get === "function") return opts.headers.get(name);
        return opts.headers[name] || opts.headers[name.toLowerCase()];
      };

      if (callCount === 1) {
        expect(url).toContain("/dashboard/data");
        expect(getHeader("Authorization")).toBe("Bearer expired-backend-jwt");
        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: "Token expired" }),
          text: async () => JSON.stringify({ detail: "Token expired" }),
        };
      }
      if (callCount === 2) {
        expect(url).toContain("/auth/sync");
        expect(getHeader("Authorization")).toBe("Bearer new-firebase-id-token");
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "fresh-backend-jwt" }),
          text: async () => JSON.stringify({ access_token: "fresh-backend-jwt" }),
        };
      }
      if (callCount === 3) {
        expect(url).toContain("/dashboard/data");
        expect(getHeader("Authorization")).toBe("Bearer fresh-backend-jwt");
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, balance: 100 }),
          text: async () => JSON.stringify({ success: true, balance: 100 }),
        };
      }
      throw new Error(`Unexpected call #${callCount}`);
    });

    const result = await authorizedFetch("/dashboard/data");
    expect(result).toEqual({ success: true, balance: 100 });
    expect(localStorage.getItem("idToken")).toBe("fresh-backend-jwt");
    expect(mockSignOut).not.toHaveBeenCalled();

    auth.currentUser = null;
  });

  it("authorizedFetch on 401 where refresh also fails triggers clean forceLogout", async () => {
    const { auth } = await import("../components/firebase");
    auth.currentUser = {
      email: "qa@example.com",
      getIdToken: vi.fn().mockRejectedValue(new Error("Firebase token revoked")),
    };

    localStorage.setItem("idToken", "expired-backend-jwt");
    mockFetch(false, { detail: "expired" }, 401);

    await expect(authorizedFetch("/dashboard/data")).rejects.toThrow(/Session expired/);
    expect(localStorage.getItem("idToken")).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();

    auth.currentUser = null;
  });

  it("SESSION-SYNC-422-01: silent refresh payload must contain email, firebase_uid, and display_name", async () => {
    const { auth } = await import("../components/firebase");
    auth.currentUser = {
      uid: "firebase-uid-qa-999",
      email: "qa@example.com",
      displayName: "QA User",
      getIdToken: vi.fn().mockResolvedValue("fresh-fb-token"),
    };

    localStorage.setItem("idToken", "expired-jwt");

    let capturedSyncBody = null;
    let syncHeaders = null;
    globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
      const authHeader = typeof opts?.headers?.get === "function" ? opts.headers.get("Authorization") : opts?.headers?.Authorization;
      if (url.includes("/dashboard/data") && authHeader === "Bearer expired-jwt") {
        return { ok: false, status: 401, json: async () => ({ detail: "expired" }), text: async () => "expired" };
      }
      if (url.includes("/auth/sync")) {
        capturedSyncBody = JSON.parse(opts.body);
        syncHeaders = authHeader;
        return { ok: true, status: 200, json: async () => ({ access_token: "renewed-jwt" }), text: async () => JSON.stringify({ access_token: "renewed-jwt" }) };
      }
      if (url.includes("/dashboard/data") && authHeader === "Bearer renewed-jwt") {
        return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => JSON.stringify({ ok: true }) };
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await authorizedFetch("/dashboard/data");
    expect(syncHeaders).toBe("Bearer fresh-fb-token");
    expect(capturedSyncBody).toEqual({
      email: "qa@example.com",
      firebase_uid: "firebase-uid-qa-999",
      display_name: "QA User",
    });

    auth.currentUser = null;
  });
});
