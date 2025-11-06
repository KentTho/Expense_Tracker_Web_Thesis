import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    TrendingDown,
    DollarSign,
    Loader2,
    BarChart3, // For category summary/breakdown
    LineChart, // For daily trend
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
    LineChart as RechartsLineChart, // Rename LineChart from recharts to avoid conflict
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

// Helper: Định dạng tiền tệ
const formatAmountDisplay = (amount, decimals = 0) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return `$0`;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numberAmount);
};

// Custom Tooltip for Recharts (Bar/Line Chart)
const CustomTooltip = ({ active, payload, label }) => {
    const isExpense = payload?.[0]?.dataKey === 'amount' || payload?.[0]?.dataKey === 'expense';
    const isBreakdown = payload?.[0]?.dataKey === 'total_amount';

    if (active && payload && payload.length) {
        let value = payload[0].value;
        let name = payload[0].name;

        if (isBreakdown) {
            name = payload[0].payload.category_name;
            value = payload[0].value;
        }

        // Vẫn giữ số thập phân trong Tooltip để đảm bảo dữ liệu chi tiết
        return (
            <div className="p-2 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                <p className="text-sm font-semibold">{isBreakdown ? name : `Date: ${label}`}</p>
                <p className="text-sm" style={{ color: isExpense ? '#ef4444' : '#22c55e' }}>
                    {isBreakdown ? 'Total Spent' : (isExpense ? 'Expense' : 'Amount')}: {formatAmountDisplay(value, 2)}
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

    // Data and State Management
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);

    // 📊 Chart States
    const [dailyTrend, setDailyTrend] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [chartView, setChartView] = useState('trend');
    const [chartDays, setChartDays] = useState(7); // Đặt mặc định là 7 ngày

    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💸", // Default expense emoji
        category_id: "",
    });

    // Helper: Calculate total expense from current list - LÀM TRÒN SỐ NGUY
    const totalExpense = useMemo(() => {
        // FIX: Explicitly convert exp.amount to a Number to prevent NaN/string concatenation/NaN
        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        return Math.round(total); // Làm tròn số nguyên
    }, [expenses]);

    // ----------------------------------------------------
    // ⚙️ Data Fetching
    // ----------------------------------------------------

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const expenseData = await getExpenses();
            setExpenses(expenseData);

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
    // 📝 Form and Modal Logic (Giữ nguyên)
    // ----------------------------------------------------

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        if (name === 'category_name') {
            const selectedCat = categories.find(c => c.name === value);
            if (selectedCat) {
                setForm(prev => ({
                    ...prev,
                    emoji: selectedCat.emoji,
                    category_id: selectedCat.id,
                }));
            } else {
                setForm(prev => ({ ...prev, emoji: "❓", category_id: "" }));
            }
        }
    };

    const handleFormSubmit = async () => {
        if (!form.amount || !form.category_name || !form.date) {
            toast.error("Please fill out all required fields.");
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await updateExpense(editId, form);
                toast.success("Expense updated successfully!");
            } else {
                await createExpense(form);
                toast.success("Expense saved successfully!");
            }
            setShowModal(false);
            setEditId(null);
            setForm({ category_name: "", amount: "", date: new Date().toISOString().split('T')[0], emoji: "💸", category_id: "" });
            fetchData();
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to save expense.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (expense) => {
        setEditId(expense.id);
        setForm({
            category_name: expense.category_name,
            amount: expense.amount.toString(),
            date: expense.date,
            emoji: expense.emoji,
            category_id: expense.category_id,
        });
        setShowModal(true);
    };

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

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm({ category_name: "", amount: "", date: new Date().toISOString().split('T')[0], emoji: "💸", category_id: "" });
    };

    // ----------------------------------------------------
    // 🎨 UI Rendering
    // ----------------------------------------------------

    const chartTitle = chartView === 'trend'
        ? `Daily Expense Trend (${chartDays} Days)`
        : 'Expense Breakdown by Category';

    // Line Chart for Daily Trend
    const TrendChart = (
        <RechartsLineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ccc"} />
            <XAxis
                dataKey="day"
                angle={-45}
                textAnchor="end"
                height={50}
                tickFormatter={(tick) => tick.substring(5)} // Show MM-DD
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value)} // Sử dụng formatAmountDisplay
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                fill="#ef444455"
            />
        </RechartsLineChart>
    );

    // Bar Chart for Category Breakdown
    const SummaryChart = (
        <BarChart data={breakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#444" : "#ccc"} />
            <XAxis
                dataKey="category_name"
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value)} // Sử dụng formatAmountDisplay
                stroke={isDark ? "#fff" : "#000"}
                tick={{ fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
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

            {/* Top Row: Chart and Total Summary/Recent Transactions - BỐ CỤC 1/3 (LEFT) + 2/3 (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Total Expense Summary & Recent Transactions (1/3) */}
                <div className="lg:col-span-1 flex flex-col space-y-6">

                    {/* Total Expense Card (Nổi bật, không thập phân) */}
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
                            {formatAmountDisplay(totalExpense, 0)} {/* Đã làm tròn số nguyên */}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Calculated from {expenses.length} transactions
                        </p>
                    </div>

                    {/* Recent Transactions List */}
                    <h2 className="text-2xl font-semibold mb-4 mt-8">Recent Expenses</h2>

                    {loading && expenses.length === 0 ? (
                        <div className="flex justify-center items-center h-20">
                            <Loader2 className="animate-spin text-red-500" size={24} />
                        </div>
                    ) : expenses.length > 0 ? (
                        <div className={`space-y-3 p-4 rounded-xl shadow-md ${isDark ? "bg-gray-800" : "bg-white"}`}>
                            {expenses.slice(0, 5).map(expense => ( // Chỉ hiện 5 giao dịch gần nhất
                                <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{expense.emoji}</span>
                                        <div>
                                            <p className="font-medium">{expense.category_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{expense.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-red-500">
                                            - {formatAmountDisplay(expense.amount, 0)}
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

                {/* Right Column: Chart Section (2/3) */}
                <div className="lg:col-span-2">
                    <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{chartTitle}</h2>
                            <div className="flex items-center space-x-2">
                                {/* Days Selector for Trend View */}
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
                                {/* View More/Toggle Button */}
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

                        {/* Chart Area */}
                        {loading ? (
                            <div className="flex justify-center items-center h-96">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        ) : (
                            <div className="h-96 w-full"> {/* Giữ chiều cao cố định */}
                                {/* FIX: Thêm key để buộc ResponsiveContainer tính toán lại kích thước, khắc phục lỗi width/height -1 */}
                                <ResponsiveContainer key={chartView + chartDays} width="100%" height="100%"> 
                                    {chartView === 'trend' ? TrendChart : SummaryChart}
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ======================================================= */}
            {/* ➕ Add/Edit Expense Modal (Form chữ to rõ) */}
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
                            {/* Category Select - Đã tăng kích thước */}
                            <div>
                                <label htmlFor="category_name" className="block text-sm font-medium mb-1">
                                    Category
                                </label>
                                <select
                                    id="category_name"
                                    name="category_name"
                                    value={form.category_name}
                                    onChange={handleFormChange}
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${ // 💡 Cải thiện kích thước form (to rõ)
                                        isDark
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-gray-100 border-gray-300"
                                    }`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.emoji} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount and Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium mb-1">
                                        Amount ($)
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
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${ // 💡 Cải thiện kích thước form (to rõ)
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
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${ // 💡 Cải thiện kích thước form (to rõ)
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
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
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-center text-2xl ${ // 💡 Cải thiện kích thước form (to rõ)
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