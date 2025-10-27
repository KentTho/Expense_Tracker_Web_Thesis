import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return await user.getIdToken(); // Firebase sẽ tự refresh nếu token hết hạn
}


export async function getCategories(type = "income") {
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
