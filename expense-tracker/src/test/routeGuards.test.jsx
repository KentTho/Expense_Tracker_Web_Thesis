// FE-AUTH-01..04 — kiểm tra ProtectedRoute/AdminRoute (UX + defense-in-depth).
import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

const tree = (
  <Routes>
    <Route path="/login" element={<div>LOGIN PAGE</div>} />
    <Route path="/dashboard" element={<div>DASHBOARD PAGE</div>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/private" element={<div>PRIVATE PAGE</div>} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<div>ADMIN PANEL</div>} />
      </Route>
    </Route>
  </Routes>
);

function renderAt(path) {
  return render(<MemoryRouter initialEntries={[path]}>{tree}</MemoryRouter>);
}

describe("route guards", () => {
  afterEach(() => localStorage.clear());

  it("FE-AUTH-01 unauthenticated protected route -> /login", () => {
    renderAt("/private");
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });

  it("FE-AUTH-02 non-admin on admin route -> /dashboard", () => {
    localStorage.setItem("idToken", "token");
    localStorage.setItem("user", JSON.stringify({ is_admin: false }));
    renderAt("/admin");
    expect(screen.getByText("DASHBOARD PAGE")).toBeInTheDocument();
  });

  it("FE-AUTH-03 admin allowed on admin route", () => {
    localStorage.setItem("idToken", "token");
    localStorage.setItem("user", JSON.stringify({ is_admin: true }));
    renderAt("/admin");
    expect(screen.getByText("ADMIN PANEL")).toBeInTheDocument();
  });

  it("FE-AUTH-04 logout removes access", () => {
    localStorage.setItem("idToken", "token");
    localStorage.removeItem("idToken"); // mô phỏng logout
    renderAt("/private");
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });
});
