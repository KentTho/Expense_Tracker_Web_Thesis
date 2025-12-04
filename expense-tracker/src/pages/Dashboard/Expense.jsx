// Expense.jsx
// - ĐÃ CẬP NHẬT: Chart Font Size to hơn (14px).
// - ĐÃ CẬP NHẬT: Redesign thẻ Total Expense (Thêm chỉ số phụ & Background decor).
// - ĐÃ CÓ: Custom Delete Modal.

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    TrendingDown,
    DollarSign,
    Loader2,
    BarChart3,
    LineChart,
    Trash2,
    Edit,
    AlertTriangle,
    Activity, // Thêm icon cho chỉ số phụ
    ArrowUpRight, // Thêm icon cho chỉ số phụ
    FileText
} from "lucide-react";
import {
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart as RechartsLineChart,
    Line,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense,
    getExpenses, 
    updateExpense,
    deleteExpense,
    getExpenseDailyTrend, 
    getExpenseBreakdown, 
} from "../../services/expenseService"; 
import { getCategories } from "../../services/categoryService";

// Helper Định dạng tiền tệ
const formatAmountDisplay = (amount, currencyCode = 'USD', decimals = 0) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(0);
    }
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
const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    const isBreakdown = payload?.[0]?.dataKey === 'total_amount' && payload?.[0]?.payload?.category_name;

    if (active && payload && payload.length) {
        let value = payload[0].value;
        let name = payload[0].name;

        if (isBreakdown) {
            name = payload[0].payload.category_name;
        }

        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm">
                <p className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-200">{isBreakdown ? name : `Date: ${label}`}</p>
                <p className="text-base font-bold text-red-500">
                    {isBreakdown ? 'Total Spent' : 'Expense'}: 
                    {formatAmountDisplay(value, currencyCode, 0)}
                </p>
            </div>
        );
    }
    return null;
};

