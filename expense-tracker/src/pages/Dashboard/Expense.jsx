// Expense.jsx (ĐÃ KHẮC PHỤC LỖI CONTROLLED INPUT VÀ ĐỒNG BỘ CATEGORY)

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

// Helper Định dạng tiền tệ (Giữ nguyên - decimals = 0)
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
        console.warn(`Invalid currency code: ${currencyCode}. Defaulting to USD.`);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    }
};

// Custom Tooltip (decimals = 0)
const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    const isExpense = payload?.[0]?.dataKey === 'total_amount';
    const isBreakdown = payload?.[0]?.dataKey === 'total_amount' && payload?.[0]?.payload?.category_name;

    if (active && payload && payload.length) {
        let value = payload[0].value;
        let name = payload[0].name;

        if (isBreakdown) {
            name = payload[0].payload.category_name;
        }

        return (
            <div className="p-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                <p className="text-sm font-semibold">{isBreakdown ? name : `Date: ${label}`}</p>
                <p className="text-sm text-red-500">
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
    const [showModal, setShowModal] = useState(false);
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
    });

    // useEffects 
    useEffect(() => {
        setForm(prev => ({ ...prev, currency_code: expenseData.currency_code }));
    }, [expenseData.currency_code]);

    const totalExpense = useMemo(() => {
        const total = expenseData.items.reduce((sum, exp) => sum + Number(exp.amount), 0);
        return Math.round(total);
    }, [expenseData.items]);

    // ----------------------------------------------------
    // ⚙️ Data Fetching (Giữ nguyên)
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const expData = await getExpenses();
            setExpenseData(expData); 

            const categoryData = await getCategories('expense');
            setCategories(categoryData);

            const trendData = await getExpenseDailyTrend(chartDays);
            setDailyTrend(trendData);

            const breakdown = await getExpenseBreakdown();
            setBreakdownData(breakdown);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(error.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ----------------------------------------------------
    // 📝 Form and Modal Logic
    // ----------------------------------------------------

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'amount') {
            // FIX: Restrict amount input to non-negative integers only (since decimals = 0 is used)
            const re = /^\d*$/;
            if (value === '' || re.test(value)) {
                setForm(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    // handleCategoryChange (Đã đồng bộ với Income.jsx)
    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        const selectedCategory = categories.find(c => c.id === categoryId);

        setForm(prev => ({ 
            ...prev, 
            category_id: categoryId,
            // ✅ CẬP NHẬT: Lưu tên category và emoji để chuẩn bị cho payload
            category_name: selectedCategory ? selectedCategory.name : "",
            emoji: selectedCategory ? selectedCategory.icon : "💸",
        }));
    };
    
    // Hàm reset form
    const resetForm = () => {
        setForm({
            category_name: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            emoji: "💸",
            category_id: "",
            currency_code: expenseData.currency_code,
        });
    };

    // ✅ SỬA LỖI LẦN CUỐI: Dùng Nullish Coalescing (??) để đảm bảo mọi giá trị đều là String
    const handleEdit = (expense) => {
        setEditId(expense.id);
        
        // ✅ KHẮC PHỤC LỖI: Đảm bảo tất cả các giá trị là String hoặc có giá trị mặc định
        setForm({
            // 1. category_id: Lấy ID từ object category. Nếu không có (trường hợp hiếm), dùng ""
            category_id: String(expense.category?.id || ""),
            
            // 2. category_name: Lấy tên Category
            category_name: String(expense.category?.name || expense.category_name || ""),
            
            // 3. amount: Đảm bảo là String. Sử dụng Math.round() để khớp với logic decimals=0 của UI.
            amount: String(Math.round(expense.amount ?? 0)),
            
            // 4. date
            date: expense.date || new Date().toISOString().split('T')[0],
            
            // 5. emoji
            emoji: expense.emoji || expense.category?.emoji || "💸",
            
            // 6. currency_code
            currency_code: expenseData.currency_code, // Lấy từ state chính
        });
        
        setShowModal(true); // Mở Modal chỉnh sửa
    };

    // handleFormSubmit (Đã thêm logic category lookup)
    const handleFormSubmit = async () => {
        if (!form.amount || !form.category_name || !form.date) {
            toast.error("Please fill out all required fields.");
            return;
        }

        // >> START: Đồng bộ logic category từ Income.jsx
        let finalForm = { ...form };
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                // Dùng 'emoji' vì Expense.jsx dùng 'emoji'
                finalForm.emoji = foundCategory.emoji || finalForm.emoji; 
            }
        }
        // << END: Đồng bộ logic category


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
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to save expense.");
        } finally {
            setLoading(false);
        }
    };

    // handleDelete (Giữ nguyên)
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        setLoading(true);
        try {
            await deleteExpense(id);
            toast.success("Expense deleted successfully!");
            fetchData();
        } catch (error) {
            console.error("Deletion error:", error);
            toast.error(error.message || "Failed to delete expense.");
        } finally {
            setLoading(false);
        }
    };

    // closeModal (Giữ nguyên)
    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        resetForm();
    };

    // ----------------------------------------------------
    // 🎨 UI Rendering (Giữ nguyên)
    // ----------------------------------------------------

    const chartTitle = chartView === 'trend'
        ? `Daily Expense Trend (${chartDays} Days)`
        : 'Expense Breakdown by Category';
    
    const currentCurrencyCode = expenseData.currency_code;

    // TrendChart (Giữ nguyên)
    const TrendChart = (
        <RechartsLineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ccc"} />
            <XAxis
                dataKey="date" 
                angle={-45}
                textAnchor="end"
                height={50}
                tickFormatter={(tick) => tick.substring(5)}
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <YAxis
                // Sử dụng formatAmountDisplay với decimals = 0
                tickFormatter={(value) => formatAmountDisplay(value, currentCurrencyCode, 0)} 
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip currencyCode={currentCurrencyCode} />} />
            <Line
                type="monotone"
                dataKey="total_amount" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                fill="#ef444455"
            />
        </RechartsLineChart>
    );

    // SummaryChart (Giữ nguyên)
    const SummaryChart = (
        <BarChart data={breakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ccc"} />
            <XAxis
                dataKey="category_name"
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <YAxis
                // Sử dụng formatAmountDisplay với decimals = 0
                tickFormatter={(value) => formatAmountDisplay(value, currentCurrencyCode, 0)}
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip currencyCode={currentCurrencyCode} />} />
            <Bar dataKey="total_amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
    );

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            <h1 className="text-3xl font-bold mb-6 flex items-center">
                <TrendingDown className="mr-2 text-red-500" size={28} />
                Expense Transactions
            </h1>

            {/* Top Row (Giữ nguyên) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Giữ nguyên) */}
                <div className="lg:col-span-1 flex flex-col space-y-6">

                    {/* Total Expense Card (Giữ nguyên) */}
                    <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                                <DollarSign size={20} className="mr-1 text-red-500" />
                                Total Expense (All Time)
                            </h2>
                            <PlusCircle
                                className="text-red-500 cursor-pointer hover:opacity-80 transition-opacity"
                                size={24}
                                onClick={() => setShowModal(true)}
                            />
                        </div>
                        <p className="text-5xl font-extrabold text-red-500 mt-4">
                            {/* decimals = 0 */}
                            {formatAmountDisplay(totalExpense, currentCurrencyCode, 0)}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Calculated from {expenseData.items.length} transactions
                        </p>
                    </div>

                    {/* Recent Transactions List (Giữ nguyên) */}
                    <h2 className="text-2xl font-semibold mb-4 mt-8">Recent Expenses</h2>
                    {loading && expenseData.items.length === 0 ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="animate-spin text-red-500" size={24} />
                        </div>
                    ) : expenseData.items.length > 0 ? (
                        <div className={`space-y-3 p-4 rounded-xl shadow-md ${isDark ? "bg-gray-800" : "bg-white"}`}>
                            {expenseData.items.slice(0, 5).map(expense => (
                                <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                                    <div className="flex items-center gap-3">
                                        {/* ✅ SỬA LỖI ĐỒNG BỘ: Ưu tiên lấy từ expense.category */}
                                        <span className="text-2xl">{expense.category?.icon || expense.icon || "💸"}</span>
                                        <div>
                                            {/* ✅ SỬA LỖI ĐỒNG BỘ: Ưu tiên lấy từ expense.category.name */}
                                            <p className="font-medium">{expense.category?.name || expense.category_name || "Uncategorized"}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{expense.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-red-500">
                                            {/* decimals = 0 */}
                                            - {formatAmountDisplay(expense.amount, expense.currency_code || currentCurrencyCode, 0)}
                                        </p>
                                        <button
                                            onClick={() => handleEdit(expense)}
                                            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-gray-500 dark:text-gray-400">No expenses recorded yet. Click the + icon to add one!</p>
                    )}
                </div>

                {/* Right Column (Giữ nguyên) */}
                <div className="lg:col-span-2">
                    <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{chartTitle}</h2>
                            <div className="flex items-center space-x-2">
                                {chartView === 'trend' && (
                                    <select
                                        value={chartDays}
                                        onChange={(e) => setChartDays(Number(e.target.value))}
                                        className={`text-sm py-1 px-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                        disabled={loading}
                                    >
                                        <option value={7}>Last 7 Days</option>
                                        <option value={30}>Last 30 Days</option>
                                        <option value={90}>Last 90 Days</option>
                                    </select>
                                )}
                                <button
                                    onClick={() => setChartView(chartView === 'trend' ? 'summary' : 'trend')}
                                    className={`flex items-center text-sm px-3 py-1 rounded-full font-medium transition-all ${
                                        chartView === 'trend'
                                            ? "bg-red-600 hover:bg-red-500 text-white"
                                            : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                    disabled={loading}
                                >
                                    {chartView === 'trend' ? <BarChart3 size={16} className="mr-1" /> : <LineChart size={16} className="mr-1" />}
                                    View {chartView === 'trend' ? 'Category Summary' : 'Daily Trend'}
                                </button>
                            </div>
                        </div>

                        {/* Chart Area (Giữ nguyên) */}
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        ) : (
                            <div className="h-96 w-full"> 
                                <ResponsiveContainer key={chartView + chartDays} width="100%" height="100%"> 
                                    {chartView === 'trend' ? TrendChart : SummaryChart}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ======================================================= */}
            {/* ➕ Add/Edit Expense Modal */}
            {/* ======================================================= */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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

                            {/* Amount and Date (Giữ nguyên) */}
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
                                        placeholder="e.g. 50.00"
                                        min="0.01"
                                        step="0.01"
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

                            {/* Emoji Display (Giữ nguyên) */}
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

                            {/* Save / Update Button (GiGữ nguyên) */}
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