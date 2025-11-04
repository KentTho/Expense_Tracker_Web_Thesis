import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Calendar,
    Filter,
    BarChart3,
    PieChart,
    Download,
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    Pie,
    PieChart as RePieChart,
    Cell, 
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

// IMPORTS DỊCH VỤ CƠ BẢN
import { getIncomes } from "../../services/incomeService";
import { getExpenses } from "../../services/expenseService";
import { getCategories } from "../../services/categoryService"; 

export default function Analytics() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [transactions, setTransactions] = useState([]); // All combined transactions
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(false); 

    const [filters, setFilters] = useState({
        type: "all",
        category: "all",
        startDate: "",
        endDate: "",
    });

    const [filteredData, setFilteredData] = useState([]);

// ----------------------------------------------------
// 🧩 Function to fetch and normalize all data (ĐÃ SỬA CHUẨN HÓA AMOUNT)
// ----------------------------------------------------
const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
        const [incomesResult, expensesResult, incomeCats, expenseCats] = await Promise.all([
            getIncomes(),
            getExpenses(),
            getCategories('income'),
            getCategories('expense'), 
        ]);

        const incomes = Array.isArray(incomesResult) ? incomesResult : [];
        const expenses = Array.isArray(expensesResult) ? expensesResult : [];
        const fetchedIncomeCats = Array.isArray(incomeCats) ? incomeCats : [];
        const fetchedExpenseCats = Array.isArray(expenseCats) ? expenseCats : [];
        
        // 1. Gộp tất cả categories thành Map để tìm kiếm nhanh
        const categoryMap = new Map();
        const allFetchedCategories = [...fetchedIncomeCats, ...fetchedExpenseCats];
        
        allFetchedCategories.forEach(c => {
            if (c.name) {
                categoryMap.set(c.name, c.emoji || c.icon || ""); 
            }
        });

        // 2. Normalize and combine transactions
        const allTransactions = [
            ...incomes.map((inc) => {
                const categoryName = inc.category?.name || inc.category_name || "N/A";
                const safeAmount = Number(inc.amount) || 0; 
                
                if (safeAmount === 0 || isNaN(safeAmount)) return null; 

                return {
                    id: inc.id,
                    type: "income",
                    category: categoryName, 
                    amount: safeAmount,
                    date: inc.date,
                    emoji: inc.emoji || inc.category?.emoji || inc.category?.icon || categoryMap.get(categoryName) || "💰",
                };
            }),
            ...expenses.map((exp) => {
                const categoryName = exp.category?.name || exp.category_name || "N/A";
                const safeAmount = Number(exp.amount) || 0; 
                
                if (safeAmount === 0 || isNaN(safeAmount)) return null; 

                return {
                    id: exp.id,
                    type: "expense",
                    category: categoryName,
                    amount: safeAmount,
                    date: exp.date,
                    emoji: exp.emoji || exp.category?.emoji || exp.category?.icon || categoryMap.get(categoryName) || "💸",
                };
            }),
        ].filter(t => t !== null) // ✅ Lọc bỏ giao dịch lỗi/amount=0
         .sort((a, b) => new Date(b.date) - new Date(a.date)); 

        setTransactions(allTransactions);

        // 3. Chuẩn bị danh sách danh mục (name + emoji) cho dropdown
        const uniqueCategories = new Map();
        allTransactions.forEach(t => {
            if (t.category && t.category !== "N/A") {
                if (!uniqueCategories.has(t.category) || uniqueCategories.get(t.category).emoji === '💰' || uniqueCategories.get(t.category).emoji === '💸') {
                    uniqueCategories.set(t.category, { name: t.category, emoji: t.emoji });
                }
            }
        });
        
        allFetchedCategories.forEach(c => {
            if (c.name) {
                uniqueCategories.set(c.name, { name: c.name, emoji: c.emoji || c.icon || (c.type === 'income' ? '💰' : '💸') });
            }
        });

        setCategories(Array.from(uniqueCategories.values()).sort((a, b) => a.name.localeCompare(b.name)));

    } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load analytics data. Please check connection and authentication.");
    } finally {
        setLoading(false);
    }
}, []);

    // ----------------------------------------------------
    // ⬇️ Function to Export Data to CSV (Giữ nguyên)
    // ----------------------------------------------------
    const exportToCSV = (data, filename) => {
        if (data.length === 0) {
            toast.error("Không có dữ liệu để xuất dựa trên các bộ lọc hiện tại.");
            return;
        }

        const headers = ["ID", "Ngày", "Loại Giao Dịch", "Danh Mục", "Số Tiền"];
        const delimiter = ";"; 
        
        const csvContent = 
            headers.join(delimiter) + "\n" + 
            data.map(t => [
                `"${t.id}"`,
                `"${t.date}"`,
                `"${t.type.charAt(0).toUpperCase() + t.type.slice(1)}"`, 
                `"${t.category.replace(/"/g, '""')}"`, 
                t.amount.toString().replace('.', ',') 
            ].join(delimiter)).join("\n");

        const BOM = "\uFEFF"; 
        const finalCsvContent = BOM + csvContent;

        const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Đã xuất ${data.length} giao dịch vào ${filename}`);
    };

    const handleDownloadReport = () => {
        const filename = `Transactions_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        exportToCSV(filteredData, filename);
    };


    // ----------------------------------------------------
    // 🔄 Initial Data Fetch & Filter Update (Giữ nguyên)
    // ----------------------------------------------------
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        let data = [...transactions];
        if (filters.type !== "all")
            data = data.filter((t) => t.type === filters.type);
        if (filters.category !== "all")
            data = data.filter((t) => t.category === filters.category);

        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        if (startDate)
            data = data.filter((t) => new Date(t.date) >= startDate);

        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setDate(endOfDay.getDate() + 1);
            data = data.filter((t) => new Date(t.date) < endOfDay);
        }

        setFilteredData(data);
    }, [filters, transactions]);


    // --- Total Income & Expense (Giữ nguyên) ---
    const totalIncome = filteredData
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredData
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    // --- Chart Data ---
    const barData = [
        { name: "Income", amount: totalIncome, color: "#10B981" },
        { name: "Expense", amount: totalExpense, color: "#EF4444" },
    ];

    // ✅ FIX: Sửa logic tính toán Pie Data
    const pieData = filteredData 
        .reduce((acc, cur) => {
            const found = acc.find((a) => a.category === cur.category);
            if (cur.category && cur.category !== "N/A" && cur.amount > 0) { // ✅ Lọc cả amount > 0
                if (found) found.amount += cur.amount;
                else acc.push({ category: cur.category, amount: cur.amount });
            }
            return acc;
        }, [])
        .sort((a, b) => b.amount - a.amount);

    const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#C084FC", "#F472B6", "#1D4ED8", "#059669"];


    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                isDark ? "bg-[#0f172a] text-gray-100" : "bg-gray-50 text-gray-900"
            } relative`}
        >
            {/* ⚠️ Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Loader2 className="animate-spin text-white h-10 w-10" />
                </div>
            )}
            
            <Toaster position="top-right" reverseOrder={false} />

            <main className="p-8 space-y-8">
                
                {/* ... (Header & Export Button) ... */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="text-blue-500" /> Analytics Dashboard
                    </h1>

                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                    >
                        <Download size={18} /> Export Report
                    </button>
                </div>

                {/* --- Bộ lọc (Giữ nguyên) --- */}
                <div
                    className={`p-6 rounded-2xl shadow-lg ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Filter /> Filter Options
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Loại giao dịch */}
                        <div>
                            <label className="block text-sm mb-1">Transaction Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-100 border-gray-300"
                                }`}
                            >
                                <option value="all">All</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        {/* Danh mục (Có Emoji) */}
                        <div>
                            <label className="block text-sm mb-1">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-100 border-gray-300"
                                }`}
                            >
                                <option value="all">All</option>
                                {categories.map((cat) => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.emoji ? `${cat.emoji} ` : ""}{cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ngày bắt đầu/kết thúc (Giữ nguyên) */}
                        <div>
                            <label className="block text-sm mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-100 border-gray-300"
                                }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    isDark
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-gray-100 border-gray-300"
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Tổng hợp thống kê (Giữ nguyên) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* ... (Total Balance, Income, Expense) ... */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Total Balance</h3>
                        <p
                            className={`text-3xl font-bold ${
                                totalBalance >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                        >
                            ${totalBalance.toLocaleString()}
                        </p>
                    </div>

                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Total Income</h3>
                        <p className="text-3xl font-bold text-green-400">
                            ${totalIncome.toLocaleString()}
                        </p>
                    </div>

                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Total Expense</h3>
                        <p className="text-3xl font-bold text-red-400">
                            ${totalExpense.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* --- Biểu đồ --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart (Giữ nguyên) */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 /> Income vs Expense
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={barData}>
                                <XAxis dataKey="name" stroke={isDark ? "#94A3B8" : "#334155"} />
                                <Tooltip
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Amount"]}
                                    contentStyle={{
                                        background: isDark ? "#1E293B" : "#F1F5F9",
                                        border: "none",
                                    }}
                                    itemStyle={{ color: isDark ? "#E2E8F0" : "#334155" }}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart - Đã fix lỗi Recharts -1 và lỗi logic Pie Data */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <PieChart /> Category Distribution ({filters.type === 'all' ? 'All Transactions' : filters.type === 'income' ? 'Income' : 'Expense'})
                        </h3>
                         <div className="flex justify-center items-center h-[250px]">
                            {/* Luôn luôn render ResponsiveContainer */}
                            <ResponsiveContainer width="100%" height="100%"> 
                                {pieData.length > 0 ? (
                                    <RePieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="amount"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            labelLine={false}
                                            label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${entry.category}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name, props) => [`$${value.toLocaleString()}`, props.payload.category]}
                                            contentStyle={{
                                                background: isDark ? "#1E293B" : "#F1F5F9",
                                                border: "none",
                                            }}
                                            itemStyle={{ color: isDark ? "#E2E8F0" : "#334155" }}
                                        />
                                    </RePieChart>
                                ) : (
                                    // Hiển thị thông báo bên trong ResponsiveContainer khi không có dữ liệu
                                    <div className="flex items-center justify-center w-full h-full">
                                        <p className="text-gray-500">No category data for the selected filters.</p>
                                    </div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- Bảng thống kê (Giữ nguyên) --- */}
                <div
                    className={`p-6 rounded-2xl shadow-lg ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <h3 className="text-lg font-semibold mb-3">Detailed Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr
                                    className={`border-b ${
                                        isDark ? "border-gray-700" : "border-gray-200"
                                    }`}
                                >
                                    <th className="text-left py-2 px-4">Date</th>
                                    <th className="text-left py-2 px-4">Type</th>
                                    <th className="text-left py-2 px-4">Category</th>
                                    <th className="text-right py-2 px-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((t) => (
                                    <tr
                                        key={t.id}
                                        className={`border-b ${
                                            isDark ? "border-gray-700" : "border-gray-200"
                                        }`}
                                    >
                                        <td className="py-2 px-4">{t.date}</td>
                                        <td
                                            className={`py-2 px-4 font-medium ${
                                                t.type === "income" ? "text-green-400" : "text-red-400"
                                            }`}
                                        >
                                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                                        </td>
                                        <td className="py-2 px-4 flex items-center gap-2">
                                            <span className="text-lg">{t.emoji}</span>
                                            {t.category}
                                        </td>
                                        <td className="py-2 px-4 text-right font-semibold">
                                            ${t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">
                                            No transactions found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}