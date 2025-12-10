// src/services/authService.jsx
// - ✅ FIX: Thêm hàm saveSession bị thiếu.
// - ✅ LOGIC: Đảm bảo luồng Single Device Mode hoạt động đúng.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getAuth,
} from "firebase/auth";
import { auth } from "../components/firebase"; 
import { BACKEND_BASE } from "./api";

// ✅ HÀM HELPER BỊ THIẾU (ĐÃ THÊM VÀO)
const saveSession = (data) => {
    // data từ backend trả về: { access_token: "...", token_type: "...", user: {...} }
    
    if (data.access_token) {
        localStorage.setItem("idToken", data.access_token);
    }
    
    if (data.user) {
        const userForStorage = { ...data.user };
        delete userForStorage.profile_image; // Xóa ảnh base64 cho nhẹ storage
        localStorage.setItem("user", JSON.stringify(userForStorage));
    }
};

// --- CÁC HÀM CHÍNH ---

// ✅ Đăng ký & Sync
export async function signupAndSync(email, password, displayName = null) {
  try {
    const uc = await createUserWithEmailAndPassword(auth, email, password);
    const user = uc.user;
    const firebaseToken = await user.getIdToken(); 

    const payload = {
      email: user.email,
      display_name: displayName || user.displayName || "",
      firebase_uid: user.uid,
    };

    const res = await fetch(`${BACKEND_BASE}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    
    const data = await res.json(); 
    
    // Lưu session bằng hàm helper đã khai báo
    saveSession(data);

    return { user: data.user, idToken: data.access_token };
  } catch (err) {
    console.error("Signup error:", err);
    throw err;
  }
}

// ✅ Đăng nhập & Sync
export async function loginAndSync(email, password) {
  try {
    const uc = await signInWithEmailAndPassword(auth, email, password);
    const firebaseToken = await uc.user.getIdToken();

    const res = await fetch(`${BACKEND_BASE}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
          email: uc.user.email, 
          firebase_uid: uc.user.uid 
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    
    const data = await res.json(); 
    
    // Gọi hàm helper (lúc này đã có định nghĩa)
    saveSession(data);

    return { user: data.user, idToken: data.access_token }; 
  } catch (err) {
    console.error("Login Error:", err);
    throw err;
  }
}

// ✅ Reset mật khẩu
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
}

// ✅ Đăng xuất
export async function logout() {
  try {
    await signOut(auth);
    localStorage.clear(); // Xóa sạch Token, User
    sessionStorage.clear(); // Xóa Splash Flag
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// ✅ Verify 2FA
export async function verify2FALogin(code) {
  const token = localStorage.getItem("idToken");
  const res = await fetch(`${BACKEND_BASE}/security/2fa/login-verify`, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
  });

  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invalid Code");
  }
  return res.json();
}