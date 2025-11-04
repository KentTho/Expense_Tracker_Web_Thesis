// ===========================
// 💰 incomeService.jsx
// ===========================
import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";
import { onAuthStateChanged } from "firebase/auth";

// ----------------------------------------------------
// 🧩 Helper: Lấy Firebase token hiện tại
// ----------------------------------------------------
export const getToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    // Đợi user login nếu chưa có
    await new Promise((resolve) => {
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

// ----------------------------------------------------
// 🧩 Helper: Chuẩn hóa payload để gửi cho backend (Đã sửa)
// ----------------------------------------------------
function buildIncomePayload(form) {
    const payload = {
        category_name: form.category_name || null,
        amount: Number(form.amount),
        date: form.date,
        emoji: form.emoji || null,
        // ✅ GỬI category_id: Đây là ID UUID thật từ DB (Default hoặc User Category)
        category_id: form.category_id || null, 
    };
    
    // Loại bỏ mọi logic kiểm tra is_user_category
    
    return payload;
}
// ----------------------------------------------------
// 📤 POST /incomes — Tạo thu nhập mới
// ----------------------------------------------------
export async function createIncome(data) {
  const token = await getToken();
  const payload = buildIncomePayload(data);

  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return await res.json();
}

// (Giữ nguyên getIncomes, updateIncome, deleteIncome)
export async function getIncomes() {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.detail || "Failed to fetch incomes!");
  }
  return await res.json();
}

export async function updateIncome(id, data) {
  const token = await getToken();
  const payload = buildIncomePayload(data);

  const res = await fetch(`${BACKEND_BASE}/incomes/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.detail || "Failed to update incomes!");
  }
  return await res.json();
}

export async function deleteIncome(id) {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/incomes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return await res.json();
}
