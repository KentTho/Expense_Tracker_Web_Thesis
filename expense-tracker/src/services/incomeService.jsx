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
        currency_code: form.currency_code || "USD",
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

// incomeService.jsx

// (Giữ nguyên các hàm khác)

export async function getIncomes() {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/incomes`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    // ✅ Có vẻ có lỗi trong logic error handling cũ của bạn, nên tôi sửa lại cho đồng bộ
    try {
        const errJson = JSON.parse(err);
        throw new Error(errJson.detail || "Failed to fetch incomes!");
    } catch (e) {
        throw new Error(err || "Failed to fetch incomes!");
    }
  }
  
  // ✅ ĐÃ SỬA: Trả về trường 'items' chứa danh sách giao dịch
  const data = await res.json();
  return data.items || [];
}

// (Giữ nguyên các hàm khác)

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


// ====================================================
// 📊 GET Income Summary (Thêm mới)
// ====================================================
export async function getIncomeSummary() {
  const token = await getToken();

  const res = await fetch(`${BACKEND_BASE}/incomes/summary`, { // Backend route: GET /incomes/summary
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.detail || "Failed to fetch income summary!");
    } catch (e) {
        throw new Error(errText || "Failed to fetch income summary!");
    }
  }
  return await res.json();
}

// ===========================
// 💰 incomeService.jsx (Bổ sung/Sửa)
// ===========================

// ... (các hàm hiện có, đảm bảo getToken() vẫn được định nghĩa)

// 📊 GET Financial KPIs
export async function getFinancialKpiSummary() {
    const token = await getToken();

    const res = await fetch(`${BACKEND_BASE}/summary/kpis`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    // 💡 Xử lý lỗi: Đảm bảo BE đã gửi token hợp lệ và route đã được đăng ký
    if (!res.ok) {
        const resText = await res.text();
        try {
            // Thử phân tích JSON (nếu BE trả về lỗi dạng JSON, ví dụ: {"detail":"Not Found"})
            const errJson = JSON.parse(resText);
            throw new Error(JSON.stringify(errJson));
        } catch (e) {
            // Nếu không phải JSON, hoặc lỗi network (Failed to fetch)
            throw new Error(resText || `Failed to fetch KPIs: Status ${res.status}`);
        }
    }
    return await res.json();
}
