// src/services/authService.jsx
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "../components/firebase"; // ⚠️ đảm bảo đúng đường dẫn file firebase
import { BACKEND_BASE } from "./api"; // ví dụ: export const BACKEND_BASE = "http://127.0.0.1:8000";


// src/services/authService.jsx

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

    // ✅ FIX: TẠO BẢN SAO SẠCH ĐỂ LƯU TRỮ
    const userForStorage = { ...data };
    delete userForStorage.profile_image; // Xóa trường ảnh nặng
    
    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(userForStorage)); // Lưu bản sạch

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
    const data = await res.json(); // data là user object đầy đủ (có thể có ảnh Base64)

    // ✅ FIX: TẠO BẢN SAO SẠCH ĐỂ LƯU TRỮ
    const userForStorage = { ...data };
    delete userForStorage.profile_image; // Xóa trường ảnh nặng
    
    localStorage.setItem("idToken", idToken);
    localStorage.setItem("user", JSON.stringify(userForStorage)); // Lưu bản sạch

    // Trả về data đầy đủ (có ảnh) cho React state
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
    
    // 🔥 QUAN TRỌNG: Xóa trạng thái đã xem Splash để lần sau đăng nhập lại sẽ hiện lại
    sessionStorage.removeItem("hasSeenSplash");
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getValidToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in");
  const token = await user.getIdToken(true); // refresh luôn
  localStorage.setItem("idToken", token);
  return token;
}

// ✅ Hàm gọi API verify 2FA
export async function verify2FALogin(code) {
  const token = localStorage.getItem("idToken"); // Token đã lưu ở bước 1
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