import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";

export const getToken = async () => {
  // 🔹 Nếu user chưa sẵn sàng, chờ cho đến khi Firebase trả về user
  let user = auth.currentUser;
  if (!user) {
    user = await new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        unsubscribe();
        if (u) resolve(u);
        else reject(new Error("User not authenticated"));
      });
    });
  }
  return await user.getIdToken();
};

// ✅ Lấy danh mục mặc định (income / expense)
export async function getDefaultCategories(type) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/categories/default/${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể tải danh mục mặc định!");
  return res.json();
}

// ✅ Lấy tất cả danh mục
export async function getCategories(type) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/categories?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch categories: ${text}`);
  }

  return await res.json();
}

// ✅ Tạo danh mục mới
export async function createCategory(payload) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ✅ Cập nhật danh mục
export async function updateCategory(id, payload) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ✅ Xóa danh mục
export async function deleteCategory(id) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
