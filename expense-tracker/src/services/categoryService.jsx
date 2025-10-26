import { BACKEND_BASE } from "./api";

function getToken() {
  const token = localStorage.getItem("idToken");
  if (!token) throw new Error("User not authenticated");
  return token;
}

export async function getCategories(type = "income") {
  const token = getToken();

  const res = await fetch(`${BACKEND_BASE}/categories?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch categories: ${text}`);
  }

  return await res.json(); // Giờ /categories đã trả cả mặc định + user
}

export async function createCategory(payload) {
  const token = getToken();
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

export async function updateCategory(id, payload) {
  const token = getToken();
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

export async function deleteCategory(id) {
  const token = getToken();
  const res = await fetch(`${BACKEND_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
