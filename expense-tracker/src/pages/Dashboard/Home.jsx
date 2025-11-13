import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
    DollarSign,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    PieChart as PieIcon,
    Wallet,
    Loader2,
    BarChart2, 
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
    LineChart, 
    Line, 
    YAxis, 
    CartesianGrid, 
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

// ⬇️ Imports Dịch vụ API (Không thay đổi)
import { getFinancialKpiSummary } from "../../services/incomeService";
import { 
    getExpenseDailyTrend, 
    getExpenseBreakdown 
} from "../../services/expenseService";
import { getRecentTransactions } from "../../services/transactionService"; 

// Màu sắc cho biểu đồ breakdown (Giữ nguyên)
const BREAKDOWN_COLORS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", 
    "#FF9F40", "#A9A9A9", "#7B68EE", "#3CB371", "#FFDAB9"
];

// ----------------------------------------------------
// 💡 HELPER: Định dạng tiền tệ (Giữ nguyên)
// ----------------------------------------------------
const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
    // (Giữ nguyên)
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return 'N/A';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    } catch (error) {
        console.error("Error formatting amount:", error);
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

export default function Home() {
    const { theme, displayCurrency } = useOutletContext();
    const isDark = theme === "dark";
    
    // --- State cho Dữ liệu ---
    const [summary, setSummary] = useState({ 
        total_income: 0, 
        total_expense: 0, 
        balance: 0 
    });
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [expenseTrend, setExpenseTrend] = useState([]); 
    const [loading, setLoading] = useState(false);

    // ----------------------------------------------------
    // 🧩 Function to fetch all data (ĐÃ CẬP NHẬT)
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Sử dụng Promise.all để tải song song
            const [kpiData, breakdownData, recentTx, trendData] = await Promise.all([
                getFinancialKpiSummary(),
                getExpenseBreakdown(),
                getRecentTransactions(10),
                getExpenseDailyTrend(30) 
            ]);

            // 1. Xử lý KPI
            const totalIncome = Number(kpiData.total_income) || 0;
            const totalExpense = Number(kpiData.total_expense) || 0;
            setSummary({
                total_income: totalIncome,
                total_expense: totalExpense,
                balance: totalIncome - totalExpense,
            });

            // 2. Xử lý Breakdown (Pie Chart)
            const formattedBreakdown = breakdownData.map(item => ({
                name: item.category_name,
                value: Number(item.total_amount) || 0,
            })).filter(item => item.value > 0);
            setExpenseBreakdown(formattedBreakdown);

            // 3. Xử lý Recent Transactions
            setRecentTransactions(recentTx);

            // 4. Xử lý Expense Trend (Line Chart)
            const formattedTrend = trendData.map(item => ({
                date: item.date, 
                amount: Number(item.total_amount) || 0
            }));
            setExpenseTrend(formattedTrend);

        } catch (error) {
            toast.error(error.message || "Failed to fetch dashboard data.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pieChartData = expenseBreakdown;

    // ----------------------------------------------------
    // 🖼️ JSX for Home Component (ĐÃ CẬP NHẬT LAYOUT)
    // ----------------------------------------------------
    return (
        <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster />
            
            {/* Header (Giữ nguyên) */}
            <header className={`py-6 px-4 shadow-md ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Wallet size={30} className="text-blue-500" /> Dashboard
                </h1>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            ) : (
                <main className="p-4 md:p-6 space-y-6">
                    {/* KPI Cards (Giữ nguyên) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Income */}
                        <div className={`p-4 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Total Income
                                </h3>
                                <ArrowUpCircle size={24} className="text-green-500" />
                            </div>
                            <p className="mt-1 text-3xl font-bold text-green-400">
                                {formatAmountDisplay(summary.total_income, displayCurrency, 0)}
                            </p>
                        </div>

                        {/* Total Expense */}
                        <div className={`p-4 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Total Expense
                                </h3>
                                <ArrowDownCircle size={24} className="text-red-500" />
                            </div>
                            <p className="mt-1 text-3xl font-bold text-red-400">
                                {formatAmountDisplay(summary.total_expense, displayCurrency, 0)}
                            </p>
                        </div>

                        {/* Balance */}
                        <div className={`p-4 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                    Current Balance
                                </h3>
                                <DollarSign size={24} className="text-blue-500" />
                            </div>
                            <p className={`mt-1 text-3xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatAmountDisplay(summary.balance, displayCurrency, 0)}
                            </p>
                        </div>
                    </div>

                    {/* KHU VỰC BIỂU ĐỒ (ĐÃ SỬA LAYOUT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. Expense Breakdown (Pie Chart) */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <PieIcon size={20} className="text-yellow-500" /> Expense Breakdown
                                </h2>
                                <Link to="/analytics" className="text-sm text-blue-500 hover:text-blue-400">
                                    View Details
                                </Link>
                            </div>
                            <div className="h-64">
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value, name, props) => [formatAmountDisplay(value, displayCurrency, 0), props.payload.name]}
                                                contentStyle={{ 
                                                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                                    borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                                    borderRadius: "8px" 
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex justify-center items-center h-full text-gray-500">
                                        No expense data for breakdown.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. BIỂU ĐỒ MỚI: Expense Trend (Line Chart) */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                                <BarChart2 size={20} className="text-red-500" /> Expense Trend (30 Days)
                            </h2>
                            <div className="h-64">
                                {expenseTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={expenseTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#4B5563" : "#D1D5DB"} />
                                            <XAxis dataKey="date" fontSize={10} stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                            <YAxis fontSize={10} stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                            <Tooltip 
                                                formatter={(value) => [formatAmountDisplay(value, displayCurrency, 0), "Expense"]}
                                                contentStyle={{ 
                                                    backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                                    borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                                    borderRadius: "8px" 
                                                }}
                                                labelStyle={{ color: isDark ? "#E5E7EB" : "#374151" }}
                                                itemStyle={{ color: "#EF4444" }} // Màu đỏ cho expense
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="amount" 
                                                stroke="#EF4444" // Màu đỏ
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex justify-center items-center h-full text-gray-500">
                                        No expense trend data available.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    {/* Recent Transactions (Giữ nguyên) */}
                    <div className={`p-6 rounded-xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <TrendingUp size={20} className="text-cyan-500" /> Recent Transactions
                            </h2>
                            <Link to="/analytics" className="text-sm text-blue-500 hover:text-blue-400">
                                View All
                            </Link> {/* ✅ ĐÃ SỬA LỖI Ở ĐÂY */}
                        </div>
                        <div className="space-y-2">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{tx.emoji}</span>
                                            <div>
                                                <p className="font-medium">{tx.name || tx.category?.name || 'Transaction'}</p>
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
                                            {tx.type === "income" ? "+" : "-"}
                                            {formatAmountDisplay(tx.amount, tx.currency_code || displayCurrency, 0)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500">No recent transactions found.</p>
                            )}
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}