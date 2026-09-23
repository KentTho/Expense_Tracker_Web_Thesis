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

  it("authorizedFetch on 401 clears session (forceLogout authority)", async () => {
    localStorage.setItem("idToken", "tok");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    mockFetch(false, { detail: "expired" }, 401);

    await expect(authorizedFetch("/dashboard/data")).rejects.toThrow(/Session expired/);
    expect(localStorage.getItem("idToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
