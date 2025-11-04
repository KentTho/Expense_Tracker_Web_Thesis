import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    TrendingDown,
    DollarSign,
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid, // Thêm CartesianGrid cho lưới
    LineChart, // Thêm LineChart cho xu hướng theo ngày
    Line,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
} from "../../services/expenseService"; 
import { getCategories } from "../../services/categoryService"; 

export default function Expense() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💸",
        category_id: "",
    });

    // -----------------------------------------------------------------
    // 🧩 1. Data Fetching
    // -----------------------------------------------------------------
    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const categoriesData = await getCategories("expense");
            setCategories(categoriesData);

            const expensesData = await getExpenses();

            const processedExpenses = expensesData
                .map(exp => ({
                    ...exp,
                    amount: Number(exp.amount),
                    category_name: exp.category?.name || exp.category_name || 'N/A',
                    emoji: exp.category?.icon || exp.emoji || '💸'
                }))
                // Sắp xếp theo ngày mới nhất (để hiển thị trong bảng)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            setExpenses(processedExpenses);

        } catch (error) {
            console.error("Error fetching expenses/categories:", error);
            toast.error("Failed to load expense data.");
            setExpenses([]); 
            setCategories([]);

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    // -----------------------------------------------------------------
    // 🧩 2. Logic Form & CRUD (Giữ nguyên)
    // -----------------------------------------------------------------
    useEffect(() => {
        const selectedCat = categories.find(c => c.id === form.category_id);
        if (selectedCat) {
            setForm(prev => ({
                ...prev,
                category_name: selectedCat.name,
                emoji: selectedCat.icon || "💸"
            }));
        }
    }, [form.category_id, categories]);


    const handleFormSubmit = async () => {
        if (!form.amount || !form.date || !form.category_id) {
            toast.error("Please fill all required fields!");
            return;
        }

        try {
            let updatedList;
            let result;
            if (editId) {
                result = await updateExpense(editId, form);
                updatedList = expenses.map((i) => (i.id === editId ? result : i));
                toast.success("Expense updated successfully!");
            } else {
                result = await createExpense(form);
                updatedList = [result, ...expenses];
                toast.success("New expense added!");
            }
            
            setExpenses(updatedList.map(exp => ({
                ...exp,
                amount: Number(exp.amount),
                category_name: exp.category?.name || exp.category_name || 'N/A',
                emoji: exp.category?.icon || exp.emoji || '💸'
            })).sort((a, b) => new Date(b.date) - new Date(a.date)));

            setShowModal(false);
            setEditId(null);
            setForm({
                category_name: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                emoji: "💸",
                category_id: "",
            });
        } catch (err) {
            console.error(err);
            toast.error(`Error while saving expense: ${err.message}`);
        }
    };
    
    const handleEdit = (expense) => {
        setForm({
            category_name: expense.category_name,
            amount: expense.amount.toString(),
            date: expense.date,
            emoji: expense.emoji,
            category_id: expense.category_id,
        });
        setEditId(expense.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            try {
                await deleteExpense(id);
                setExpenses(expenses.filter((i) => i.id !== id));
                toast.success("Expense deleted successfully!");
            } catch (err) {
                console.error(err);
                toast.error("Error deleting expense.");
            }
        }
    };

    // -----------------------------------------------------------------
    // 🧩 3. Data Summary & Chart Data 
    // -----------------------------------------------------------------
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // 📊 Dữ liệu cho Bar Chart (Summary theo Danh mục)
    const categoryChartData = useMemo(() => {
        const dataMap = expenses.reduce((acc, expense) => {
            const name = expense.category_name || "Khác";
            acc[name] = (acc[name] || 0) + expense.amount;
            return acc;
        }, {});
        
        return Object.keys(dataMap)
            .map(name => ({
                category: name,
                total: dataMap[name],
            }))
            // Chỉ lấy top 5 danh mục chi tiêu cao nhất
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); 

    }, [expenses]);

    // 📈 Dữ liệu cho Line Chart (Xu hướng chi tiêu theo Ngày)
    const dailyChartData = useMemo(() => {
        // Gom nhóm chi tiêu theo ngày (date)
        const dailyMap = expenses.reduce((acc, expense) => {
            const dateStr = expense.date; // Ngày đã có format YYYY-MM-DD
            acc[dateStr] = (acc[dateStr] || 0) + expense.amount;
            return acc;
        }, {});

        // Chuyển sang mảng, sắp xếp theo ngày cũ nhất lên trước
        return Object.keys(dailyMap)
            .map(date => ({
                date: date,
                amount: dailyMap[date],
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

    }, [expenses]);
    
    // Custom Label cho Bar Chart (hiển thị số tiền phía trên cột)
    const renderCustomBarLabel = ({ x, y, width, value }) => {
        // Chỉ hiển thị label nếu cột đủ rộng
        if (width < 30) return null; 

        return (
            <text 
                x={x + width / 2} 
                y={y} 
                fill={isDark ? "#E2E8F0" : "#4A5568"} 
                textAnchor="middle" 
                dy={-6} // Đẩy label lên trên cột
                fontSize={12}
            >
                {/* Format số tiền gọn gàng */}
                ${(value / 1000).toFixed(0)}k 
            </text>
        );
    };


    // -----------------------------------------------------------------
    // 🧩 4. JSX Rendering
    // -----------------------------------------------------------------

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
                {/* Header & Add Button (Giữ nguyên) */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingDown className="text-red-500" /> Expense Tracker
                    </h1>
                    <button
                        onClick={() => {
                            setShowModal(true);
                            setEditId(null);
                            setForm({
                                category_name: "",
                                amount: "",
                                date: new Date().toISOString().split('T')[0],
                                emoji: "💸",
                                category_id: "",
                            });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                    >
                        <PlusCircle size={18} /> Add New Expense
                    </button>
                </div>

                {/* Summary Card (Giữ nguyên) */}
                <div
                    className={`p-6 rounded-2xl shadow-lg flex justify-between items-center ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Total Expense</h3>
                        <p className="text-4xl font-bold text-red-500">
                            ${totalExpense.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 📊 CHART CARD 1: Bar Chart (Tổng chi tiêu theo danh mục) */}
                    <div
                        className={`lg:col-span-2 p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Top 5 Expense by Category</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={categoryChartData}
                                    layout="vertical" // Biểu đồ cột ngang dễ đọc tên danh mục hơn
                                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#E2E8F0"} />
                                    <XAxis 
                                        type="number" 
                                        stroke={isDark ? "#94A3B8" : "#334155"}
                                        tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} // Format trục X
                                    />
                                    <YAxis 
                                        dataKey="category" 
                                        type="category" 
                                        stroke={isDark ? "#94A3B8" : "#334155"}
                                        width={80} // Tăng chiều rộng để tránh cắt tên danh mục
                                    />
                                    <Tooltip
                                        formatter={(value) => [`$${value.toLocaleString()}`, "Total Expense"]}
                                        contentStyle={{
                                            background: isDark ? "#1E293B" : "#F1F5F9",
                                            border: "none",
                                        }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        fill="#EF4444" 
                                        radius={[0, 10, 10, 0]} // Bo góc bên phải
                                        label={renderCustomBarLabel} // Hiển thị số tiền trên cột
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Expenses List (Giữ nguyên) */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Recent Expenses</h3>
                        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {expenses.slice(0, 5).map((expense) => (
                                <li
                                    key={expense.id}
                                    className={`flex justify-between items-center p-3 rounded-lg ${
                                        isDark ? "bg-gray-700/50" : "bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{expense.emoji}</span>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {expense.category_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {expense.date}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-red-500">
                                        -${expense.amount.toLocaleString()}
                                    </p>
                                </li>
                            ))}
                            {expenses.length === 0 && !loading && (
                                <li className="text-center py-4 text-gray-500">
                                    No expense records found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* 📈 CHART CARD 2: Line Chart (Xu hướng chi tiêu theo Ngày) */}
                <div
                    className={`p-6 rounded-2xl shadow-lg ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <h3 className="text-lg font-semibold mb-3">Daily Expense Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#E2E8F0"} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke={isDark ? "#94A3B8" : "#334155"}
                                    tickFormatter={(dateStr) => dateStr.substring(5)} // Chỉ hiển thị MM-DD
                                />
                                <YAxis 
                                    stroke={isDark ? "#94A3B8" : "#334155"}
                                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    labelFormatter={(label) => `Date: ${label}`}
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Total Expense"]}
                                    contentStyle={{
                                        background: isDark ? "#1E293B" : "#F1F5F9",
                                        border: "none",
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#EF4444" 
                                    strokeWidth={3}
                                    dot={{ fill: '#EF4444', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
            
            {/* Modal (Giữ nguyên) */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className={`rounded-2xl shadow-2xl transition-all w-full max-w-md ${
                            isDark ? "bg-[#1e293b] text-gray-100" : "bg-white text-gray-900"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <TrendingDown size={24} className="text-red-500" />
                                {editId ? "Edit Expense" : "Add New Expense"}
                            </h2>
                            <div className="space-y-4">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                        placeholder="e.g. 150.00"
                                        required
                                    />
                                </div>
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                        required
                                    />
                                </div>
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={form.category_id}
                                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border outline-none ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map((c, idx) => (
                                            <option key={c.id || idx} value={c.id}>
                                                {c.icon ? `${c.icon} ` : ""}{c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Emoji Display */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Selected Emoji</label>
                                    <input
                                        type="text"
                                        value={form.emoji}
                                        readOnly
                                        className={`w-full px-3 py-2 rounded-lg border outline-none text-center text-2xl ${
                                            isDark
                                                ? "bg-gray-700 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                        }`}
                                    />
                                </div>
                            </div>
                            {/* Save / Update Button */}
                            <button
                                onClick={handleFormSubmit}
                                className="w-full mt-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2"
                            >
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