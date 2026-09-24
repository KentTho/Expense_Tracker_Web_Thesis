// Gate 04A2 — single URL-validator authority (origin-only, HTTPS) shared by
// api.js (runtime) và vite.config.ts (build guard). URL semantics, không regex mảnh.
import { describe, it, expect } from "vitest";

import { validateApiOrigin, validateBuildApiOrigin } from "../services/apiUrl";

describe("validateApiOrigin (APIURL)", () => {
  // allowLocalhost=false = optimized build (production/staging).
  it("APIURL-01 build production missing -> fail", () => {
    expect(validateApiOrigin("", { allowLocalhost: false }).ok).toBe(false);
  });

  it("APIURL-02 build staging missing -> fail (same authority, not mode-gated)", () => {
    // Staging build cũng phải validate (Gap A đã đóng): thiếu -> fail.
    expect(validateApiOrigin(undefined, { allowLocalhost: false }).ok).toBe(false);
  });

  it("APIURL-03 arbitrary /v1 path -> fail", () => {
    expect(validateApiOrigin("https://backend.example.com/v1", { allowLocalhost: false }).ok).toBe(
      false
    );
  });

  it("APIURL-04 /api path -> fail", () => {
    expect(validateApiOrigin("https://backend.example.com/api", { allowLocalhost: false }).ok).toBe(
      false
    );
  });

  it("APIURL-05 /auth path -> fail", () => {
    expect(
      validateApiOrigin("https://backend.example.com/auth", { allowLocalhost: false }).ok
    ).toBe(false);
  });

  it("APIURL-06 query/hash -> fail", () => {
    expect(validateApiOrigin("https://backend.example.com?a=1", { allowLocalhost: false }).ok).toBe(
      false
    );
    expect(validateApiOrigin("https://backend.example.com#x", { allowLocalhost: false }).ok).toBe(
      false
    );
  });

  it("APIURL-06b userinfo -> fail", () => {
    expect(
      validateApiOrigin("https://user:pass@backend.example.com", { allowLocalhost: false }).ok
    ).toBe(false);
  });

  it("APIURL-07 valid https origin -> pass (trailing slash normalized)", () => {
    const r = validateApiOrigin("https://backend.example.com/", { allowLocalhost: false });
    expect(r.ok).toBe(true);
    expect(r.value).toBe("https://backend.example.com");
  });

  it("APIURL-08 dev localhost allowed only in dev/test", () => {
    expect(validateApiOrigin("http://localhost:8000", { allowLocalhost: true }).ok).toBe(true);
    // Trong optimized build (allowLocalhost=false) localhost bị từ chối.
    expect(validateApiOrigin("http://localhost:8000", { allowLocalhost: false }).ok).toBe(false);
  });

  it("APIURL-09 non-https non-local -> fail", () => {
    expect(validateApiOrigin("http://backend.example.com", { allowLocalhost: false }).ok).toBe(
      false
    );
  });
});

// Gate 04A2.1 — optimized-build policy: MỌI `vite build` (bất kể mode) cấm localhost,
// khớp runtime (bundle build luôn import.meta.env.DEV === false). validateBuildApiOrigin
// là authority chính sách build (không phụ thuộc mode name).
describe("validateBuildApiOrigin (APIURL-BUILD, optimized-build policy)", () => {
  const LOCAL = "http://localhost:8000";

  it("APIURL-BUILD-01 production + localhost -> FAIL", () => {
    expect(validateBuildApiOrigin(LOCAL).ok).toBe(false);
  });

  it("APIURL-BUILD-02 staging + localhost -> FAIL", () => {
    // mode không còn ảnh hưởng: build policy luôn allowLocalhost=false.
    expect(validateBuildApiOrigin(LOCAL).ok).toBe(false);
  });

  it("APIURL-BUILD-03 development optimized build + localhost -> FAIL (regression)", () => {
    expect(validateBuildApiOrigin(LOCAL).ok).toBe(false);
  });

  it("APIURL-BUILD-04 test optimized build + localhost -> FAIL (regression)", () => {
    expect(validateBuildApiOrigin(LOCAL).ok).toBe(false);
  });

  it("APIURL-BUILD-05 any build missing URL -> FAIL", () => {
    expect(validateBuildApiOrigin("").ok).toBe(false);
    expect(validateBuildApiOrigin(undefined).ok).toBe(false);
  });

  it("APIURL-BUILD-06 any build valid HTTPS origin -> PASS", () => {
    const r = validateBuildApiOrigin("https://backend.example.com");
    expect(r.ok).toBe(true);
    expect(r.value).toBe("https://backend.example.com");
  });

  it("APIURL-RUNTIME-01 dev server localhost -> PASS (allowLocalhost)", () => {
    expect(validateApiOrigin(LOCAL, { allowLocalhost: true }).ok).toBe(true);
  });
});
