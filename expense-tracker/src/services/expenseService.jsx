// ===========================
// 💸 expenseService.jsx (ĐÃ SỬA LỖI ĐỒNG BỘ)
// ===========================
import { auth } from "../components/firebase";
import { BACKEND_BASE } from "./api";
import { onAuthStateChanged } from "firebase/auth";

// ----------------------------------------------------
// 🧩 Helper: Lấy Firebase token hiện tại (Giữ nguyên)
// ----------------------------------------------------
export const getToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          unsubscribe();
          resolve(u);
        }
      });
    });
  }
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated after waiting.");
  }
  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    throw new Error("Failed to retrieve authentication token.");
  }
};

// ----------------------------------------------------
// 🧩 Helper: Chuẩn hóa payload để gửi cho backend
// ----------------------------------------------------
function buildExpensePayload(form) {
    const payload = {
        // ✅ Đảm bảo gửi category_id lên BE, đây là điều kiện để BE lưu đúng Category
        category_id: form.category_id || null, 
        
        // ✅ Gửi category_name (Dùng cho trường hợp tạo category mới hoặc fallback)
        category_name: form.category_name || null, 
        
        amount: Number(form.amount),
        date: form.date,
        emoji: form.emoji || null,
        currency_code: form.currency_code || "USD",
        note: form.note || "",
    };
    return payload;
}

// ----------------------------------------------------
// ➕ CREATE Expense (Giữ nguyên, buildExpensePayload đã sửa)
// ----------------------------------------------------
export async function createExpense(data) {
  const token = await getToken();
  const payload = buildExpensePayload(data); // Đã bao gồm currency_code

  const res = await fetch(`${BACKEND_BASE}/expenses/`, {
    method: "POST",
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
        throw new Error(errJson.detail || "Failed to create expense!");
    } catch (e) {
        throw new Error(errText || "Failed to create expense!");
    }
  }
  return await res.json();
}

// ----------------------------------------------------
// 🔍 GET Expenses List
// ----------------------------------------------------
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

  // ✅ SỬA LỖI: Trả về toàn bộ object (chứa items và currency)
  // để đồng bộ với schema ExpenseListOut
  const data = await res.json();
  return data; 
}

// ----------------------------------------------------
// ✏️ UPDATE Expense (Giữ nguyên, buildExpensePayload đã sửa)
// ----------------------------------------------------
export async function updateExpense(id, data) {
  const token = await getToken();
  const payload = buildExpensePayload(data); // Đã bao gồm currency_code

  const res = await fetch(`${BACKEND_BASE}/expenses/${id}`, {
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

// ----------------------------------------------------
// 🗑️ DELETE Expense (Giữ nguyên)
// ----------------------------------------------------
export async function deleteExpense(id) {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/expenses/${id}`, {
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
  // Backend (crud_expense.py) trả về JSON message
  return await res.json();
}


// ----------------------------------------------------
// 📊 GET Expense Daily Trend (Lấy dữ liệu cho Line Chart)
// ----------------------------------------------------
export async function getExpenseDailyTrend(days = 30) {
    const token = await getToken();

    // ✅ SỬA LỖI (404): Đường dẫn đúng là /expenses/summary/expense-trend/daily
    const res = await fetch(`${BACKEND_BASE}/expenses/summary/expense-trend/daily?days=${days}`, { 
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const errText = await res.text();
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || "Failed to fetch expense daily trend!");
        } catch (e) {
            throw new Error(errText || "Failed to fetch expense daily trend!");
        }
    }
    // BE trả về: [{ date: "2025-10-01", total_amount: 150.50 }, ...]
    return await res.json();
}

// ----------------------------------------------------
// 📊 GET Expense Breakdown (Lấy dữ liệu cho Bar Chart/Pie Chart)
// ----------------------------------------------------
export async function getExpenseBreakdown() {
    const token = await getToken();
    
    // ✅ SỬA LỖI (404): Đường dẫn đúng là /expenses/summary
    const res = await fetch(`${BACKEND_BASE}/expenses/summary`, { 
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const errText = await res.text();
        try {
            const errJson = JSON.parse(errText);
            throw new Error(errJson.detail || "Failed to fetch expense breakdown!");
        } catch (e) {
            throw new Error(errText || "Failed to fetch expense breakdown!");
        }
    }
    
    // BE trả về: [{ category_name: "Food", total_amount: 500.00 }, ...]
    return await res.json();
}