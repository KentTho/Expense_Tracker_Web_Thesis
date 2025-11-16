import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Calendar,
    Filter,
    BarChart3,
    PieChart,
    Download, 
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
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
    Legend, 
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

// IMPORTS DỊCH VỤ CƠ BẢN
import { getIncomes } from "../../services/incomeService";
import { getExpenses } from "../../services/expenseService";
import { getCategories } from "../../services/categoryService"; 

// ----------------------------------------------------
// 💡 HELPER: Định dạng tiền tệ
// ----------------------------------------------------
const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
    // (Giữ nguyên, không thay đổi)
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return 'N/A';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    } catch (e) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    }
};

// 💡 HELPER: Custom Tooltip cho Biểu đồ
const CustomTooltip = ({ active, payload, label, currencyCode, isPie }) => {
    // (Giữ nguyên, không thay đổi)
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        // Sửa nhỏ: ưu tiên payload[0].color vì item.color sẽ bị xóa
        const value = item.value || payload[0].value;
        const name = item.name || label;
        const color = payload[0].color || item.color; // Ưu tiên màu fill thực tế
        
        return (
            <div className="p-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                <p className="text-sm font-semibold mb-1" style={{ color }}>
                    {name}
                </p>
                <p className="text-sm">
                    Total: {formatAmountDisplay(value, currencyCode, 0)}
                </p>
                {isPie && item.percent !== undefined && ( 
                    <p className="text-xs text-gray-500">
                        ({(item.percent * 100).toFixed(1)}%)
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// 💡 HELPER: Custom Label cho Pie Chart (Giữ nguyên)
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // (Giữ nguyên, không thay đổi)
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent > 0.05) { 
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    }
    return null;
};


// ✅ FIX 2: Hợp nhất dải màu cố định (giống File 1)
const PIE_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#6B7280', // Gray
    '#A8A29E', // Stone
];

// ----------------------------------------------------
// ✅ Hàm trích xuất dữ liệu an toàn (Giữ nguyên)
// ----------------------------------------------------
const extractItemsAndCurrency = (response, defaultCurrency = 'USD') => {
    // (Giữ nguyên, không thay đổi)
    let items = [];
    let currencyCode = defaultCurrency;
    
    if (Array.isArray(response)) {
        items = response;
    } else if (response && Array.isArray(response.items)) {
        items = response.items;
        currencyCode = response.currency_code || defaultCurrency;
    }
    items = items.map(item => ({
        ...item,
        currency_code: item.currency_code || currencyCode,
    }));
    
    return { items, currencyCode };
};


// ----------------------------------------------------
// 🧩 Main Analytics Component
// ----------------------------------------------------
export default function Analytics() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";
    const PRIMARY_CURRENCY = 'USD'; 

    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(false); 

    const [filters, setFilters] = useState({
        type: "all",
        category: "all",
        startDate: "",
        endDate: "",
    });

    const [filteredData, setFilteredData] = useState([]);

    // ✅ FIX 1: Sửa lại logic fetch categories
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            // Thay vì getCategories('all'), gọi riêng lẻ
            const [incomeResponse, expenseResponse, incomeCats, expenseCats] = await Promise.all([
                getIncomes().catch((e) => { console.error("Income fetch error:", e); return []; }), 
                getExpenses().catch((e) => { console.error("Expense fetch error:", e); return []; }), 
                getCategories('income').catch((e) => { console.error("Income Category fetch error:", e); return []; }),
                getCategories('expense').catch((e) => { console.error("Expense Category fetch error:", e); return []; }),
            ]);

            // Gộp 2 mảng categories lại
            const allFetchedCategories = [
                ...(Array.isArray(incomeCats) ? incomeCats : []), 
                ...(Array.isArray(expenseCats) ? expenseCats : [])
            ];
            
            // Sắp xếp và set state
            setCategories(allFetchedCategories.sort((a, b) => a.name.localeCompare(b.name)));

            const { items: incomeItems } = extractItemsAndCurrency(incomeResponse, PRIMARY_CURRENCY);
            const { items: expenseItems } = extractItemsAndCurrency(expenseResponse, PRIMARY_CURRENCY);

            // Combine and Standardize Transactions (Giữ nguyên logic chuẩn hóa)
            const allTransactions = [
                ...incomeItems.map(t => ({
                    ...t,
                    type: 'income',
                    category: t.category?.name || t.category_name || 'Uncategorized (Income)',
                    category_id: t.category?.id || t.category_id || 'uncat_inc', 
                    emoji: t.category?.emoji || t.emoji || '💰',
                    currency_code: t.currency_code || PRIMARY_CURRENCY, 
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                })),
                
                ...expenseItems.map(t => ({
                    ...t,
                    type: 'expense',
                    category: t.category?.name || t.category_name || 'Uncategorized (Expense)',
                    category_id: t.category?.id || t.category_id || 'uncat_exp', 
                    emoji: t.category?.emoji || t.emoji || '💸',
                    currency_code: t.currency_code || PRIMARY_CURRENCY, 
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                }))
            ];
            
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allTransactions);
            setFilteredData(allTransactions); // Cập nhật filteredData ban đầu
            
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error(error.message || "Failed to load transaction data.");
        } finally {
            setLoading(false);
        }
    }, [PRIMARY_CURRENCY]); 

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // ----------------------------------------------------
    // ⚙️ Filtering Logic (Giữ nguyên)
    // ----------------------------------------------------
    const applyFilters = useCallback(() => {
        let data = transactions;

        if (filters.type !== 'all') {
            data = data.filter(t => t.type === filters.type);
        }
        if (filters.category !== 'all') {
            data = data.filter(t => t.category_id === filters.category);
        }
        if (filters.startDate) {
            data = data.filter(t => new Date(t.date) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); 
            data = data.filter(t => new Date(t.date) <= endDate);
        }

        setFilteredData(data);
    }, [transactions, filters]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // ✅ FIX 2: Sửa logic tính toán màu sắc
    const { totalIncome, totalExpense, netBalance, barData, expensePieData, incomePieData } = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const expenseBreakdown = {};
        const incomeBreakdown = {};

        // Bỏ logic categoryMap vì không dùng để lấy màu nữa
        // const categoryMap = new Map(categories.map(c => [c.id, c]));

        filteredData.forEach(t => {
            const amount = Number(t.amount);
            const categoryName = t.category;
            
            // Xóa bỏ logic lấy màu động
            // const categoryInfo = categoryMap.get(t.category_id);
            // const categoryColor = categoryInfo?.color;
            // const fallbackColor = t.type === 'income' ? '#10B981' : '#EF4444';

            if (t.type === 'income') {
                totalIncome += amount;
                if (!incomeBreakdown[categoryName]) {
                    // Chỉ cần name và value
                    incomeBreakdown[categoryName] = { name: categoryName, value: 0 }; 
                }
                incomeBreakdown[categoryName].value += amount;
            } else {
                totalExpense += amount;
                if (!expenseBreakdown[categoryName]) {
                    // Chỉ cần name và value
                    expenseBreakdown[categoryName] = { name: categoryName, value: 0 }; 
                }
                expenseBreakdown[categoryName].value += amount;
            }
        });

        const netBalance = totalIncome - totalExpense;
        const barData = [
            { name: 'Income', value: totalIncome, color: '#10B981' },
            { name: 'Expense', value: totalExpense, color: '#EF4444' },
        ];

        // Expense Pie Chart Data
        const expensePieDataRaw = Object.values(expenseBreakdown).sort((a, b) => b.value - a.value);
        const totalExpensePie = expensePieDataRaw.reduce((sum, item) => sum + item.value, 0);
        // Bỏ gán màu động ở đây
        const expensePieData = expensePieDataRaw.map((item) => ({
            ...item,
            percent: totalExpensePie === 0 ? 0 : item.value / totalExpensePie,
        }));

        // Income Pie Chart Data
        const incomePieDataRaw = Object.values(incomeBreakdown).sort((a, b) => b.value - a.value);
        const totalIncomePie = incomePieDataRaw.reduce((sum, item) => sum + item.value, 0);
        // Bỏ gán màu động ở đây
        const incomePieData = incomePieDataRaw.map((item) => ({
            ...item,
            percent: totalIncomePie === 0 ? 0 : item.value / totalIncomePie,
        }));


        return { totalIncome, totalExpense, netBalance, barData, expensePieData, incomePieData };
    }, [filteredData]); // Bỏ 'categories' ra khỏi dependency array
    
    // ----------------------------------------------------
    // 🎨 UI Rendering (Giữ nguyên UI của File 2)
    // ----------------------------------------------------

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            type: "all",
            category: "all",
            startDate: "",
            endDate: "",
        });
    };

    const handleExport = () => {
        // (Tạm thời giữ nguyên)
        toast.success(`Exporting ${filteredData.length} transactions... (Functionality to be implemented)`);
    };

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <BarChart3 className="mr-2 text-blue-500" size={28} />
                Financial Analytics
            </h1>

            {loading && transactions.length === 0 ? (
                <div className="flex justify-center items-center h-screen-3/4">
                    <Loader2 className="animate-spin text-blue-500" size={36} />
                </div>
            ) : (
                <main>
                    {/* 📊 KPI Cards (Giữ nguyên) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Income */}
                        <div className={`p-6 rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                <TrendingUp size={20} className="mr-2 text-green-500" /> Total Income
                            </h2>
                            <p className="text-4xl font-bold text-green-500 mt-3">
                                {formatAmountDisplay(totalIncome, PRIMARY_CURRENCY, 0)}
                            </p>
                        </div>

                        {/* Total Expense */}
                        <div className={`p-6 rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                <TrendingDown size={20} className="mr-2 text-red-500" /> Total Expense
                            </h2>
                            <p className="text-4xl font-bold text-red-500 mt-3">
                                {formatAmountDisplay(totalExpense, PRIMARY_CURRENCY, 0)}
                            </p>
                        </div>

                        {/* Net Balance */}
                        <div className={`p-6 rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                <DollarSign size={20} className={`mr-2 ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`} /> Net Balance
                            </h2>
                            <p className={`text-4xl font-bold mt-3 ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {formatAmountDisplay(netBalance, PRIMARY_CURRENCY, 0)}
                            </p>
                        </div>
                    </div>

                    {/* 📊 Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                        
                        {/* 1. Bar Chart: Income vs Expense (Giữ nguyên) */}
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <BarChart3 size={20} className="mr-2 text-blue-500" /> Income vs Expense
                            </h2>
                            <div className="h-80 w-full min-h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <XAxis dataKey="name" stroke={isDark ? "#fff" : "#000"} />
                                        <Tooltip content={<CustomTooltip currencyCode={PRIMARY_CURRENCY} />} />
                                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Pie Chart: Expense Category Breakdown */}
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold mb-4 flex items-center text-red-500">
                                <PieChart size={20} className="mr-2 text-red-500" /> Expense Breakdown
                            </h2>
                            <div className="h-80 w-full flex flex-col items-center justify-center min-h-80">
                                {expensePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Legend 
                                                layout="horizontal" 
                                                verticalAlign="bottom" 
                                                align="center" 
                                                wrapperStyle={{ padding: "0 10px", fontSize: '12px' }}
                                            /> 
                                            <Pie
                                                data={expensePieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%" 
                                                innerRadius={40} 
                                                outerRadius={100} 
                                                labelLine={false}
                                                label={renderCustomLabel} 
                                            >
                                                {/* ✅ FIX 2: Áp dụng màu cố định */}
                                                {expensePieData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-exp-${index}`} 
                                                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip currencyCode={PRIMARY_CURRENCY} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No expense data for breakdown.</p>
                                )}
                            </div>
                        </div>
                        
                        {/* 3. Pie Chart: Income Category Breakdown */}
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-500">
                                <PieChart size={20} className="mr-2 text-green-500" /> Income Breakdown
                            </h2>
                            <div className="h-80 w-full flex flex-col items-center justify-center min-h-80">
                                {incomePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Legend 
                                                layout="horizontal" 
                                                verticalAlign="bottom" 
                                                align="center" 
                                                wrapperStyle={{ padding: "0 10px", fontSize: '12px' }}
                                            /> 
                                            <Pie
                                                data={incomePieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="45%" 
                                                innerRadius={40} 
                                                outerRadius={100} 
                                                labelLine={false}
                                                label={renderCustomLabel} 
                                            >
                                                {/* ✅ FIX 2: Áp dụng màu cố định */}
                                                {incomePieData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-inc-${index}`} 
                                                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip currencyCode={PRIMARY_CURRENCY} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No income data for breakdown.</p>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    {/* ⚙️ Filter and Transactions Table */}
                    <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                        {/* (Giữ nguyên phần Header) */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Transaction History ({filteredData.length} items)</h2>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={resetFilters}
                                    className={`px-3 py-1 text-sm rounded-full ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
                                >
                                    Reset Filters
                                </button>
                                <button 
                                    onClick={handleExport}
                                    className="px-3 py-1 text-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center transition-colors"
                                >
                                    <Download size={16} className="mr-1"/> Export Report
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            {/* Type Filter (Giữ nguyên) */}
                            <div>
                                <label htmlFor="filterType" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                                <select 
                                    id="filterType" 
                                    name="type" 
                                    value={filters.type} 
                                    onChange={handleFilterChange}
                                    className={`p-2 rounded-lg border text-sm ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                >
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>

                            {/* ✅ FIX 1: Dropdown này sẽ hoạt động vì 'categories' state đã có dữ liệu */}
                            <div>
                                <label htmlFor="filterCategory" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                                <select 
                                    id="filterCategory" 
                                    name="category" 
                                    value={filters.category} 
                                    onChange={handleFilterChange}
                                    className={`p-2 rounded-lg border text-sm ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                >
                                    <option value="all">All Categories</option> 
                                    {/* Lặp qua state 'categories' đã được sửa */}
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}> 
                                            {c.icon} {c.name} ({c.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Date Range Filters (Giữ nguyên) */}
                            <div className="flex gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        id="startDate" 
                                        name="startDate" 
                                        value={filters.startDate} 
                                        onChange={handleFilterChange}
                                        className={`p-2 rounded-lg border text-sm ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        id="endDate" 
                                        name="endDate" 
                                        value={filters.endDate} 
                                        onChange={handleFilterChange}
                                        className={`p-2 rounded-lg border text-sm ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Table (ĐÃ CẬP NHẬT) */}
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredData.map((t) => (
                                        <tr 
                                            key={t.id} 
                                            className={`transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                                        >
                                            <td className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">{t.date}</td>
                                            <td 
                                                className={`py-2 px-4 text-sm font-medium ${
                                                    t.type === "income" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                                                }`}
                                            >
                                                {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                                            </td>
                                            <td className="py-2 px-4 flex items-center gap-2">
                                                <span className="text-lg">{t.emoji}</span>
                                                {t.category}
                                            </td>
                                            <td className="py-2 px-4 text-right font-semibold">
                                                {t.type === "expense" ? "-" : "+"} {formatAmountDisplay(t.amount, t.currency_code, 0)}
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
            )}
        </div>
    );
}