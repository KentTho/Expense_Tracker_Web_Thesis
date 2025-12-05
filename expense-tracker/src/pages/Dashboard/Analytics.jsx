// Analytics.jsx
// - ✅ LANGUAGE: Reverted to English (Removed i18n).
// - ✅ FIXED: Variable naming and logic.
// - ✅ RETAINED: Smart Grid Layout, Charts, Filters.

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
    YAxis,
    Tooltip,
    Pie,
    PieChart as RePieChart,
    Cell, 
    Legend, 
    CartesianGrid
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

import { getIncomes } from "../../services/incomeService";
import { getExpenses } from "../../services/expenseService";
import { getCategories } from "../../services/categoryService"; 

const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
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

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, currencyCode, isPie }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const value = item.value || payload[0].value;
        const name = item.name || label;
        const color = payload[0].fill || '#8884d8'; 
        
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm">
                <p className="text-sm font-bold mb-1 flex items-center">
                    {isPie && <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />}
                    {name}
                </p>
                <p className="text-base font-bold" style={{ color: color }}>
                    Total: {formatAmountDisplay(value, currencyCode, 0)}
                </p>
                {isPie && item.percent !== undefined && ( 
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        ({(item.percent * 100).toFixed(1)}%)
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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

const PIE_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#6B7280', '#A8A29E'
];

const extractItemsAndCurrency = (response, defaultCurrency = 'USD') => {
    let items = [];
    let currencyCode = defaultCurrency;
    if (Array.isArray(response)) { items = response; } 
    else if (response && Array.isArray(response.items)) {
        items = response.items;
        currencyCode = response.currency_code || defaultCurrency;
    }
    items = items.map(item => ({ ...item, currency_code: item.currency_code || currencyCode }));
    return { items, currencyCode };
};


export default function Analytics() {
    // ✅ Lấy currencyCode từ Context
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";
    // Fallback currency nếu chưa load xong
    const currentCurrency = currencyCode || 'USD';

    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [filters, setFilters] = useState({
        type: "all", category: "all", startDate: "", endDate: "",
    });
    const [filteredData, setFilteredData] = useState([]);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const [incomeResponse, expenseResponse, incomeCats, expenseCats] = await Promise.all([
                getIncomes().catch((e) => { return []; }), 
                getExpenses().catch((e) => { return []; }), 
                getCategories('income').catch((e) => { return []; }),
                getCategories('expense').catch((e) => { return []; }),
            ]);

            const allFetchedCategories = [
                ...(Array.isArray(incomeCats) ? incomeCats : []), 
                ...(Array.isArray(expenseCats) ? expenseCats : [])
            ];
            setCategories(allFetchedCategories.sort((a, b) => a.name.localeCompare(b.name)));

            const { items: incomeItems } = extractItemsAndCurrency(incomeResponse, currentCurrency);
            const { items: expenseItems } = extractItemsAndCurrency(expenseResponse, currentCurrency);

            const allTransactions = [
                ...incomeItems.map(t => ({
                    ...t, type: 'income',
                    category: t.category?.name || t.category_name || 'Uncategorized (Income)',
                    category_id: t.category?.id || t.category_id || 'uncat_inc', 
                    emoji: t.category?.icon || t.emoji || '💰',
                    currency_code: t.currency_code || currentCurrency, 
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                })),
                ...expenseItems.map(t => ({
                    ...t, type: 'expense',
                    category: t.category?.name || t.category_name || 'Uncategorized (Expense)',
                    category_id: t.category?.id || t.category_id || 'uncat_exp', 
                    emoji: t.category?.icon || t.emoji || '💸',
                    currency_code: t.currency_code || currentCurrency, 
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                }))
            ];
            
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(allTransactions);
            setFilteredData(allTransactions);
            
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transaction data.");
        } finally {
            setLoading(false);
        }
    }, [currentCurrency]); 

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const applyFilters = useCallback(() => {
        let data = transactions;
        if (filters.type !== 'all') { data = data.filter(t => t.type === filters.type); }
        if (filters.category !== 'all') { data = data.filter(t => t.category_id === filters.category); }
        if (filters.startDate) { data = data.filter(t => new Date(t.date) >= new Date(filters.startDate)); }
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

    const { totalIncome, totalExpense, netBalance, barData, expensePieData, incomePieData } = useMemo(() => {
        let totalIncome = 0, totalExpense = 0;
        const expenseBreakdown = {}, incomeBreakdown = {};

        filteredData.forEach(t => {
            const amount = Number(t.amount);
            const categoryName = t.category;
            if (t.type === 'income') {
                totalIncome += amount;
                if (!incomeBreakdown[categoryName]) { incomeBreakdown[categoryName] = { name: categoryName, value: 0 }; }
                incomeBreakdown[categoryName].value += amount;
            } else {
                totalExpense += amount;
                if (!expenseBreakdown[categoryName]) { expenseBreakdown[categoryName] = { name: categoryName, value: 0 }; }
                expenseBreakdown[categoryName].value += amount;
            }
        });

        const netBalance = totalIncome - totalExpense;
        // Labels tiếng Anh
        const barData = [
            { name: 'Income', value: totalIncome, color: '#10B981' },
            { name: 'Expense', value: totalExpense, color: '#EF4444' },
        ];

        const expensePieDataRaw = Object.values(expenseBreakdown).sort((a, b) => b.value - a.value);
        const totalExpensePie = expensePieDataRaw.reduce((sum, item) => sum + item.value, 0);
        const expensePieData = expensePieDataRaw.map((item) => ({ ...item, percent: totalExpensePie === 0 ? 0 : item.value / totalExpensePie, }));

        const incomePieDataRaw = Object.values(incomeBreakdown).sort((a, b) => b.value - a.value);
        const totalIncomePie = incomePieDataRaw.reduce((sum, item) => sum + item.value, 0);
        const incomePieData = incomePieDataRaw.map((item) => ({ ...item, percent: totalIncomePie === 0 ? 0 : item.value / totalIncomePie, }));

        return { totalIncome, totalExpense, netBalance, barData, expensePieData, incomePieData };
    }, [filteredData]);
    
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const resetFilters = () => setFilters({ type: "all", category: "all", startDate: "", endDate: "" });
    const handleExport = () => toast.success("Exporting data...");

    if (loading && transactions.length === 0) {
        return (
            <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
                <BarChart3 className="mr-2 text-blue-500" size={36} />
                Financial Analytics
            </h1>

            <main>
                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20">
                        <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={100} /></div>
                        <div className="relative z-10">
                            <h2 className="text-sm font-bold uppercase tracking-wider opacity-90">Total Income</h2>
                            <p className="text-4xl font-extrabold mt-2">
                                {formatAmountDisplay(totalIncome, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20">
                         <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown size={100} /></div>
                        <div className="relative z-10">
                            <h2 className="text-sm font-bold uppercase tracking-wider opacity-90">Total Expense</h2>
                            <p className="text-4xl font-extrabold mt-2">
                                {formatAmountDisplay(totalExpense, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>

                    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
                         <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={120} /></div>
                        <div className="relative z-10">
                             <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Net Balance</h2>
                            <p className={`text-4xl font-extrabold mt-2 ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {formatAmountDisplay(netBalance, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className={`lg:col-span-2 p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                            <BarChart3 size={20} className="mr-2 text-blue-500" /> Income vs Expense
                        </h2>
                        <div className="min-h-[400px]">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={barData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                                    <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={14} tickLine={false} axisLine={false} />
                                    <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={14} tickLine={false} axisLine={false} tickFormatter={(val) => formatAmountDisplay(val, currentCurrency, 0).replace(currentCurrency, "")} />
                                    <Tooltip content={<CustomTooltip currencyCode={currentCurrency} />} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                            <h2 className="text-xl font-semibold mb-4 flex items-center text-red-500">
                                <PieChart size={20} className="mr-2" /> Expense Breakdown
                            </h2>
                            <div className="min-h-[170px]">
                                {expensePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={170}>
                                        <RePieChart>
                                            <Pie
                                                data={expensePieData} dataKey="value" nameKey="name"
                                                cx="35%" cy="50%" innerRadius={45} outerRadius={70} 
                                                labelLine={false} label={renderCustomLabel} 
                                            >
                                                {expensePieData.map((entry, index) => (
                                                    <Cell key={`cell-exp-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                            <Tooltip content={<CustomTooltip currencyCode={currentCurrency} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center py-10 text-gray-500 dark:text-gray-400">No expense data.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                             <h2 className="text-xl font-semibold mb-4 flex items-center text-green-500">
                                <PieChart size={20} className="mr-2" /> Income Breakdown
                            </h2>
                            <div className="min-h-[170px]">
                                {incomePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={170}>
                                        <RePieChart>
                                            <Pie
                                                data={incomePieData} dataKey="value" nameKey="name"
                                                cx="35%" cy="50%" innerRadius={45} outerRadius={70}
                                                labelLine={false} label={renderCustomLabel}
                                            >
                                                {incomePieData.map((entry, index) => (
                                                    <Cell key={`cell-inc-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                            <Tooltip content={<CustomTooltip currencyCode={currentCurrency} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center py-10 text-gray-500 dark:text-gray-400">No income data.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                    
                {/* FILTER BAR */}
                <div className={`p-4 rounded-xl flex flex-wrap items-center gap-4 mb-6 ${isDark ? "bg-gray-800" : "bg-white shadow-md"}`}>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Filter size={18} />
                        <span className="font-semibold">Filters:</span>
                    </div>
                    
                    <div>
                        <select 
                            id="filterType" name="type" value={filters.type} onChange={handleFilterChange}
                            className={`p-2 rounded-lg border text-sm font-medium ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                   
                    <div>
                        <select 
                            id="filterCategory" name="category" value={filters.category} onChange={handleFilterChange}
                            className={`p-2 rounded-lg border text-sm font-medium ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                        >
                            <option value="all">All Categories</option> 
                            {categories.map(c => (
                                <option key={c.id} value={c.id}> 
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <input 
                            type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange}
                            className={`p-2 rounded-lg border text-sm font-medium ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                        />
                    </div>
                    <span className="text-gray-400">to</span>
                    <div>
                        <input 
                            type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange}
                            className={`p-2 rounded-lg border text-sm font-medium ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                        />
                    </div>
                    <button 
                        onClick={resetFilters}
                        className={`px-3 py-2 text-sm rounded-lg font-medium ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                    >
                        Reset
                    </button>
                </div>

                {/* TRANSACTIONS TABLE CARD */}
                <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border"}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Transaction History ({filteredData.length} items)</h2>
                        <button 
                            onClick={handleExport}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center transition-colors font-medium shadow-lg shadow-blue-500/30"
                        >
                            <Download size={16} className="mr-2"/> Export Report
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                        <table className="min-w-full text-base border-collapse">
                            <thead>
                                <tr className={`${isDark ? "bg-gray-700/50" : "bg-gray-100"} text-left border-b-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">Category</th>
                                    <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.map((tx) => (
                                    <tr key={tx.id} className={`transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">{tx.date}</td>
                                        <td className="py-4 px-4 font-bold">
                                            <span className={`py-1 px-2.5 rounded-full text-sm ${
                                                tx.type === "income" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                            }`}>
                                                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 flex items-center gap-3">
                                            <span className="text-xl">{tx.emoji}</span>
                                            <span className="font-medium">{tx.category}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right font-semibold">
                                            {tx.type === "expense" ? "-" : "+"} {formatAmountDisplay(tx.amount, currentCurrency, 0)}
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-10 text-gray-500">
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