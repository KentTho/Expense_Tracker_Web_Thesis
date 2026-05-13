import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";

function broadcastUserUpdate() {
  window.dispatchEvent(new Event("user_profile_updated"));
}

function extractAccessToken(data) {
  if (!data || typeof data !== "object") return null;

  // common shapes
  const direct =
    data.access_token ||
    data.accessToken ||
    data.token ||
    data.id_token ||
    data.accessTokenToken;

  if (typeof direct === "string" && direct.length > 10) return direct;

  // nested shapes (defensive)
  const nested = data?.data;
  if (nested && typeof nested === "object") {
    const nestedToken =
      nested.access_token ||
      nested.accessToken ||
      nested.token ||
      nested.id_token;

    if (typeof nestedToken === "string" && nestedToken.length > 10) return nestedToken;
  }

  return null;
}

function saveSession(data) {
  const accessToken = extractAccessToken(data);

  if (accessToken) {
    localStorage.setItem("idToken", accessToken);
  }

  if (data?.user) {
    const userForStorage = { ...data.user };
    delete userForStorage.profile_image;
    localStorage.setItem("user", JSON.stringify(userForStorage));
    broadcastUserUpdate();
  }
}

export async function signupAndSync(email, password, displayName = null) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const firebaseToken = await user.getIdToken();

  const response = await fetch(`${BACKEND_BASE}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      display_name: displayName || user.displayName || "",
      firebase_uid: user.uid,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  saveSession(data);
  return { user: data.user, idToken: data.access_token };
}

export async function loginAndSync(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseToken = await credential.user.getIdToken();

  const response = await fetch(`${BACKEND_BASE}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credential.user.email,
      firebase_uid: credential.user.uid,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  if (data.requires_2fa) {
    return { requires_2fa: true, pending_token: data.pending_token };
  }

  saveSession(data);
  return { user: data.user, idToken: data.access_token };
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  return { success: true, message: "Password reset email sent" };
}

export async function logout() {
  await signOut(auth);
  localStorage.clear();
  sessionStorage.clear();
  broadcastUserUpdate();
  return { success: true };
}

export async function verify2FALogin(pending_token, code) {
  const response = await fetch(`${BACKEND_BASE}/security/2fa/login-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pending_token, code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Invalid Code");
  }

  const data = await response.json();
  saveSession(data);
  return data;
}

export async function requestEmailVerification() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not found");
  }

  await sendEmailVerification(user);
  return { success: true, message: "Verification email sent! Please check your inbox." };
}

export async function updateUserEmail(newEmail) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not found");
  }

  await verifyBeforeUpdateEmail(user, newEmail);
  return { success: true, message: "Confirmation email sent to new address." };
}

export async function changeUserEmail(newEmail) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not found");
  }

  try {
    await verifyBeforeUpdateEmail(user, newEmail);
    return { success: true };
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      throw new Error("Security: Please logout and login again to change your email.");
    }
    if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already in use by another account.");
    }
    if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    }
    throw error;
  }
}
