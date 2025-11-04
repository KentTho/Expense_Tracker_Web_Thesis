import React, { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    Trash2,
    Edit,
    Download,
    Calendar,
    TrendingDown,
    DollarSign, 
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    Tooltip,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense,
    getExpenses,
    updateExpense,
    deleteExpense,
    // getExpenseSummary, // Giữ lại nếu cần, nhưng không có trong Income.jsx
} from "../../services/expenseService"; // Đảm bảo import từ expenseService mới
import { getCategories } from "../../services/categoryService"; 
import { auth } from "../../components/firebase"; // Sửa đường dẫn theo cấu trúc project của bạn

export default function Expense() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]); // State để lưu danh mục chi tiêu
    const [summary, setSummary] = useState([]); // Dữ liệu summary cho biểu đồ
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ 
        category_name: "", 
        amount: "", 
        date: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
        emoji: "🛍️",
        category_id: "", // Thêm category_id để lưu ID từ dropdown
    });

    // ----------------------------------------------------
    // 🧩 Fetch Data (Expenses & Categories)
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Chờ người dùng xác thực (sử dụng auth.onAuthStateChanged)
            await new Promise(resolve => {
                const unsubscribe = auth.onAuthStateChanged(user => {
                    unsubscribe();
                    resolve(user);
                });
            });

            // Gọi API đồng thời
            const [expenseList, categoryList] = await Promise.all([
                getExpenses(),
                getCategories("expense"), // Lấy danh mục chi tiêu
            ]);

            setExpenses(expenseList);
            setCategories(categoryList);

            // Xử lý summary data nếu cần
            // (Hiện tại bỏ qua phần này để tập trung vào Category)

        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data!");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ----------------------------------------------------
    // 🧩 Handle CRUD Operations
    // ----------------------------------------------------

    const handleEdit = (expense) => {
        // Cập nhật form với dữ liệu hiện có
        setForm({
            // ✅ Đảm bảo category_name được giữ lại nếu có, nhưng nó sẽ được cập nhật từ dropdown nếu người dùng chọn lại
            category_name: expense.category_name || expense.category?.name || "",
            amount: expense.amount,
            date: expense.date,
            emoji: expense.emoji || "🛍️",
            // ✅ Ưu tiên category_id
            category_id: expense.category?.id || expense.category_id || "", 
        });
        setEditId(expense.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;

        try {
            await deleteExpense(id);
            setExpenses(expenses.filter((e) => e.id !== id));
            toast.success("Expense deleted successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Error deleting expense!");
        }
    };

    const handleFormSubmit = async () => {
        // ✅ THAY ĐỔI: Kiểm tra category_id thay vì category_name
        if (!form.category_id || !form.amount || !form.date) {
            toast.error("Please fill in all required fields!");
            return;
        }

        try {
            // ... (logic lưu và cập nhật state không đổi)
            let updatedList;
            if (editId) {
                const updated = await updateExpense(editId, form);
                updatedList = expenses.map((e) => (e.id === editId ? updated : e));
                toast.success("Expense updated successfully!");
            } else {
                const created = await createExpense(form);
                updatedList = [...expenses, created];
                toast.success("New expense added!");
            }
            setExpenses(updatedList);
            setShowModal(false);
            setEditId(null);
            setForm({
                category_name: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                emoji: "🛍️",
                category_id: "",
            });
        } catch (err) {
            console.error(err);
            toast.error("Error while saving expense!");
        }
    };

    // ----------------------------------------------------
    // 🧩 Render (Biểu đồ, Bảng, Modal)
    // ----------------------------------------------------

    const mainBg = isDark ? "bg-gray-800" : "bg-gray-50";
    const cardBg = isDark ? "bg-gray-700" : "bg-white";
    const textPrimary = isDark ? "text-white" : "text-gray-900";
    const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
    const borderColor = isDark ? "border-gray-600" : "border-gray-300";

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toFixed(2);
    
    // Giả sử dữ liệu summary đã được xử lý để hiển thị trên biểu đồ LineChart
    const chartData = summary.length > 0 ? summary : expenses.map(e => ({
        date: e.date,
        amount: Number(e.amount)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));


    return (
        <div className={`min-h-screen p-4 md:p-8 ${mainBg} ${textPrimary}`}>
            <Toaster position="top-right" />

            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <TrendingDown size={30} className="text-red-500" />
                    Expense Tracking
                </h1>
                <button
                    onClick={() => {
                        setEditId(null);
                        setForm({
                            category_name: "",
                            amount: "",
                            date: new Date().toISOString().split('T')[0],
                            emoji: "🛍️",
                            category_id: "",
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition"
                >
                    <PlusCircle size={20} /> Add New Expense
                </button>
            </header>

            {/* Total Summary Card and Chart */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6`}>
                <div className={`${cardBg} p-6 rounded-xl shadow-xl lg:col-span-1 border ${borderColor} flex flex-col justify-between`}>
                    <h2 className={`text-xl font-semibold mb-2 ${textSecondary}`}>Total Expenses</h2>
                    <p className="text-4xl font-extrabold text-red-500">${totalExpense}</p>
                    <p className={`text-sm mt-4 ${textSecondary}`}>Track your spending over time.</p>
                </div>

                <div className={`${cardBg} p-4 rounded-xl shadow-xl lg:col-span-2 border ${borderColor} h-72`}>
                    <h2 className={`text-xl font-semibold mb-2 p-2 ${textSecondary}`}>Expense Trend</h2>
                    <ResponsiveContainer width="100%" height="90%">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="animate-spin text-red-500" size={32} />
                            </div>
                        ) : (
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="date" stroke={isDark ? "#ccc" : "#333"} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? "#374151" : "#fff",
                                        borderColor: isDark ? "#4b5563" : "#d1d5db",
                                        borderRadius: "8px",
                                    }}
                                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Amount"]}
                                    labelStyle={{ color: isDark ? "#fff" : "#333" }}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense List */}
            <div className={`${cardBg} p-4 md:p-6 rounded-xl shadow-xl border ${borderColor}`}>
                <h2 className={`text-xl font-semibold mb-4 ${textSecondary}`}>Recent Transactions ({expenses.length})</h2>
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="animate-spin text-red-500" size={32} />
                    </div>
                ) : expenses.length === 0 ? (
                    <p className="text-center p-4 text-gray-400">No expenses recorded yet. Start by adding a new transaction!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead>
                                <tr className={`${isDark ? "bg-gray-600" : "bg-gray-100"} text-left text-sm font-medium ${textSecondary}`}>
                                    <th className="px-6 py-3">Emoji</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className={`${isDark ? "hover:bg-gray-600/50" : "hover:bg-gray-50"} transition`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-xl">{expense.emoji}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{expense.category_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-500 font-semibold">
                                            -${Number(expense.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{expense.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(expense)}
                                                className={`text-blue-500 hover:text-blue-700 mr-3 p-1 rounded transition ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                                                aria-label="Edit Expense"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className={`text-red-500 hover:text-red-700 p-1 rounded transition ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                                                aria-label="Delete Expense"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit Expense */}
            {/* Modal for Add/Edit Expense */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className={`${cardBg} rounded-xl shadow-2xl w-full max-w-lg p-6 relative border ${borderColor}`}>
                        <h2 className="text-2xl font-bold mb-4 text-red-500">
                            {editId ? "Edit Expense" : "Add New Expense"}
                        </h2>
                        <button
                            onClick={() => setShowModal(false)}
                            className={`absolute top-4 right-4 text-gray-500 hover:text-red-500 p-2 rounded-full transition ${isDark ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
                        >
                            <PlusCircle size={20} className="rotate-45" />
                        </button>

                        <div className="space-y-4">
                            
                            <div className="flex flex-col gap-4 md:flex-row">
                                {/* ✅ THAY THẾ Category Name Input bằng Category Selector (Dropdown) */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        // ✅ Sử dụng category_id làm value
                                        value={form.category_id || ""}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            
                                            if (!selectedId) {
                                                return setForm({ ...form, category_id: "", category_name: "", emoji: "🛍️" });
                                            }
                                            
                                            // Tìm danh mục đã chọn
                                            const found = categories.find((c) => 
                                                String(c.id).toLowerCase() === selectedId.toLowerCase()
                                            ); 
                                            
                                            if (found) {
                                                setForm({
                                                    ...form,
                                                    category_id: found.id,
                                                    category_name: found.name,
                                                    emoji: found.icon || "🛍️",
                                                    // Giả định categories từ BE không có is_user_category, 
                                                    // nhưng ta vẫn gửi category_name và category_id
                                                });
                                            } else {
                                                console.warn("Category not found for ID:", selectedId);
                                            }
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark
                                                ? "bg-gray-800 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                            }`}
                                    >
                                        <option value="">-- Select Category --</option>
                                        {/* ✅ Render Category Options */}
                                        {categories.map((c, idx) => (
                                            <option key={c.id || idx} value={c.id}> 
                                                {c.icon ? `${c.icon} ` : ""}{c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Amount Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        placeholder="0.00"
                                        className={`w-full px-3 py-2 rounded-lg border outline-none text-red-500 font-semibold ${isDark
                                                ? "bg-gray-800 border-gray-600 text-red-400"
                                                : "bg-gray-100 border-gray-300"
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {/* Date Input */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark
                                                ? "bg-gray-800 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                            }`}
                                    />
                                </div>
                                {/* ✅ THAY THẾ Emoji Input bằng Emoji Display (Readonly) */}
                                <div className="w-20">
                                    <label className="block text-sm font-medium mb-1">Emoji</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={form.emoji}
                                        readOnly // ✅ Chuyển thành Readonly
                                        className={`w-full px-3 py-2 rounded-lg border outline-none text-xl text-center ${isDark
                                                ? "bg-gray-800 border-gray-600 text-white"
                                                : "bg-gray-100 border-gray-300"
                                            }`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFormSubmit}
                                className="w-full mt-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white transition font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/50"
                            >
                                <TrendingDown size={18} /> {editId ? "Update Expense" : "Save Expense"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
