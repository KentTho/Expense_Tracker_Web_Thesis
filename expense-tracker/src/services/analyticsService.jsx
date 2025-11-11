// ===========================
// 📊 analyticsService.jsx (New File)
// ===========================
import { BACKEND_BASE } from "./api";
// Import getToken từ incomeService hoặc expenseService
import { getToken } from "./incomeService"; 

/**
 * Lấy dữ liệu tổng hợp cho trang Analytics
 * @param {object} filters - Đối tượng chứa type, startDate, endDate, categoryId
 * @returns {Promise<object>} - Dữ liệu thống kê tổng hợp
 */
export async function getAnalyticsSummary(filters) {
    const token = await getToken();
    
    // Xây dựng chuỗi query parameters
    const params = new URLSearchParams();
    params.append('type', filters.type || 'all');
    
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.categoryId) params.append('category_id', filters.categoryId);

    const res = await fetch(`${BACKEND_BASE}/analytics/summary?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch analytics summary: ${errText}`);
    }
    
    return await res.json();
}

