// services/transactionService.jsx
import { getToken } from "./incomeService"; // Lấy hàm getToken đã sửa từ incomeService
import { BACKEND_BASE } from "./api";
import { auth } from "../components/firebase"; // Cần để logout nếu import getToken lỗi
import { signOut } from "firebase/auth";

export async function getRecentTransactions(limit = 5) {
    try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_BASE}/transactions/recent?limit=${limit}`, { 
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
            // Xử lý logout tại chỗ nếu incomeService chưa bắt
            localStorage.clear();
            sessionStorage.clear();
            await signOut(auth);
            window.location.href = "/login";
            throw new Error("Session expired");
        }

        if (!res.ok) {
            throw new Error("Failed to fetch recent transactions");
        }
        return await res.json(); 
    } catch (error) {
        throw error;
    }
}