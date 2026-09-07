// AUTH-SESSION / AUTH-E2E (contract-level, Firebase SDK mocked).
// Chứng minh: 1 nguồn ghi session (saveSession), signup partial-failure không tạo
// session và có cờ recover, login 2FA không lưu token, logout xoá sạch.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock module firebase nội bộ + SDK firebase/auth (không chạm mạng thật).
vi.mock("../components/firebase", () => ({ auth: {}, default: {} }));

const mockCreateUser = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...a) => mockCreateUser(...a),
  signInWithEmailAndPassword: (...a) => mockSignIn(...a),
  signOut: (...a) => mockSignOut(...a),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
  verifyBeforeUpdateEmail: vi.fn(),
}));

import { signupAndSync, loginAndSync, logout, verify2FALogin } from "../services/authService";

function mockFetch(ok, body, status) {
  const resp = {
    ok,
    status: status ?? (ok ? 200 : 400),
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone() {
      return resp;
    },
  };
  globalThis.fetch = vi.fn().mockResolvedValue(resp);
}

function fbUser() {
  return { uid: "u1", email: "a@b.com", displayName: "A", getIdToken: async () => "fb-token" };
}

describe("authService session authority", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockCreateUser.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("AUTH-SESSION-01 signup stores canonical token + user", async () => {
    mockCreateUser.mockResolvedValue({ user: fbUser() });
    mockFetch(true, {
      access_token: "backend-jwt-1234567890",
      user: { id: "1", email: "a@b.com", is_admin: false },
    });

    const res = await signupAndSync("a@b.com", "Passw0rd", "A");

    expect(localStorage.getItem("idToken")).toBe("backend-jwt-1234567890");
    expect(JSON.parse(localStorage.getItem("user")).email).toBe("a@b.com");
    expect(res.user.email).toBe("a@b.com");
  });

  it("AUTH-E2E-02 signup: firebase ok + backend sync fail -> partialSignup, no session, no raw leak", async () => {
    mockCreateUser.mockResolvedValue({ user: fbUser() });
    mockFetch(false, { detail: "friendly detail" }, 500);

    await expect(signupAndSync("a@b.com", "Passw0rd", "A")).rejects.toMatchObject({
      partialSignup: true,
    });
    expect(localStorage.getItem("idToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("AUTH-SESSION-02 login (no 2FA) stores exactly one session", async () => {
    mockSignIn.mockResolvedValue({ user: fbUser() });
    mockFetch(true, { access_token: "jwt-aaaaaaaaaaaa", user: { id: "1", email: "a@b.com" } });

    await loginAndSync("a@b.com", "Passw0rd");
    expect(localStorage.getItem("idToken")).toBe("jwt-aaaaaaaaaaaa");
  });

  it("AUTH login requires_2fa does NOT persist a session", async () => {
    mockSignIn.mockResolvedValue({ user: fbUser() });
    mockFetch(true, { requires_2fa: true, pending_token: "pending-xyz" });

    const res = await loginAndSync("a@b.com", "Passw0rd");
    expect(res.requires_2fa).toBe(true);
    expect(localStorage.getItem("idToken")).toBeNull();
  });

  it("2FA valid OTP establishes canonical session", async () => {
    mockFetch(true, { access_token: "jwt-2fa-okokokokok", user: { id: "1", email: "a@b.com" } });
    await verify2FALogin("pending-token", "123456");
    expect(localStorage.getItem("idToken")).toBe("jwt-2fa-okokokokok");
  });

  it("2FA invalid OTP throws sanitized error, no session", async () => {
    mockFetch(false, { detail: "Invalid Code" }, 400);
    await expect(verify2FALogin("pending-token", "000000")).rejects.toThrow("Invalid Code");
    expect(localStorage.getItem("idToken")).toBeNull();
  });

  it("AUTH-SESSION-03 logout clears all session state", async () => {
    localStorage.setItem("idToken", "x");
    localStorage.setItem("user", "{}");
    mockSignOut.mockResolvedValue();

    await logout();
    expect(localStorage.getItem("idToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
