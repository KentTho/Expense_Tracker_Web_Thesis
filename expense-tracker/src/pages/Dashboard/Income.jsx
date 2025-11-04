import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    Trash2,
    Edit,
    DollarSign,
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart, // Cho Category Summary
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart, // 📊 ĐÃ CHUYỂN SANG AreaChart cho xu hướng theo ngày
    Area,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    getIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
} from "../../services/incomeService";
import { getCategories } from "../../services/categoryService"; 

export default function Income() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0], // Mặc định ngày hiện tại
        emoji: "💰",
        category_id: "",
    });

    // -----------------------------------------------------------------
    // 🧩 1. Data Fetching
    // -----------------------------------------------------------------
    const fetchIncomes = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Categories
            const categoriesData = await getCategories("income");
            setCategories(categoriesData);

            // 2. Fetch Incomes
            const incomesData = await getIncomes();

            // 3. Process data
            const processedIncomes = incomesData
                .map(inc => ({
                    ...inc,
                    amount: Number(inc.amount), // Đảm bảo Amount là Number
                    category_name: inc.category?.name || inc.category_name || 'N/A',
                    emoji: inc.category?.icon || inc.emoji || '💰'
                }))
                // Sắp xếp theo ngày mới nhất
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            setIncomes(processedIncomes);

        } catch (error) {
            console.error("Error fetching incomes/categories:", error);
            toast.error("Failed to load income data.");
            setIncomes([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes]);

    // -----------------------------------------------------------------
    // 🧩 2. Logic Form & CRUD (Đã tối ưu)
    // -----------------------------------------------------------------
    useEffect(() => {
        const selectedCat = categories.find(c => c.id === form.category_id);
        if (selectedCat) {
            setForm(prev => ({
                ...prev,
                category_name: selectedCat.name,
                emoji: selectedCat.icon || "💰"
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
                result = await updateIncome(editId, form);
                updatedList = incomes.map((i) => (i.id === editId ? result : i));
                toast.success("Income updated successfully!");
            } else {
                result = await createIncome(form);
                updatedList = [result, ...incomes];
                toast.success("New income added!");
            }
            
            // Cập nhật lại list sau khi thêm/sửa, và sắp xếp lại
            setIncomes(updatedList.map(inc => ({
                ...inc,
                amount: Number(inc.amount),
                category_name: inc.category?.name || inc.category_name || 'N/A',
                emoji: inc.category?.icon || inc.emoji || '💰'
            })).sort((a, b) => new Date(b.date) - new Date(a.date)));

            setShowModal(false);
            setEditId(null);
            setForm({
                category_name: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                emoji: "💰",
                category_id: "",
            });
        } catch (err) {
            console.error(err);
            toast.error(`Error while saving income: ${err.message}`);
        }
    };
    
    const handleEdit = (income) => {
        setForm({
            category_name: income.category_name,
            amount: income.amount.toString(),
            date: income.date,
            emoji: income.emoji,
            category_id: income.category_id,
        });
        setEditId(income.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this income?")) {
            try {
                await deleteIncome(id);
                setIncomes(incomes.filter((i) => i.id !== id));
                toast.success("Income deleted successfully!");
            } catch (err) {
                console.error(err);
                toast.error("Error deleting income.");
            }
        }
    };

    // -----------------------------------------------------------------
    // 🧩 3. Data Summary & Chart Data 
    // -----------------------------------------------------------------
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

    // 📊 Dữ liệu cho Bar Chart (Summary theo Danh mục)
    const categoryChartData = useMemo(() => {
        const dataMap = incomes.reduce((acc, income) => {
            const name = income.category_name || "Khác";
            acc[name] = (acc[name] || 0) + income.amount;
            return acc;
        }, {});
        
        return Object.keys(dataMap)
            .map(name => ({
                category: name,
                total: dataMap[name],
            }))
            // Chỉ lấy top 5 danh mục thu nhập cao nhất
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); 
    }, [incomes]);

    // 📈 Dữ liệu cho Area Chart (Xu hướng thu nhập theo Ngày)
    const dailyChartData = useMemo(() => {
        // Gom nhóm thu nhập theo ngày (date)
        const dailyMap = incomes.reduce((acc, income) => {
            const dateStr = income.date;
            acc[dateStr] = (acc[dateStr] || 0) + income.amount;
            return acc;
        }, {});

        // Chuyển sang mảng, sắp xếp theo ngày cũ nhất lên trước
        return Object.keys(dailyMap)
            .map(date => ({
                date: date,
                amount: dailyMap[date],
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [incomes]);
    
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
                {/* Header & Add Button */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <DollarSign className="text-blue-500" /> Income Tracker
                    </h1>
                    <button
                        onClick={() => {
                            setShowModal(true);
                            setEditId(null);
                            setForm({
                                category_name: "",
                                amount: "",
                                date: new Date().toISOString().split('T')[0],
                                emoji: "💰",
                                category_id: "",
                            });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                    >
                        <PlusCircle size={18} /> Add New Income
                    </button>
                </div>

                {/* Summary Card */}
                <div
                    className={`p-6 rounded-2xl shadow-lg flex justify-between items-center ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Total Income</h3>
                        <p className="text-4xl font-bold text-blue-500">
                            ${totalIncome.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 📊 CHART CARD 1: Bar Chart (Tổng thu nhập theo danh mục) */}
                    <div
                        className={`lg:col-span-2 p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Top 5 Income by Category</h3>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={categoryChartData}
                                    layout="vertical"
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
                                        width={80} 
                                    />
                                    <Tooltip
                                        formatter={(value) => [`$${value.toLocaleString()}`, "Total Income"]}
                                        contentStyle={{
                                            background: isDark ? "#1E293B" : "#F1F5F9",
                                            border: "none",
                                        }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        fill="#3B82F6" // Màu xanh dương cho Income
                                        radius={[0, 10, 10, 0]}
                                        label={renderCustomBarLabel}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Incomes List */}
                    <div
                        className={`p-6 rounded-2xl shadow-lg ${
                            isDark ? "bg-[#1e293b]" : "bg-white"
                        }`}
                    >
                        <h3 className="text-lg font-semibold mb-3">Recent Incomes</h3>
                        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {incomes.slice(0, 5).map((income) => (
                                <li
                                    key={income.id}
                                    className={`flex justify-between items-center p-3 rounded-lg ${
                                        isDark ? "bg-gray-700/50" : "bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{income.emoji}</span>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {income.category_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {income.date}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-blue-500">
                                        +${income.amount.toLocaleString()}
                                    </p>
                                </li>
                            ))}
                            {incomes.length === 0 && !loading && (
                                <li className="text-center py-4 text-gray-500">
                                    No income records found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* 📈 CHART CARD 2: Area Chart (Xu hướng thu nhập theo Ngày) */}
                <div
                    className={`p-6 rounded-2xl shadow-lg ${
                        isDark ? "bg-[#1e293b]" : "bg-white"
                    }`}
                >
                    <h3 className="text-lg font-semibold mb-3">Daily Income Trend (Area Chart)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyChartData}>
                                <defs>
                                    {/* Gradient fill cho Area Chart */}
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
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
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Total Income"]}
                                    contentStyle={{
                                        background: isDark ? "#1E293B" : "#F1F5F9",
                                        border: "none",
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#3B82F6" 
                                    fillOpacity={1} 
                                    fill="url(#colorIncome)" 
                                    strokeWidth={3}
                                />
                            </AreaChart>
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
                                <DollarSign size={24} className="text-blue-500" />
                                {editId ? "Edit Income" : "Add New Income"}
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
                                        placeholder="e.g. 500.00"
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
                                className="w-full mt-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
                            >
                                <DollarSign size={18} />
                                {editId ? "Update Income" : "Save Income"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}