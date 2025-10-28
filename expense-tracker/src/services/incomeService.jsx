import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";
import { onAuthStateChanged } from "firebase/auth";

// ✅ Lấy token Firebase
export const getToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          unsubscribe();
          resolve(u);
        }
      });
    });
  }
  return await auth.currentUser.getIdToken();
};


// ✅ Lấy danh sách thu nhập
export async function getIncomes() {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ✅ Thêm mới
export async function createIncome(data) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ✅ Cập nhật
export async function updateIncome(id, data) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/incomes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// ✅ Xóa
export async function deleteIncome(id) {
  const token = await getToken();
  const res = await fetch(`${BACKEND_BASE}/incomes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}
