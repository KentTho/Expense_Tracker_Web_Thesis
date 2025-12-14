// Expense.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle, TrendingDown, DollarSign, Loader2, BarChart3, LineChart, Trash2, Edit,
    AlertTriangle, Activity, ArrowUpRight, SearchX, Calendar, FileText, X 
} from "lucide-react";
import {
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense, getExpenses, updateExpense, deleteExpense, getExpenseDailyTrend, getExpenseBreakdown, 
} from "../../services/expenseService"; 
import { getCategories } from "../../services/categoryService";
import { format } from "date-fns"; // ✅ Import format date

// Helper Định dạng tiền tệ an toàn
const formatAmountDisplay = (amount, currencyCode = 'USD') => {
    const numberAmount = Number(amount) || 0; 
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numberAmount);
    } catch (e) {
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    const isBreakdown = payload?.[0]?.dataKey === 'total_amount' && payload?.[0]?.payload?.category_name;

    if (active && payload && payload.length) {
        let value = payload[0].value;
        let name = payload[0].name;

        if (isBreakdown) {
            name = payload[0].payload.category_name;
        }

        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50">
                <p className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-200">{isBreakdown ? name : `Date: ${label}`}</p>
                <p className="text-base font-bold text-red-500">
                    {isBreakdown ? 'Total Spent' : 'Expense'}: 
                    {formatAmountDisplay(value, currencyCode)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Expense() {
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";

    const [expenseData, setExpenseData] = useState({ items: [] });
    const [categories, setCategories] = useState([]);
    
    // UI States
    const [showModal, setShowModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // ✅ State cho Modal Chi Tiết (Mobile Only)
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // State cho bộ lọc ngày
    const [filterDate, setFilterDate] = useState(""); 

    // Chart States
    const [dailyTrend, setDailyTrend] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [chartView, setChartView] = useState('trend');
    const [chartDays, setChartDays] = useState(7);

    // Form state
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💸",
        category_id: "",
        note: "",
        currency_code: currencyCode 
    });

    useEffect(() => {
        setForm(prev => ({ ...prev, currency_code: currencyCode }));
    }, [currencyCode]);

    // KPI Calculation
    const { totalExpense, avgExpense, maxExpense } = useMemo(() => {
        const items = expenseData.items || [];
        const total = items.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const avg = items.length > 0 ? total / items.length : 0;
        const max = items.length > 0 ? Math.max(...items.map(item => Number(item.amount))) : 0;

        return { 
            totalExpense: Math.round(total),
            avgExpense: Math.round(avg),
            maxExpense: Math.round(max)
        };
    }, [expenseData.items]);

    // Logic Lọc danh sách theo ngày
    const filteredExpenses = useMemo(() => {
        if (!filterDate) return expenseData.items || [];
        return (expenseData.items || []).filter(item => item.date === filterDate);
    }, [expenseData.items, filterDate]);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async () => {
        try {
            const [expData, categoryData, trendData, breakdown] = await Promise.all([
                getExpenses().catch(err => { console.warn("Expense fetch fail:", err); return { items: [] }; }),            
                getCategories('expense').catch(err => { console.warn("Cat fetch fail:", err); return []; }), 
                getExpenseDailyTrend(chartDays).catch(err => { console.warn("Trend fetch fail:", err); return []; }), 
                getExpenseBreakdown().catch(err => { console.warn("Breakdown fetch fail:", err); return []; })     
            ]);

            setExpenseData(expData && expData.items ? expData : { items: [] });
            setCategories(Array.isArray(categoryData) ? categoryData : []);
            setDailyTrend(Array.isArray(trendData) ? trendData : []);
            setBreakdownData(Array.isArray(breakdown) ? breakdown : []);

        } catch (error) {
            console.error("Critical Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchData();
        const handleUpdate = () => {
            console.log("♻️ Refreshing Expense data...");
            fetchData(); 
        };
        window.addEventListener("transactionUpdated", handleUpdate);
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

    // Form Logic
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            const re = /^\d*$/;
            if (value === '' || re.test(value)) {
                setForm(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        const selectedCategory = categories.find(c => c.id === categoryId);
        setForm(prev => ({ 
            ...prev, 
            category_id: categoryId,
            category_name: selectedCategory ? selectedCategory.name : "",
            emoji: selectedCategory ? selectedCategory.icon : "💸",
        }));
    };
    
    const resetForm = () => {
        setForm({
            category_name: "", amount: "", date: new Date().toISOString().split('T')[0],
            emoji: "💸", category_id: "", note: "",
            currency_code: currencyCode
        });
    };

    const handleEdit = (expense) => {
        setEditId(expense.id);
        setForm({
            category_id: String(expense.category?.id || ""),
            category_name: String(expense.category?.name || expense.category_name || ""),
            amount: String(Math.round(expense.amount ?? 0)),
            date: expense.date || new Date().toISOString().split('T')[0],
            emoji: expense.emoji || expense.category?.emoji || "💸",
            note: expense.note,
            currency_code: currencyCode
        });
        setShowModal(true); 
    };

    const handleFormSubmit = async () => {
        if (!form.amount || !form.category_name || !form.date) {
            toast.error("Please fill out Amount, Category, and Date.");
            return;
        }
        
        let finalForm = { ...form, currency_code: currencyCode };
        
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                finalForm.emoji = foundCategory.emoji || finalForm.emoji; 
            }
        }

        const toastId = toast.loading(editId ? "Updating expense..." : "Saving expense...");
        
        try {
            if (editId) {
                await updateExpense(editId, finalForm); 
                toast.success("Expense updated successfully!", { id: toastId });
            } else {
                await createExpense(finalForm); 
                toast.success("Expense saved successfully!", { id: toastId });
            }
            setShowModal(false);
            setEditId(null);
            resetForm();
            fetchData(); 
        } catch (error) {
            toast.error("Failed to save expense. Please try again.", { id: toastId });
        }
    };

    const initiateDelete = (id) => { setDeleteId(id); setShowDeleteModal(true); };
    const confirmDelete = async () => {
        if (!deleteId) return;
        const toastId = toast.loading("Deleting expense...");
        try {
            await deleteExpense(deleteId);
            toast.success("Expense deleted successfully!", { id: toastId });
            fetchData();
        } catch (error) {
            toast.error("Failed to delete expense.", { id: toastId });
        } finally {
            setShowDeleteModal(false); setDeleteId(null);
        }
    };
    const closeModal = () => { setShowModal(false); setEditId(null); resetForm(); };

    // ✅ Hàm xử lý mở chi tiết (Chỉ active trên Mobile < 768px)
    const handleItemClick = (expense) => {
        if (window.innerWidth < 768) {
            setSelectedExpense(expense);
            setShowDetailModal(true);
        }
    };

    // --- CHART UI ---
    const chartTitle = chartView === 'trend' ? `Daily Expense Trend (${chartDays} Days)` : 'Expense Breakdown';
    
    const TrendChart = (
        <RechartsLineChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis
                dataKey="date" height={50} tickMargin={10}
                tickFormatter={(tick) => tick.substring(5)}
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                width={40}
            />
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{stroke: '#EF4444', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Line type="monotone" dataKey="total_amount" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
        </RechartsLineChart>
    );

    const SummaryChart = (
        <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis dataKey="category_name" stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} height={50} axisLine={false} tickLine={false} />
            <YAxis 
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                width={40}
            />
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4}} />
            <Bar dataKey="total_amount" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={60} />
        </BarChart>
    );

    if (loading) {
        return (
            <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="text-center">
                    <Loader2 className="animate-spin text-red-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading your expenses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            {/* Header Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingDown className="text-red-500" size={32} />
                        Expenses
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your daily spending.</p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)} 
                    className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all transform hover:-translate-y-0.5"
                >
                    <PlusCircle size={20} className="mr-2" /> Add Expense
                </button>
            </div>

            {/* KPI Cards & List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* 1. Left Summary Card */}
                <div className={`lg:col-span-1 p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.01] ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <DollarSign size={16} className="mr-1 text-red-500" /> Total Expense
                        </h2>
                        <p className="text-4xl sm:text-5xl font-extrabold text-red-500 tracking-tight leading-tight break-all">
                            {formatAmountDisplay(totalExpense, currencyCode)}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mt-8">
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1 font-medium"><Activity size={12} /> Avg. / Txn</p>
                            <p className="font-bold text-lg">{formatAmountDisplay(avgExpense, currencyCode)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1 font-medium"><ArrowUpRight size={12} /> Max. Txn</p>
                            <p className="font-bold text-lg">{formatAmountDisplay(maxExpense, currencyCode)}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Recent Expenses List (Mobile Optimized + Filter Added) */}
                <div className={`lg:col-span-2 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                    
                    {/* Header List with Filter */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={20} className="text-gray-400"/> Recent Expenses
                        </h2>
                        
                        {/* ✅ DATE FILTER INPUT */}
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className={`px-2 py-1.5 text-xs sm:text-sm rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                            />
                             {filterDate && (
                                <button
                                    onClick={() => setFilterDate("")}
                                    className="p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                        {filteredExpenses.length > 0 ? (
                            <div className="space-y-2 sm:space-y-3">
                                {filteredExpenses.map(expense => (
                                    <div 
                                        key={expense.id} 
                                        // ✅ Bổ sung sự kiện click để mở chi tiết trên Mobile
                                        onClick={() => handleItemClick(expense)}
                                        className={`flex justify-between items-center p-3 sm:p-3.5 rounded-xl border-b last:border-0 border-gray-100 dark:border-gray-700 transition ${isDark ? "bg-gray-700/30 hover:bg-gray-700/60" : "bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200"} cursor-pointer md:cursor-default`}
                                    >
                                        {/* Left Side: Icon & Info */}
                                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-white border border-gray-100"}`}>
                                                {expense.category?.icon || expense.icon || "💸"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm sm:text-base truncate">{expense.category?.name || expense.category_name || "Uncategorized"}</p>
                                                <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <span className="font-medium bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px]">{expense.date}</span>
                                                    {expense.note && (
                                                        <span className="italic truncate max-w-[80px] sm:max-w-[150px] flex items-center gap-1">
                                                            <FileText size={10}/> {expense.note}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Amount & Buttons */}
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 ml-2">
                                            <p className="font-bold text-red-500 text-sm sm:text-lg whitespace-nowrap">
                                                - {formatAmountDisplay(expense.amount, currencyCode)}
                                            </p>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(expense); }} // ✅ Chặn lan truyền click
                                                    className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                >
                                                    <Edit size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); initiateDelete(expense.id); }} // ✅ Chặn lan truyền click
                                                    className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( 
                            <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400 opacity-70">
                                <SearchX size={48} className="mb-2" />
                                <p className="font-medium">No expenses recorded.</p>
                                <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-red-500 hover:underline">Create your first expense</button>
                            </div> 
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className={`w-full p-6 rounded-2xl shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 size={24} className="text-red-500"/>
                        {chartTitle}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {chartView === 'trend' && (
                            <select 
                                value={chartDays} 
                                onChange={(e) => setChartDays(Number(e.target.value))} 
                                className={`text-sm py-2 px-3 rounded-lg border outline-none focus:ring-2 focus:ring-red-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`} 
                                disabled={loading}
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                        )}
                        <button 
                            onClick={() => setChartView(chartView === 'trend' ? 'summary' : 'trend')} 
                            className={`flex items-center text-sm px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                        >
                            {chartView === 'trend' ? <BarChart3 size={16} className="mr-2" /> : <LineChart size={16} className="mr-2" />} 
                            Switch View
                        </button>
                    </div>
                </div>
                
                {/* Chart Mobile Height Fix */}
                <div className="h-[300px] sm:h-[400px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%"> 
                        {(chartView === 'trend' && dailyTrend.length === 0) || (chartView === 'summary' && breakdownData.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                <BarChart3 size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-lg font-medium">No analytics data available</p>
                                <p className="text-sm">Start adding expenses to see trends.</p>
                            </div>
                        ) : (
                            chartView === 'trend' ? TrendChart : SummaryChart
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <div 
                    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn"
                    onClick={closeModal}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}
                    >
                        <h2 className="text-2xl font-bold mb-6 text-center">{editId ? "Edit Expense" : "Add New Expense"}</h2>
                        
                        <div className="space-y-5">
                            {/* Category Select */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Category</label>
                                <select name="category_id" value={form.category_id} onChange={handleCategoryChange} className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                                    <option value="" disabled>Select Category</option>
                                    {categories.filter(c => c.type === 'expense').map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Amount & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Amount ({currencyCode})</label>
                                    <input type="number" name="amount" value={form.amount} onChange={handleFormChange} placeholder="0" className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Date</label>
                                    <input type="date" name="date" value={form.date} onChange={handleFormChange} className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`} />
                                </div>
                            </div>
                            
                            {/* Note */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Note (Optional)</label>
                                <textarea name="note" value={form.note} onChange={handleFormChange} rows={3} placeholder="What was this for?" className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-red-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`} />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button onClick={closeModal} className={`flex-1 py-3.5 rounded-xl font-bold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                                    Cancel
                                </button>
                                <button onClick={handleFormSubmit} disabled={loading} className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 transition-transform active:scale-95">
                                    {editId ? "Save Changes" : "Add Expense"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="mx-auto w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
                            <Trash2 className="text-red-600 dark:text-red-500" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Delete Expense?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}>Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ DETAIL MODAL (MOBILE ONLY) */}
            {showDetailModal && selectedExpense && (
                <div 
                    className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 relative animate-slideUp sm:animate-none ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
                    >
                        {/* Thanh gạch ngang (Handle) để kéo */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden"></div>
                        
                        <div className="text-center mt-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                                {selectedExpense.emoji || "💸"}
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Expense Details</h3>
                            <h2 className="text-3xl font-extrabold text-red-500">
                                - {formatAmountDisplay(selectedExpense.amount, currencyCode)}
                            </h2>
                        </div>

                        <div className={`mt-6 space-y-4 p-4 rounded-xl ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 text-sm font-medium">Category</span>
                                <span className="font-bold">{selectedExpense.category_name || selectedExpense.category?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 text-sm font-medium">Date</span>
                                <span className="font-bold">{format(new Date(selectedExpense.date), "dd MMMM yyyy")}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm font-medium block mb-1">Note</span>
                                <p className={`text-sm leading-relaxed ${!selectedExpense.note && "italic opacity-50"}`}>
                                    {selectedExpense.note || "No details provided."}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowDetailModal(false)}
                            className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-transform active:scale-95 ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}