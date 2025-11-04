import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
    DollarSign,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    PieChart as PieIcon,
    Wallet,
    Loader2, // Thêm Loader2
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

// ⬇️ Imports Dịch vụ API thực tế
import { getFinancialKpiSummary, getIncomes } from "../../services/incomeService"; // Điều chỉnh nếu hàm nằm ở service khác
import { getExpenses, getExpenseDailyTrend, getExpenseBreakdown } from "../../services/expenseService";
// Màu sắc cho biểu đồ breakdown (Bạn cần định nghĩa mảng này ở đâu đó, ví dụ: constants/charts.js)
const BREAKDOWN_COLORS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
    "#FF9F40", "#A9A9A9", "#7B68EE", "#3CB371", "#FFDAB9"
];

export default function Home() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    // 1. STATE BẮT BUỘC
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        recentTransactions: [],
    });
    const [barData, setBarData] = useState([]); // Dữ liệu 30-Day Expense Trend
    const [expenseBreakdownData, setExpenseBreakdownData] = useState([]); // ✅ STATE MỚI: Dữ liệu Expense Breakdown

    // 🔹 Tính toán Balance từ State
    const totalBalance = stats.totalIncome - stats.totalExpense;

    // 🔹 Dữ liệu biểu đồ Pie Chart tổng quan (giữ nguyên)
    const pieData = [
        { name: "Income", value: stats.totalIncome, color: "#22C55E" },
        { name: "Expense", value: stats.totalExpense, color: "#EF4444" },
    ].filter(data => data.value > 0); 

    const COLORS = ["#22C55E", "#EF4444"];

    // ❌ XÓA KHỐI CODE BỊ LẶP VÀ SAI VỊ TRÍ Ở ĐÂY ❌
    // const [kpiSummary, trendData, incomesResult, expensesResult, breakdownResult] = await Promise.all([ ... ]);

    // ----------------------------------------------------
    // ⬇️ HÀM TẢI DỮ LIỆU TỪ API (Giữ nguyên)
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // ✅ SỬ DỤNG PROMISE.ALL VÀ BỔ SUNG API BREAKDOWN
            const [kpiSummary, trendData, incomesResult, expensesResult, breakdownResult] = await Promise.all([
                getFinancialKpiSummary(), // Đảm bảo hàm này đã được import
                getExpenseDailyTrend(30),
                getIncomes(), // Đảm bảo hàm này đã được import
                getExpenses(),
                getExpenseBreakdown(), 
            ]);

            // 1. Cập nhật KPI State
            setStats(prevStats => ({
                ...prevStats,
                totalIncome: Number(kpiSummary.total_income || 0),
                totalExpense: Number(kpiSummary.total_expense || 0),
            }));

            // 2. Xử lý Recent Transactions (Giữ nguyên)
            const allTransactions = [
                // Normalize Income
                ...(Array.isArray(incomesResult) ? incomesResult.map(inc => ({
                    id: inc.id,
                    name: inc.category?.name || inc.category_name || "Income",
                    amount: Number(inc.amount),
                    type: "income",
                    emoji: inc.category?.icon || inc.emoji || "💰",
                    date: inc.date,
                })) : []),
                // Normalize Expense
                ...(Array.isArray(expensesResult) ? expensesResult.map(exp => ({
                    id: exp.id,
                    name: exp.category?.name || exp.category_name || "Expense",
                    amount: Number(exp.amount),
                    type: "expense",
                    emoji: exp.category?.icon || exp.emoji || "💸",
                    date: exp.date,
                })) : []),
            ]
            .filter(t => !isNaN(t.amount) && t.amount > 0)
            .sort((a, b) => new Date(b.date) - new Date(a.date)) 
            .slice(0, 5); 
            
            setStats(prevStats => ({
                ...prevStats,
                recentTransactions: allTransactions,
            }));

            // 3. Chuẩn hóa dữ liệu trend cho Bar Chart (Giữ nguyên)
            const chartData = trendData.map(item => ({
                day: item.date, 
                expense: Number(item.total_amount) || 0,
            })).sort((a, b) => new Date(a.day) - new Date(b.day)); 

            setBarData(chartData); 

            // 4. Chuẩn hóa Financial Breakdown (Expense by Category) Data (Giữ nguyên)
            const breakdownPieData = Array.isArray(breakdownResult) ? breakdownResult.map((item, index) => ({
                name: item.category_name, 
                value: Number(item.total_amount) || 0, 
                color: BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length], 
            })).filter(d => d.value > 0) : [];
            
            setExpenseBreakdownData(breakdownPieData); // ✅ SỬ DỤNG STATE MỚI ĐÃ KHAI BÁO

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load home dashboard data.");
            setStats({ totalIncome: 0, totalExpense: 0, recentTransactions: [] });
            setBarData([]);
            setExpenseBreakdownData([]); // ✅ Reset state mới khi lỗi
        } finally {
            setLoading(false);
        }
    }, []);

    // ----------------------------------------------------
    // 🔄 Tải dữ liệu ban đầu và Real-time Refresh (Giữ nguyên)
    // ----------------------------------------------------
    useEffect(() => {
        fetchData();
        
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, [fetchData]);


    // ----------------------------------------------------
    // 🎨 UI Component
    // ----------------------------------------------------
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
                {/* --- Header --- */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Financial Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Track your balance, income, and expenses
                    </p>
                </div>

                {/* --- Tổng quan tài chính (KPIs) --- */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Total Balance */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Total Balance</h3>
                            <Wallet className="text-blue-500" size={24} />
                        </div>
                        <h2 className="text-4xl font-bold mt-3">
                            ${totalBalance.toLocaleString()}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Income - Expense</p>
                    </div>

                    {/* Total Income */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Total Income</h3>
                            <ArrowUpCircle className="text-green-400" size={24} />
                        </div>
                        <h2 className="text-4xl font-bold mt-3 text-green-400">
                            ${stats.totalIncome.toLocaleString()}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">All-time earnings</p>
                    </div>

                    {/* Total Expense */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg flex flex-col justify-between ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Total Expense</h3>
                            <ArrowDownCircle className="text-red-400" size={24} />
                        </div>
                        <h2 className="text-4xl font-bold mt-3 text-red-400">
                            ${stats.totalExpense.toLocaleString()}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Total spending</p>
                    </div>
                </div>

                {/* --- Biểu đồ tài chính --- */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Pie Chart: Income vs Expense */}
                    <div
                        className={`rounded-2xl p-6 shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <PieIcon size={18} className="text-blue-400" /> Financial Breakdown
                        </h3>
                        {/* Biểu đồ Pie Chart (Expense Breakdown) */}
                          <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                  <Pie
                                      data={expenseBreakdownData} // ✅ Đảm bảo data là 'expenseBreakdownData'
                                      dataKey="value" // ✅ Key cho giá trị (total_amount)
                                      nameKey="name" // ✅ Key cho tên (category_name)
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={100}
                                      fill="#8884d8"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                      {/* Vòng lặp để áp dụng màu sắc */}
                                      {expenseBreakdownData.map((entry, index) => (
                                          <Cell 
                                              key={`cell-${index}`} 
                                              fill={entry.color} 
                                          />
                                      ))}
                                  </Pie>
                                  <Tooltip
                                      formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                                      contentStyle={{ 
                                          backgroundColor: isDark ? "#e3fc09ff" : "#FFFFFF", 
                                          borderColor: isDark ? "#eeeeeeff" : "#fdfdfdff", 
                                          borderRadius: "8px" 
                                      }}
                                  />
                              </PieChart>
                          </ResponsiveContainer>
                    </div>

                    {/* Bar Chart: Chi tiêu 30 ngày */}
                    <div
                        className={`col-span-2 rounded-2xl p-6 shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-400" /> 30-Day Expense Trend
                        </h3>
                        {/* Biểu đồ Bar Chart (Expense Daily Trend) */}
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                <XAxis 
                                    dataKey="day" // ✅ Đảm bảo dataKey là 'day' (như đã chuẩn hóa trong fetchData)
                                    stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString("vi-VN", { day: 'numeric', month: 'numeric' })}
                                />
                                <Tooltip 
                                    cursor={{ fill: isDark ? "rgba(107, 114, 128, 0.2)" : "rgba(229, 231, 235, 0.5)" }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Expense"]}
                                    contentStyle={{ 
                                        backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                        borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                        borderRadius: "8px" 
                                    }}
                                />
                                <Bar 
                                    dataKey="expense" // ✅ Đảm bảo dataKey là 'expense' (như đã chuẩn hóa)
                                    fill="#EF4444" 
                                    radius={[4, 4, 0, 0]} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- Giao dịch gần đây --- */}
                <div
                    className={`rounded-2xl p-6 shadow-lg ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Transactions</h3>
                        <Link
                            to="/transactions"
                            className="text-blue-500 text-sm hover:underline"
                        >
                            See more →
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-700/20">
                        {stats.recentTransactions.length > 0 ? (
                            stats.recentTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{tx.emoji}</span>
                                        <div>
                                            <p className="font-medium">{tx.name}</p>
                                            <p className="text-xs text-gray-400">{tx.date}</p>
                                        </div>
                                    </div>
                                    <p
                                        className={`font-semibold ${
                                            tx.type === "income"
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-4 text-gray-500">No recent transactions found.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}