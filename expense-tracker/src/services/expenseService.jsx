// ===========================
// 💸 expenseService.jsx
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
  // Kiểm tra lần nữa sau khi chờ
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated after waiting.");
  }
  // Thêm xử lý lỗi chi tiết hơn nếu cần
  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    throw new Error("Failed to retrieve authentication token.");
  }
};

// ----------------------------------------------------
// 🧩 Helper: Chuẩn hóa payload để gửi cho backend (Quan trọng)
// ----------------------------------------------------
function buildExpensePayload(form) {
    const payload = {
        // Gửi cả name và id, backend sẽ tự quyết định
        category_name: form.category_name || null,
        amount: Number(form.amount),
        date: form.date,
        emoji: form.emoji || null,
        // GỬI category_id: Đây là ID UUID thật từ DB (Default hoặc User Category)
        category_id: form.category_id || null, 
    };
    
    return payload;
}

// ----------------------------------------------------
// ➕ CREATE Expense
// ----------------------------------------------------
export async function createExpense(data) {
  const token = await getToken();
  const payload = buildExpensePayload(data);

  const res = await fetch(`${BACKEND_BASE}/expenses/`, { // Backend route: POST /expenses/
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Cố gắng parse JSON để lấy chi tiết lỗi
    try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || "Failed to create expense!");
    } catch (e) {
        throw new Error(errText || "Failed to create expense!");
    }
  }
  return await res.json();
}

// expenseService.jsx

// (Giữ nguyên các hàm khác)

// 🔍 GET Expenses List
export async function getExpenses() {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/expenses/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || "Failed to fetch expenses!");
    } catch (e) {
        throw new Error(errText || "Failed to fetch expenses!");
    }
  }

  // ✅ ĐÃ SỬA: Trả về trường 'items' chứa danh sách giao dịch
  const data = await res.json();
  return data.items || []; 
}

// (Giữ nguyên các hàm khác)

// ✏️ UPDATE Expense
export async function updateExpense(id, data) {
  const token = await getToken();
  const payload = buildExpensePayload(data);

  const res = await fetch(`${BACKEND_BASE}/expenses/${id}`, { // Backend route: PUT /expenses/{id}
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || "Failed to update expense!");
    } catch (e) {
        throw new Error(errText || "Failed to update expense!");
    }
  }
  return await res.json();
}

// 🗑️ DELETE Expense
export async function deleteExpense(id) {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/expenses/${id}`, { // Backend route: DELETE /expenses/{id}
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || "Failed to delete expense!");
    } catch (e) {
        throw new Error(errText || "Failed to delete expense!");
    }
  }
  // DELETE thường trả về 200/204, không có body.
  return true;
}

// 📊 GET Expense Summary
export async function getExpenseSummary() {
    const token = await getToken();

    const res = await fetch(`${BACKEND_BASE}/expenses/summary`, { // Backend route: GET /expenses/summary
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const errText = await res.text();
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || "Failed to fetch expense summary!");
        } catch (e) {
            throw new Error(errText || "Failed to fetch expense summary!");
        }
    }
    return await res.json();
}