// =================================================================
// Main Expense Component
// =================================================================
export default function Expense() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    // States 
    const [expenseData, setExpenseData] = useState({
        items: [],
        currency_code: 'USD',
        currency_symbol: '$'
    });
    const [categories, setCategories] = useState([]);
    
    // Modal States
    const [showModal, setShowModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
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
        currency_code: expenseData.currency_code,
        note: "",
    });

    // useEffects 
    useEffect(() => {
        setForm(prev => ({ ...prev, currency_code: expenseData.currency_code }));
    }, [expenseData.currency_code]);

    // 📊 TÍNH TOÁN CÁC CHỈ SỐ PHỤ CHO THẺ TOTAL EXPENSE
    const { totalExpense, avgExpense, maxExpense } = useMemo(() => {
        const items = expenseData.items || [];
        const total = items.reduce((sum, exp) => sum + Number(exp.amount), 0);
        
        // Tính trung bình
        const avg = items.length > 0 ? total / items.length : 0;
        
        // Tìm giao dịch lớn nhất
        const max = items.length > 0 ? Math.max(...items.map(item => Number(item.amount))) : 0;

        return { 
            totalExpense: Math.round(total),
            avgExpense: Math.round(avg),
            maxExpense: Math.round(max)
        };
    }, [expenseData.items]);

    // ----------------------------------------------------
    // ⚙️ Data Fetching
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [expData, categoryData, trendData, breakdown] = await Promise.all([
                getExpenses(),
                getCategories('expense'),
                getExpenseDailyTrend(chartDays),
                getExpenseBreakdown()
            ]);

            setExpenseData(expData); 
            setCategories(categoryData);
            setDailyTrend(trendData);
            setBreakdownData(breakdown);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(error.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchData(); // Gọi lần đầu khi mount

        // ✅ LẮNG NGHE SỰ KIỆN TỪ CHATBOT
        const handleUpdate = () => {
            console.log("♻️ Data updated by Chatbot. Refreshing...");
            fetchData(); // Gọi lại API để lấy data mới
        };

        window.addEventListener("transactionUpdated", handleUpdate);

        // Dọn dẹp khi component bị hủy
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

    // ----------------------------------------------------
    // 📝 Form and Modal Logic
    // ----------------------------------------------------

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
            category_name: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            emoji: "💸",
            category_id: "",
            currency_code: expenseData.currency_code,
            note: ""
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
            currency_code: expenseData.currency_code, 
            note: expense.note,
        });
        setShowModal(true); 
    };

    const handleFormSubmit = async () => {
        if (!form.amount || !form.category_name || !form.date) {
            toast.error("Please fill out all required fields.");
            return;
        }

        let finalForm = { ...form };
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                finalForm.emoji = foundCategory.emoji || finalForm.emoji; 
            }
        }

        setLoading(true);
        try {
            if (editId) {
                await updateExpense(editId, finalForm); 
                toast.success("Expense updated successfully!");
            } else {
                await createExpense(finalForm); 
                toast.success("Expense saved successfully!");
            }
            setShowModal(false);
            setEditId(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.message || "Failed to save expense.");
        } finally {
            setLoading(false);
        }
    };

    const initiateDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        
        setLoading(true);
        try {
            await deleteExpense(deleteId);
            toast.success("Expense deleted successfully!");
            fetchData();
        } catch (error) {
            console.error("Deletion error:", error);
            toast.error(error.message || "Failed to delete expense.");
        } finally {
            setLoading(false);
            setShowDeleteModal(false); 
            setDeleteId(null);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        resetForm();
    };

    // ----------------------------------------------------
    // 🎨 UI Rendering
    // ----------------------------------------------------

    const chartTitle = chartView === 'trend'
        ? `Daily Expense Trend (${chartDays} Days)`
        : 'Expense Breakdown by Category';
    
    const currentCurrencyCode = expenseData.currency_code;

    // ✅ CẬP NHẬT CHART: Font to hơn (14px), width rộng hơn
    const TrendChart = (
        <RechartsLineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={70} 
                tickFormatter={(tick) => tick.substring(5)}
                stroke={isDark ? "#9CA3AF" : "#6B7280"}
                tick={{ fontSize: 14, fontWeight: 600 }} // Tăng kích thước chữ
                tickMargin={10}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value, currentCurrencyCode, 0)} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"}
                tick={{ fontSize: 14, fontWeight: 600 }} // Tăng kích thước chữ
                width={100} // Tăng chiều rộng để số không bị cắt
            />
            <Tooltip content={<CustomTooltip currencyCode={currentCurrencyCode} />} />
            <Line
                type="monotone"
                dataKey="total_amount" 
                stroke="#EF4444"
                strokeWidth={4} // Line dày hơn cho rõ
                dot={{ r: 5, strokeWidth: 2, fill: isDark ? "#1F2937" : "#fff" }}
                activeDot={{ r: 8 }}
                fill="#ef444455"
            />
        </RechartsLineChart>
    );

    const SummaryChart = (
        <BarChart data={breakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis
                dataKey="category_name"
                stroke={isDark ? "#9CA3AF" : "#6B7280"}
                tick={{ fontSize: 14, fontWeight: 600 }} // Tăng kích thước chữ
                height={50}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value, currentCurrencyCode, 0)}
                stroke={isDark ? "#9CA3AF" : "#6B7280"}
                tick={{ fontSize: 14, fontWeight: 600 }} // Tăng kích thước chữ
                width={100}
            />
            <Tooltip content={<CustomTooltip currencyCode={currentCurrencyCode} />} />
            <Bar dataKey="total_amount" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={60} />
        </BarChart>
    );

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <TrendingDown className="mr-2 text-red-500" size={32} />
                    Expense Transactions
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-105 active:scale-95"
                >
                    <PlusCircle size={20} className="mr-2" /> Add Expense
                </button>
            </div>

            {/* ROW 1: KPI & LIST */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* 1. Total Expense (ĐÃ REDESIGN) */}
                <div className={`lg:col-span-1 relative overflow-hidden p-6 rounded-2xl shadow-xl flex flex-col justify-between ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                    {/* Decorative Background Icon */}
                    <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-[0.03] pointer-events-none">
                        <DollarSign size={180} className={isDark ? "text-white" : "text-black"} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <DollarSign size={20} className="mr-1 text-red-500" />
                            Total Expense (All Time)
                        </h2>
                        <p className="text-5xl font-extrabold text-red-500 tracking-tight leading-tight">
                            {formatAmountDisplay(totalExpense, currentCurrencyCode, 0)}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 mb-6">
                            Based on {expenseData.items.length} recorded transactions
                        </p>
                    </div>

                    {/* ✅ Mini Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mt-auto relative z-10">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Activity size={12} /> Avg. / Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(avgExpense, currentCurrencyCode, 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <ArrowUpRight size={12} /> Highest Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(maxExpense, currentCurrencyCode, 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Recent Expenses List */}
                <div className={`lg:col-span-2 p-6 rounded-2xl shadow-xl flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                    <h2 className="text-xl font-semibold mb-4 flex-shrink-0">Recent Expenses</h2>
                    <div className="flex-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {loading && expenseData.items.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-red-500" size={24} />
                            </div>
                        ) : expenseData.items.length > 0 ? (
                            <div className="space-y-3">
                                {expenseData.items.map(expense => (
                                    <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors border-b last:border-0 border-gray-100 dark:border-gray-700 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                                                {expense.category?.icon || expense.icon || "💸"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">{expense.category?.name || expense.category_name || "Uncategorized"}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    {expense.date} 
                                                    {expense.note && (
                                                        <span className="flex items-center text-gray-400 ml-2 italic">
                                                        <FileText size={10} className="mr-1"/> {expense.note}
                                                    </span>
                                                    )}
                                                </p>

                                            </div>

                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-red-500 text-lg">
                                                - {formatAmountDisplay(expense.amount, expense.currentCurrencyCode || currentCurrencyCode, 0)}
                                            </p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => initiateDelete(expense.id)}
                                                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No expenses recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 2: CHART */}
            <div className={`w-full p-6 rounded-2xl shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BarChart3 size={24} className="text-red-500"/>
                        {chartTitle}
                    </h2>
                    <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                        {chartView === 'trend' && (
                            <select
                                value={chartDays}
                                onChange={(e) => setChartDays(Number(e.target.value))}
                                className={`text-sm py-2 px-3 rounded-lg border font-medium cursor-pointer ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                disabled={loading}
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                        )}
                        <button
                            onClick={() => setChartView(chartView === 'trend' ? 'summary' : 'trend')}
                            className={`flex items-center text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                                chartView === 'trend'
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-md"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            }`}
                            disabled={loading}
                        >
                            {chartView === 'trend' ? <BarChart3 size={16} className="mr-2" /> : <LineChart size={16} className="mr-2" />}
                            Switch to {chartView === 'trend' ? 'Category Summary' : 'Daily Trend'}
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                {loading ? (
                    <div className="flex justify-center items-center h-[500px]">
                        <Loader2 className="animate-spin text-red-500" size={48} />
                    </div>
                ) : (
                    <div className="h-[500px] w-full"> 
                        <ResponsiveContainer key={chartView + chartDays} width="100%" height="100%"> 
                            {chartView === 'trend' ? TrendChart : SummaryChart}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ======================================================= */}
            {/* CUSTOM DELETE CONFIRMATION MODAL */}
            {/* ======================================================= */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all scale-100 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Delete Expense?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                Are you sure you want to delete this transaction? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                                        isDark 
                                            ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/30 transition-colors"
                                >
                                    {loading ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================= */}
            {/* ➕ Add/Edit Expense Modal (Giữ nguyên) */}
            {/* ======================================================= */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div
                        className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transition-all transform relative ${isDark ? "bg-gray-800" : "bg-white"}`}
                    >
                        <h2 className="text-2xl font-bold mb-4">
                            {editId ? "Edit Expense" : "Add New Expense"}
                        </h2>
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                            aria-label="Close modal"
                        >
                            &times;
                        </button>

                        <div className="space-y-4">
                            {/* Category Select */}
                            <div>
                                <label htmlFor="category_id" className="block text-sm font-medium mb-1">
                                    Category
                                </label>
                                <select
                                    id="category_id"
                                    name="category_id" 
                                    value={form.category_id} 
                                    onChange={handleCategoryChange} 
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${
                                        isDark
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-gray-100 border-gray-300"
                                    }`}
                                >
                                    <option value="" disabled>Select Category</option>
                                        {categories.filter(c => c.type === 'expense').map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.icon} {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Amount and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium mb-1">
                                        Amount ({expenseData.currency_symbol})
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount" 
                                        value={form.amount}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 50"
                                        min="1"
                                        step="1"
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date" 
                                        value={form.date}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* ✅ Ô NHẬP NOTE MỚI */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <textarea
                                        name="note"
                                        value={form.note}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Lunch with friends..."
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none text-base resize-none h-20 ${
                                            isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Emoji Display */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Selected Emoji</label>
                                <input
                                    type="text"
                                    value={form.emoji}
                                    readOnly
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-center text-2xl ${
                                        isDark
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-gray-100 border-gray-300"
                                    }`}
                                />
                            </div>

                            {/* Save / Update Button */}
                            <button
                                onClick={handleFormSubmit}
                                disabled={loading}
                                className="w-full mt-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-red-500/50"
                            >
                                {loading && <Loader2 className="animate-spin" size={18} />}
                                <TrendingDown size={18} />
                                {editId ? "Update Expense" : "Save Expense"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}