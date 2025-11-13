// Ví dụ: transactionService.jsx (Cần tạo nếu chưa có)
import { getToken } from "./incomeService"; // hoặc expenseService
import { BACKEND_BASE } from "./api";

// Hàm lấy các giao dịch gần đây
export async function getRecentTransactions(limit = 5) {
    const token = await getToken();
    const res = await fetch(`${BACKEND_BASE}/transactions/recent?limit=${limit}`, { 
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch recent transactions");
    }
    // Giả định BE trả về [{ id, type, amount, emoji, category, date, ...}, ...]
    return await res.json(); 
}