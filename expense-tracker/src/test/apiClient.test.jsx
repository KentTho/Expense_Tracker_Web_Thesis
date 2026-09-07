// API client contract: origin-only base, query builder, error sanitization,
// và 401 -> forceLogout xoá session (single logout authority ở api.js).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../components/firebase", () => ({ auth: {}, default: {} }));
const mockSignOut = vi.fn();
vi.mock("firebase/auth", () => ({ signOut: (...a) => mockSignOut(...a) }));

import { BACKEND_BASE, buildQuery, publicFetch, authorizedFetch } from "../services/api";

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
