// src/utils/authHelper.js
// Chỉ giữ 2 accessor session READ dùng bởi route guards (ProtectedRoute/AdminRoute).
// Authority cho HTTP + logout là services/api.js (authorizedFetch/publicFetch/forceLogout);
// các bản trùng ở đây đã được gỡ để tránh nhân đôi nguồn session.

export const getToken = () => {
  const token = localStorage.getItem("idToken");
  return token || null;
};

// User hồ sơ lưu ở localStorage["user"] (cùng nguồn Sidebar dùng để hiện menu admin).
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};