// src/services/authService.jsx
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "../components/firebase"; // ⚠️ đảm bảo đúng đường dẫn file firebase
import { BACKEND_BASE } from "./api"; // ví dụ: export const BACKEND_BASE = "http://127.0.0.1:8000";


// ✅ Đăng ký tài khoản và đồng bộ với backend
export async function signupAndSync(email, password, displayName = null) {
  try {
    // Tạo user trong Firebase
    const uc = await createUserWithEmailAndPassword(auth, email, password);
    const user = uc.user;
    const idToken = await user.getIdToken();

    // Payload gửi sang backend FastAPI
    const payload = {
      email: user.email,
      display_name: displayName || user.displayName || "",
      firebase_uid: user.uid,
    };

    const res = await fetch(`${BACKEND_BASE}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    return { user: data, idToken };
  } catch (err) {
    console.error("Signup error:", err);
    throw err;
  }
}


// ✅ Đăng nhập và đồng bộ
export async function loginAndSync(email, password) {
  try {
    const uc = await signInWithEmailAndPassword(auth, email, password);
    const user = uc.user;
    const idToken = await user.getIdToken();

    const payload = {
      email: user.email,
      firebase_uid: user.uid,
    };

    const res = await fetch(`${BACKEND_BASE}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    return { user: data, idToken };
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}


// ✅ Gửi email reset mật khẩu
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
}


// ✅ Đăng xuất (xoá token, user)
export async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("idToken");
    localStorage.removeItem("user");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}
