// Analytics.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Calendar,
    Filter,
    BarChart3,
    PieChart as PieIcon,
    Download, 
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    SearchX
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

// Giữ nguyên import services
import { getIncomes } from "../../services/incomeService";
import { getExpenses } from "../../services/expenseService";
import { getCategories } from "../../services/categoryService"; 

// Helper format tiền tệ an toàn
const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
    const numberAmount = Number(amount) || 0;
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    } catch (e) {
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

// Custom Tooltip cho biểu đồ
const CustomTooltip = ({ active, payload, label, currencyCode, isPie }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const value = item.value || payload[0].value;
        const name = item.name || label;
        const color = payload[0].fill || payload[0].color || '#8884d8'; 
        
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50">
                <p className="text-sm font-bold mb-1 flex items-center">
                    {isPie && <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />}
                    {name}
                </p>
                <p className="text-base font-bold" style={{ color: color }}>
                    {isPie ? "Total: " : ""} {formatAmountDisplay(value, currencyCode, 0)}
                </p>
                {isPie && item.percent !== undefined && ( 
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({(item.percent * 100).toFixed(1)}%)
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// Label hiển thị trên biểu đồ tròn
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    if (percent > 0.05) { 
        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] sm:text-xs font-bold pointer-events-none">
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

export default function Analytics() {
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";
    const currentCurrency = currencyCode || 'USD';

    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(true); 
    
    // State Filter
    const [filters, setFilters] = useState({
        type: "all", category: "all", startDate: "", endDate: "",
    });
    
    // State Data sau khi filter
    const [filteredData, setFilteredData] = useState([]);

    // --- FETCH DATA ---
    const fetchTransactions = useCallback(async () => {
        try {
            const [incomeRes, expenseRes, incomeCats, expenseCats] = await Promise.all([
                getIncomes().catch(() => ({ items: [] })), 
                getExpenses().catch(() => ({ items: [] })), 
                getCategories('income').catch(() => []),
                getCategories('expense').catch(() => []),
            ]);

            const allFetchedCategories = [
                ...(Array.isArray(incomeCats) ? incomeCats : []), 
                ...(Array.isArray(expenseCats) ? expenseCats : [])
            ];
            const uniqueCategories = Array.from(new Map(allFetchedCategories.map(item => [item.id, item])).values());
            setCategories(uniqueCategories.sort((a, b) => a.name.localeCompare(b.name)));

            const incomeList = Array.isArray(incomeRes) ? incomeRes : (incomeRes?.items || []);
            const expenseList = Array.isArray(expenseRes) ? expenseRes : (expenseRes?.items || []);

            const allTransactions = [
                ...incomeList.map(t => ({
                    ...t, 
                    type: 'income',
                    category: t.category?.name || t.category_name || 'Uncategorized',
                    category_id: t.category?.id || t.category_id || 'uncat_inc', 
                    emoji: t.category?.icon || t.emoji || '💰',
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                })),
                ...expenseList.map(t => ({
                    ...t, 
                    type: 'expense',
                    category: t.category?.name || t.category_name || 'Uncategorized',
                    category_id: t.category?.id || t.category_id || 'uncat_exp', 
                    emoji: t.category?.icon || t.emoji || '💸',
                    date: t.date ? t.date.split('T')[0] : 'N/A',
                    amount: Number(t.amount || 0), 
                }))
            ];
            
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(allTransactions);
            setFilteredData(allTransactions);
            
        } catch (error) {
            console.error("Analytics Error:", error);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // --- LOGIC FILTER ---
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

    // --- TÍNH TOÁN THỐNG KÊ ---
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
        
        const barData = [
            { name: 'Income', value: totalIncome, color: '#10B981' }, 
            { name: 'Expense', value: totalExpense, color: '#EF4444' }, 
        ];

        const processPieData = (breakdownObj, total) => {
            const raw = Object.values(breakdownObj).sort((a, b) => b.value - a.value);
            return raw.map(item => ({
                ...item,
                percent: total > 0 ? item.value / total : 0
            }));
        };

        return { 
            totalIncome, 
            totalExpense, 
            netBalance, 
            barData, 
            expensePieData: processPieData(expenseBreakdown, totalExpense), 
            incomePieData: processPieData(incomeBreakdown, totalIncome) 
        };
    }, [filteredData]);
    
    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const resetFilters = () => setFilters({ type: "all", category: "all", startDate: "", endDate: "" });
    const handleExport = () => toast.success("Export function is coming soon!");

    // --- RENDER ---
    if (loading) {
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
        <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            {/* Header */}
            <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-3">
                        <BarChart3 className="text-blue-500" size={28} />
                        Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                        Financial data overview.
                    </p>
                </div>
            </header>

            <main>
                {/* 1. KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20 transform transition hover:scale-[1.02]">
                        <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={80} /></div>
                        <div className="relative z-10">
                            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">Total Income</h2>
                            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-2 break-all">
                                {formatAmountDisplay(totalIncome, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20 transform transition hover:scale-[1.02]">
                         <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown size={80} /></div>
                        <div className="relative z-10">
                            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">Total Expense</h2>
                            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold mt-2 break-all">
                                {formatAmountDisplay(totalExpense, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>

                    <div className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl shadow-xl transform transition hover:scale-[1.02] ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
                         <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={100} /></div>
                        <div className="relative z-10">
                             <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Net Balance</h2>
                            <p className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mt-2 break-all ${netBalance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {formatAmountDisplay(netBalance, currentCurrency, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. FILTER BAR */}
                <div className={`p-4 rounded-2xl mb-6 sm:mb-8 shadow-sm ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-max">
                            <Filter size={18} />
                            <span className="font-semibold text-sm">Filters:</span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                            <select 
                                name="type" value={filters.type} onChange={handleFilterChange}
                                className={`col-span-1 p-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                            >
                                <option value="all">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        
                            <select 
                                name="category" value={filters.category} onChange={handleFilterChange}
                                className={`col-span-1 p-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                            >
                                <option value="all">All Categories</option> 
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}> 
                                        {c.icon} - {c.name}
                                    </option>
                                ))}
                            </select>
                            
                            <input 
                                type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange}
                                className={`col-span-1 p-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                            />
                            
                            <input 
                                type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange}
                                className={`col-span-1 p-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                            />
                        </div>

                        <button 
                            onClick={resetFilters}
                            className={`w-full md:w-auto px-4 py-2.5 text-xs sm:text-sm rounded-xl font-medium transition-colors whitespace-nowrap ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* 3. CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                    {/* Bar Chart */}
                    <div className={`lg:col-span-2 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <h2 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500" /> Income vs Expense
                        </h2>
                        {/* ✅ FIX: Tăng chiều cao lên 320px để cột và trục không bị ép */}
                        <div className="w-full h-[320px] sm:min-h-[300px]">
                            {totalIncome > 0 || totalExpense > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                                        <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        {/* ✅ FIX: Tăng width trục Y lên 45 để số lớn không bị cắt */}
                                        <YAxis 
                                            stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                            width={45} 
                                            tickFormatter={(val) => formatAmountDisplay(val, currentCurrency, 0).replace(currentCurrency, "").trim()} 
                                        />
                                        <Tooltip content={<CustomTooltip currencyCode={currentCurrency} />} cursor={{fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4}} />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                                            {barData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <BarChart3 size={48} className="mb-2" />
                                    <p className="text-sm">No data to display.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pie Charts Container */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* Expense Pie */}
                        <div className={`p-4 sm:p-6 rounded-2xl shadow-lg flex-1 flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-500">
                                <PieIcon size={20} /> Expense Breakdown
                            </h2>
                            {/* ✅ FIX: Tăng chiều cao lên 300px để tròn đẹp hơn */}
                            <div className="w-full h-[300px] sm:min-h-[200px] relative">
                                {expensePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={expensePieData} dataKey="value" nameKey="name"
                                                cx="50%" cy="50%" innerRadius={50} outerRadius={70} 
                                                labelLine={false} label={renderCustomLabel} 
                                                paddingAngle={2}
                                            >
                                                {expensePieData.map((entry, index) => (
                                                    <Cell key={`cell-exp-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={isDark ? "#1F2937" : "#fff"} strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                            <Tooltip content={<CustomTooltip currencyCode={currentCurrency} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <PieIcon size={40} className="mb-2" />
                                        <p className="text-xs">No expense data.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Income Pie */}
                        <div className={`p-4 sm:p-6 rounded-2xl shadow-lg flex-1 flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
                             <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-500">
                                <PieIcon size={20} /> Income Breakdown
                            </h2>
                            {/* ✅ FIX: Tăng chiều cao lên 300px */}
                            <div className="w-full h-[300px] sm:min-h-[200px] relative">
                                {incomePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={incomePieData} dataKey="value" nameKey="name"
                                                cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                                                labelLine={false} label={renderCustomLabel}
                                                paddingAngle={2}
                                            >
                                                {incomePieData.map((entry, index) => (
                                                    <Cell key={`cell-inc-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={isDark ? "#1F2937" : "#fff"} strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                            <Tooltip content={<CustomTooltip currencyCode={currentCurrency} isPie={true} />} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <PieIcon size={40} className="mb-2" />
                                        <p className="text-xs">No income data.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. TRANSACTIONS TABLE CARD (Mobile Optimized) */}
                <div className={`p-4 sm:p-6 rounded-2xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={20} className="text-orange-500" /> 
                            History <span className="text-sm font-normal text-gray-500 ml-2">({filteredData.length})</span>
                        </h2>
                        <button 
                            onClick={handleExport}
                            className="w-full sm:w-auto px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors font-medium shadow-lg shadow-blue-500/20"
                        >
                            <Download size={16} className="mr-2"/> Export CSV
                        </button>
                    </div>

                    {/* ✅ Responsive Table Wrapper */}
                    <div className="overflow-x-auto custom-scrollbar rounded-lg border dark:border-gray-700">
                        <table className="min-w-full text-left border-collapse">
                            <thead>
                                <tr className={`${isDark ? "bg-gray-700/50" : "bg-gray-50"} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                    {/* Date Column */}
                                    <th className="py-3 px-2 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                                    {/* Category Column */}
                                    <th className="py-3 px-2 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Category</th>
                                    {/* Type Column (Hidden on Mobile) */}
                                    <th className="hidden sm:table-cell py-3 px-2 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap text-center">Type</th>
                                    {/* Amount Column */}
                                    <th className="py-3 px-2 sm:py-4 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((tx, idx) => (
                                        <tr key={`${tx.id}-${idx}`} className={`transition-colors ${isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}>
                                            {/* Date */}
                                            <td className="py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {tx.date}
                                            </td>
                                            
                                            {/* Category */}
                                            <td className="py-3 px-2 sm:py-4 sm:px-4 text-xs sm:text-sm">
                                                <div className="flex items-center gap-1 sm:gap-2 min-w-max">
                                                    <span className="text-base sm:text-lg">{tx.emoji}</span>
                                                    <span className="font-semibold">{tx.category}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Type (Hidden on Mobile) */}
                                            <td className="hidden sm:table-cell py-3 px-2 sm:py-4 sm:px-4 text-center">
                                                <span className={`inline-block py-1 px-3 rounded-full text-xs font-bold ${
                                                    tx.type === "income" 
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                    {tx.type.toUpperCase()}
                                                </span>
                                            </td>
                                            
                                            {/* Amount */}
                                            <td className={`py-3 px-2 sm:py-4 sm:px-4 text-right text-xs sm:text-base font-bold whitespace-nowrap ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                                                {tx.type === "expense" ? "-" : "+"} {formatAmountDisplay(tx.amount, currentCurrency, 0)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                                                <SearchX size={48} className="mb-2" />
                                                <p className="font-medium">No transactions found.</p>
                                                <p className="text-xs mt-1">Try adjusting your filters.</p>
                                            </div>
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