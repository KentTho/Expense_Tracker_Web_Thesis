// Home.jsx

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
    DollarSign,
    ArrowDown,
    ArrowUp,
    TrendingUp,
    PieChart as PieIcon,
    Wallet,
    Loader2,
    BarChart2, 
    Activity,
    Clock,
    Plus, 
    ChevronDown,
    Megaphone,
    AlertTriangle
} from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

// Giữ nguyên các import service
import { getFinancialKpiSummary } from "../../services/incomeService";
import { 
    getExpenseDailyTrend, 
    getExpenseBreakdown 
} from "../../services/expenseService";
import { getRecentTransactions } from "../../services/transactionService";
import { fetchSystemSettings } from "../../services/adminService";
import { getUserProfile } from "../../services/profileService"; 

const BREAKDOWN_COLORS = [
    "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", 
    "#6366F1", "#EF4444", "#14B8A6", "#F97316", "#A8A29E"
];

// Helper format tiền tệ (An toàn hơn với giá trị null/undefined)
const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
    const numberAmount = Number(amount) || 0; // Fallback về 0 nếu NaN/Null
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    } catch (error) {
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

export default function Home() {
    // Lấy context từ Outlet cha
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";
    
    // State quản lý dữ liệu
    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [expenseTrend, setExpenseTrend] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [budget, setBudget] = useState(0); 

    // State quản lý UI menu
    const [showAddMenu, setShowAddMenu] = useState(false);
    const addMenuRef = useRef(null);

    // Hàm fetch dữ liệu an toàn (Safe Fetching)
    // Giúp User mới không bị báo lỗi đỏ lòm khi chưa có dữ liệu
    const fetchData = useCallback(async () => {
        // Không set loading=true ở đây nếu muốn reload ngầm (optional), 
        // nhưng set ở lần đầu mount là cần thiết.
        
        try {
            // Sử dụng Promise.all để gọi song song, nhưng catch lỗi riêng lẻ từng cái
            // Để đảm bảo 1 cái lỗi không làm sập cả trang dashboard
            const [
                kpiData, 
                breakdownData, 
                recentTx, 
                trendData, 
                systemSettings, 
                userProfile
            ] = await Promise.all([
                // 1. KPI: Nếu lỗi -> trả về object 0
                getFinancialKpiSummary().catch(err => {
                    console.warn("KPI Fetch silent fail:", err);
                    return { total_income: 0, total_expense: 0 };
                }),

                // 2. Breakdown: Nếu lỗi -> trả về mảng rỗng
                getExpenseBreakdown().catch(err => {
                    console.warn("Breakdown Fetch silent fail:", err);
                    return [];
                }),

                // 3. Transactions: Nếu lỗi -> trả về mảng rỗng
                getRecentTransactions(10).catch(err => {
                    console.warn("Transactions Fetch silent fail:", err);
                    return [];
                }),

                // 4. Trend: Nếu lỗi -> trả về mảng rỗng
                getExpenseDailyTrend(30).catch(err => {
                    console.warn("Trend Fetch silent fail:", err);
                    return [];
                }),

                // 5. Settings: Lỗi thì bỏ qua
                fetchSystemSettings().catch(() => ({ broadcast_message: "" })),

                // 6. Profile: Lỗi thì bỏ qua
                getUserProfile().catch(() => ({}))
            ]);

            // --- Xử lý dữ liệu sau khi fetch an toàn ---

            // Broadcast Message
            if (systemSettings && systemSettings.broadcast_message) {
                setBroadcastMsg(systemSettings.broadcast_message);
            }

            // Summary
            const totalIncome = Number(kpiData?.total_income) || 0;
            const totalExpense = Number(kpiData?.total_expense) || 0;
            setSummary({
                total_income: totalIncome,
                total_expense: totalExpense,
                balance: totalIncome - totalExpense,
            });

            // Budget Profile
            if (userProfile) {
                setBudget(Number(userProfile.monthly_budget || 0));
            }

            // Expense Breakdown Chart
            const formattedBreakdown = Array.isArray(breakdownData) 
                ? breakdownData.map(item => ({
                    name: item.category_name,
                    value: Number(item.total_amount) || 0,
                })).filter(item => item.value > 0)
                : [];
            setExpenseBreakdown(formattedBreakdown);

            // Recent Transactions
            const formattedRecentTx = Array.isArray(recentTx) 
                ? recentTx.map(tx => ({
                    ...tx,
                    date: tx.date ? tx.date.split('T')[0] : 'N/A',
                    category_name: tx.category_name || tx.category?.name || 'General'
                })) 
                : [];
            setRecentTransactions(formattedRecentTx);

            // Expense Trend Chart
            const formattedTrend = Array.isArray(trendData) 
                ? trendData.map(item => ({
                    date: item.date, 
                    amount: Number(item.total_amount) || 0
                })) 
                : [];
            setExpenseTrend(formattedTrend);

        } catch (error) {
            // Lỗi nghiêm trọng mới log ra console, KHÔNG TOAST để tránh làm phiền user
            console.error("Critical Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    }, []); 

    // Effect khởi tạo và lắng nghe sự kiện update
    useEffect(() => {
        fetchData();
        
        const handleUpdate = () => {
            // Reload ngầm (không hiện loading spinner toàn màn hình) để trải nghiệm mượt hơn
            fetchData();
        };
        
        window.addEventListener("transactionUpdated", handleUpdate);
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

    // Xử lý click outside menu "Add New"
    useEffect(() => {
        function handleClickOutside(event) {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
                setShowAddMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [addMenuRef]);

    // Render Component: Thẻ ngân sách
    const renderBudgetCard = () => {
        if (budget <= 0) return null; 

        const totalExpense = summary.total_expense;
        const percentage = Math.min((totalExpense / budget) * 100, 100);
        
        let progressColor = "bg-green-500";
        let statusText = "Safe zone";
        let iconColor = "text-gray-500";

        if (percentage >= 80) { 
            progressColor = "bg-yellow-500"; 
            statusText = "Warning"; 
            iconColor = "text-yellow-500";
        }
        if (percentage >= 100) { 
            progressColor = "bg-red-600"; 
            statusText = "Over budget!"; 
            iconColor = "text-red-600 animate-pulse";
        }

        return (
            <div className={`mb-8 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-5 transition-all ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-red-100"}`}>
                <div className={`p-3 rounded-full ${isDark ? "bg-gray-700" : "bg-red-50"}`}>
                    <AlertTriangle className={iconColor} size={28} />
                </div>
                <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Monthly Budget</span>
                        <span className={`text-sm font-bold ${percentage >= 100 ? "text-red-600" : "text-gray-500"}`}>
                            {percentage.toFixed(1)}% ({statusText})
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                        <div 
                            className={`h-3 rounded-full transition-all duration-1000 ease-out ${progressColor}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>Spent: <b>{formatAmountDisplay(totalExpense, currencyCode)}</b></span>
                        <span>Limit: <b>{formatAmountDisplay(budget, currencyCode)}</b></span>
                    </div>
                </div>
            </div>
        );
    };

    // Màn hình Loading
    if (loading) {
        return (
            <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your financial insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            <header className="p-6 sm:p-8 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                                {getGreeting()}
                            </span>
                            <span className="text-2xl animate-wave">👋</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
                            <Clock size={16} /> Here's your financial overview today.
                        </p>
                    </div>
                    
                    <div className="relative hidden sm:block" ref={addMenuRef}>
                        <button 
                            onClick={() => setShowAddMenu(prev => !prev)} 
                            className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-500 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <Plus size={18} /> New Transaction <ChevronDown size={18} />
                        </button>

                        {showAddMenu && (
                            <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-2xl p-2 z-50 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
                                <Link 
                                    to="/income"
                                    onClick={() => setShowAddMenu(false)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-gray-50"}`}
                                >
                                    <ArrowUp size={16} /> Add New Income
                                </Link>
                                <Link 
                                    to="/expense"
                                    onClick={() => setShowAddMenu(false)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-50"}`}
                                >
                                    <ArrowDown size={16} /> Add New Expense
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {broadcastMsg && (
                    <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg flex items-center gap-3 animate-pulse">
                        <Megaphone size={24} />
                        <p className="font-bold text-sm sm:text-base">{broadcastMsg}</p>
                    </div>
                )}
            </header>

            <main className="p-6 sm:p-8 space-y-8">
                
                {renderBudgetCard()}

                {/* 1. KPI CARDS */}
                <div id="tour-kpi" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20 transition-transform hover:scale-[1.02]">
                        <div className="absolute right-0 top-0 p-4 opacity-10"><Wallet size={100} /></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 opacity-90">
                                <div className="p-1.5 bg-white/20 rounded-full"><ArrowUp size={16} /></div>
                                <span className="text-sm font-bold uppercase tracking-wider">Total Income</span>
                            </div>
                            <p className="text-3xl sm:text-4xl font-extrabold">
                                {formatAmountDisplay(summary.total_income, currencyCode, 0)}
                            </p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20 transition-transform hover:scale-[1.02]">
                         <div className="absolute right-0 top-0 p-4 opacity-10"><Activity size={100} /></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 opacity-90">
                                <div className="p-1.5 bg-white/20 rounded-full"><ArrowDown size={16} /></div>
                                <span className="text-sm font-bold uppercase tracking-wider">Total Expense</span>
                            </div>
                            <p className="text-3xl sm:text-4xl font-extrabold">
                                {formatAmountDisplay(summary.total_expense, currencyCode, 0)}
                            </p>
                        </div>
                    </div>

                    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-xl transition-transform hover:scale-[1.02] ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
                         <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={120} /></div>
                        <div className="relative z-10">
                             <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full"><DollarSign size={16} /></div>
                                <span className="text-sm font-bold uppercase tracking-wider">Net Balance</span>
                            </div>
                            <p className={`text-3xl sm:text-4xl font-extrabold ${summary.balance >= 0 ? "text-blue-500" : "text-red-500"}`}>
                                {formatAmountDisplay(summary.balance, currencyCode, 0)}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Available balance across all accounts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div id="tour-chart-trend" className={`lg:col-span-2 p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BarChart2 className="text-blue-500" size={24} />
                                30-Day Expense Trend
                            </h2>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                             {expenseTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={expenseTrend}>
                                        <defs>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12}} 
                                            dy={10} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12}} 
                                            tickFormatter={(val) => formatAmountDisplay(val, currencyCode, 0).replace(currencyCode, "").trim()} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#FFF", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                            formatter={(val) => [formatAmountDisplay(val, currencyCode), "Expense"]} 
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                             ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <BarChart2 size={48} className="mb-2" />
                                    <p className="text-sm">No trend data available yet.</p>
                                    <p className="text-xs mt-1">Add expenses to see analytics.</p>
                                </div>
                             )}
                        </div>
                    </div>

                    <div id="tour-chart-pie" className={`lg:col-span-1 p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <PieIcon className="text-purple-500" size={24} />
                                Breakdown
                            </h2>
                            <Link to="/analytics" className="text-xs font-bold text-purple-500 hover:underline">DETAILS →</Link>
                        </div>
                        <div className="flex-1 min-h-[300px] relative">
                            {expenseBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={expenseBreakdown} 
                                            innerRadius={60} 
                                            outerRadius={90} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} stroke={isDark ? "#1F2937" : "#FFF"} strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                             contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#FFF", borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                             formatter={(val) => formatAmountDisplay(val, currencyCode)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <PieIcon size={48} className="mb-2" />
                                    <p className="text-sm">No expenses yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. RECENT TRANSACTIONS */}
                <div id="tour-recent" className={`p-6 rounded-2xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-orange-500" size={24} />
                            Recent Activity
                        </h2>
                        <Link to="/analytics" className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            View All History
                        </Link>
                    </div>

                    <div className="space-y-1 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx) => (
                                <div 
                                    key={tx.id} 
                                    className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                                            {tx.emoji || "💸"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">{tx.category_name}</p>
                                            <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wide">
                                                {tx.date} • {tx.category_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                                            {tx.type === "income" ? "+" : "-"} {formatAmountDisplay(tx.amount, tx.currency_code || currencyCode, 0)}
                                        </p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${tx.type === "income" ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                                            {tx.type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500 opacity-70">
                                <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No recent activity.</p>
                                <p className="text-xs mt-1">Your recent transactions will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}