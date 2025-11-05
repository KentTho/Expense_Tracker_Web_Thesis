import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    Trash2,
    Edit,
    DollarSign,
    Loader2,
    Calendar,
    Download,
    X,
    BarChart3, 
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    getIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
    getIncomeSummary,
} from "../../services/incomeService";
import { getCategories } from "../../services/categoryService"; 
import { format } from "date-fns";

// Màu sắc
const INCOME_TREND_COLOR = "#10B981"; 

// 💡 Danh sách các đơn vị tiền tệ
const CURRENCIES = [
    { code: "USD", name: "US Dollar ($)" },
    { code: "VND", name: "Vietnamese Dong (₫)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "JPY", name: "Japanese Yen (¥)" },
    { code: "GBP", name: "British Pound (£)" },
];

// ====================================================
// 💡 HELPER: ĐỊNH DẠNG TIỀN TỆ (Sử dụng đơn vị đã chọn)
// ====================================================
const formatAmountDisplay = (amount, currencyCode) => {
    // 1. Chuyển sang kiểu số và làm tròn để loại bỏ số thập phân
    const roundedAmount = Math.round(Number(amount));
    
    // 2. Định dạng theo đơn vị tiền tệ đã chọn
    return new Intl.NumberFormat('en-US', { // Sử dụng 'en-US' locale để có định dạng số chuẩn
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0,
    }).format(roundedAmount);
};


export default function Income() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incomeSummary, setIncomeSummary] = useState([]); 
    const [totalIncome, setTotalIncome] = useState(0); 
    const [showModal, setShowModal] = useState(false); 
    const [showSummaryModal, setShowSummaryModal] = useState(false); 
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [filterDate, setFilterDate] = useState(""); 
    
    // 💡 State mới: Lưu đơn vị tiền tệ đang hiển thị (Mặc định: USD)
    const [displayCurrency, setDisplayCurrency] = useState("USD"); 
    
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💰",
        category_id: "",
    });

    // ... (Giữ nguyên logic fetchData, handleFormSubmit, handleEdit, handleDelete, handleCloseModal) ...
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [incomesResult, categoriesResult, summaryResult] = await Promise.all([
                getIncomes(),
                getCategories("income"),
                getIncomeSummary(),
            ]);

            const formattedSummary = summaryResult.map(item => ({
                name: item.category_name,
                value: Number(item.total_amount) || 0,
            })).filter(item => item.value > 0);

            // 💡 Tính Total Income
            const calculatedTotalIncome = incomesResult.reduce((sum, income) => 
                sum + Number(income.amount), 0
            );
            
            setTotalIncome(calculatedTotalIncome); 
            setIncomes(incomesResult);
            setCategories(categoriesResult);
            setIncomeSummary(formattedSummary);

        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load income data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleFormSubmit = async () => {
        if (!form.amount || !form.date) {
            toast.error("Please fill in required fields (Amount and Date)!");
            return;
        }
        
        let finalForm = { ...form };
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                finalForm.emoji = foundCategory.icon || finalForm.emoji;
            }
        }
        
        try {
            let updatedList;
            if (editId) {
                const updated = await updateIncome(editId, finalForm);
                updatedList = incomes.map((i) => (i.id === editId ? updated : i));
                toast.success("Income updated successfully!");
            } else {
                const created = await createIncome(finalForm);
                updatedList = [...incomes, created];
                toast.success("New income added!");
            }
            setIncomes(updatedList);
            await fetchData(); 
            
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
        setEditId(income.id);
        setForm({
            category_name: income.category_name,
            amount: String(income.amount),
            date: income.date,
            emoji: income.emoji,
            category_id: income.category?.id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this income?")) {
            try {
                await deleteIncome(id);
                setIncomes(incomes.filter((i) => i.id !== id));
                await fetchData(); 
                toast.success("Income deleted successfully!");
            } catch (err) {
                console.error(err);
                toast.error("Error deleting income.");
            }
        }
    };
    
    const handleCloseModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm({
            category_name: "",
            amount: "",
            date: new Date().toISOString().split('T')[0],
            emoji: "💰",
            category_id: "",
        });
    }

    const filteredIncomes = useMemo(() => {
        if (!filterDate) return incomes;
        return incomes.filter(i => i.date === filterDate);
    }, [incomes, filterDate]);

    const summaryData = useMemo(() => {
        return [...incomeSummary].sort((a, b) => b.value - a.value); 
    }, [incomeSummary]);

    const dailyTrendData = useMemo(() => {
        const dailyMap = incomes.reduce((acc, income) => {
            const dateStr = income.date;
            acc[dateStr] = (acc[dateStr] || 0) + Number(income.amount);
            return acc;
        }, {});

        return Object.keys(dailyMap)
            .sort()
            .map(dateStr => ({
                date: format(new Date(dateStr), 'dd/MM'), 
                amount: dailyMap[dateStr],
            }));
    }, [incomes]);

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        const selectedCategory = categories.find(c => c.id === categoryId);
        
        setForm({ 
            ...form, 
            category_id: categoryId,
            category_name: selectedCategory ? selectedCategory.name : "",
            emoji: selectedCategory ? selectedCategory.icon : form.emoji || "💰",
        });
    };
    // ----------------------------------------------------
    // 🖼️ 5. PHẦN RENDER GIAO DIỆN
    // ----------------------------------------------------

    return (
        <div className={`p-6 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
            <Toaster />

            {/* HEADER & BUTTONS (ADD & SUMMARY & CURRENCY) */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign size={24} className="text-green-500" /> Income Transactions
                </h1>
                <div className="flex gap-3 items-center">
                    {/* 💡 Currency Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Currency:</label>
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className={`px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Nút mở Summary Modal */}
                    <button
                        onClick={() => setShowSummaryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-md shadow-purple-500/50"
                        title="View Income Summary by Category"
                    >
                        <BarChart3 size={20} /> View Summary
                    </button>
                    {/* Nút Add New Income */}
                    <button
                        onClick={() => {
                            setEditId(null);
                            setForm({
                                category_name: "",
                                amount: "",
                                date: new Date().toISOString().split('T')[0],
                                emoji: "💰",
                                category_id: "",
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md shadow-blue-500/50"
                    >
                        <PlusCircle size={20} /> Add New Income
                    </button>
                </div>
            </div>

            {/* 💡 --- BỐ CỤC 2 CỘT CHÍNH (Trend Chart & Transaction List) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 📊 CỘT 1: INCOME TREND (Area Chart) - Chiếm 2/3 chiều rộng */}
                <div className="lg:col-span-2">
                    <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-4 rounded-xl shadow-lg h-full`}>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-green-500" /> Income Trend by Date
                        </h2>
                        {/* Biểu đồ Area Chart - Tăng chiều cao để rõ ràng hơn */}
                        <div className="h-96"> 
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyTrendData}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                                    <XAxis dataKey="date" stroke={isDark ? "#9CA3AF" : "#6B7280"} angle={-45} textAnchor="end" height={50} /> 
                                    <YAxis 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        tickFormatter={(value) => formatAmountDisplay(value, displayCurrency)} // 💡 Sử dụng Currency Code
                                    /> 
                                    <Tooltip 
                                        formatter={(value) => [`${formatAmountDisplay(value, displayCurrency)}`, "Amount"]} // 💡 Sử dụng Currency Code
                                        contentStyle={{ 
                                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                            borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                            borderRadius: "8px" 
                                        }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke={INCOME_TREND_COLOR} fill={INCOME_TREND_COLOR} fillOpacity={0.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 📜 CỘT 2: RECENT INCOMES LIST - Chiếm 1/3 chiều rộng */}
                <div className="lg:col-span-1">
                    <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-4 rounded-xl shadow-lg h-full`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Recent Incomes</h2>
                            <button className={`px-3 py-2 rounded-lg border transition ${isDark ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-100 border-gray-300 hover:bg-gray-200"}`} title="Export Data">
                                <Download size={20} />
                            </button>
                        </div>

                        {/* Thanh lọc/tìm kiếm & Nút View All */}
                        <div className="mb-4 flex gap-2 items-center">
                            <div className="relative flex-grow">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}
                                />
                            </div>
                            {/* Nút Clear Filter / View All */}
                            {filterDate && (
                                <button
                                    onClick={() => setFilterDate("")}
                                    className={`px-3 py-2 rounded-lg transition font-medium text-sm ${isDark ? "bg-red-700/50 hover:bg-red-700 text-white" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                                    title="Clear Date Filter (View All)"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Danh sách giao dịch - Thêm cuộn dọc (overflow-y-auto) */}
                        {loading ? (
                            <div className="flex justify-center items-center py-10 h-[300px]">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                            </div>
                        ) : filteredIncomes.length === 0 ? (
                            <p className="text-center py-10 text-gray-500">No income transactions found.</p>
                        ) : (
                            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}> {/* Giới hạn chiều cao cho scroll */}
                                {filteredIncomes.map((income) => (
                                    <div
                                        key={income.id}
                                        className={`flex justify-between items-center py-3 px-2 rounded-lg hover:shadow-md transition ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50/50"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{income.emoji || income.category?.icon || '❓'}</span>
                                            <div>
                                                <p className="font-medium text-sm">{income.category_name}</p>
                                                <p className="text-xs text-gray-400">{income.date ? format(new Date(income.date), "dd/MM/yyyy") : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="font-semibold text-sm text-green-500">
                                                + {formatAmountDisplay(income.amount, displayCurrency)} {/* 💡 Sử dụng Currency Code */}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <button
                                                    onClick={() => handleEdit(income)}
                                                    className="text-blue-500 hover:text-blue-700 transition"
                                                    aria-label="Edit Income"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(income.id)}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                    aria-label="Delete Income"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
            
            {/* --- KHU VỰC THÔNG TIN BỔ SUNG (Total Income Card) --- */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card Tổng thu nhập */}
                <div className="md:col-span-1">
                    <div className={`p-6 rounded-xl shadow-lg border-t-4 border-green-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-green-500 flex items-center gap-2">
                                <DollarSign size={24} /> Total Income (All Time)
                            </h3>
                        </div>
                        <p className={`text-4xl font-extrabold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                            {formatAmountDisplay(totalIncome, displayCurrency)} {/* 💡 Sử dụng Currency Code */}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Calculated from {incomes.length} transactions.
                        </p>
                    </div>
                </div>
                
                {/* Bổ sung thêm 2 cột trống */}
                <div className="md:col-span-2">
                    {/* Có thể thêm các biểu đồ/KPI khác ở đây */}
                </div>
                
            </div>
            
            {/* --- MODAL CHUNG (CREATE/UPDATE) --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={handleCloseModal}
                            className={`absolute top-4 right-4 text-gray-500 transition hover:text-red-500 ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
                            aria-label="Close modal"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold mb-4">
                            {editId ? "Edit Income" : "Add New Income"}
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Form fields here (Amount, Date, Category, Emoji) */}
                            <div>
                                {/* 💡 CHÚ Ý: Tại đây, chúng ta vẫn mặc định hiển thị USD để tránh người dùng bị nhầm lẫn khi nhập */}
                                <label className="block text-sm font-medium mb-1">Amount (USD)</label> 
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    placeholder="e.g., 1000"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={form.category_id}
                                    onChange={handleCategoryChange}
                                    className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}> 
                                            {c.icon ? `${c.icon} ` : ""}{c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-20">
                                <label className="block text-sm font-medium mb-1">Emoji</label>
                                <input
                                    type="text"
                                    value={form.emoji}
                                    readOnly
                                    className={`w-full px-3 py-2 rounded-lg border outline-none text-center text-2xl ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                />
                            </div>
                            
                            <button
                                onClick={handleFormSubmit}
                                className="w-full mt-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition font-semibold shadow-lg shadow-blue-500/50"
                            >
                                <DollarSign size={18} />
                                {editId ? "Update Income" : "Save Income"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- MODAL CHO SUMMARY CHART --- */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-3xl p-6 rounded-xl shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={() => setShowSummaryModal(false)}
                            className={`absolute top-4 right-4 text-gray-500 transition hover:text-red-500 ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
                            aria-label="Close Summary Chart"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <BarChart3 size={24} className="text-purple-500" /> Income Summary by Category (Top 10)
                        </h3>

                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={summaryData.slice(0, 10)} 
                                    layout="vertical" 
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} />
                                    <XAxis 
                                        type="number" 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        tickFormatter={(value) => formatAmountDisplay(value, displayCurrency)} // 💡 Sử dụng Currency Code
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        width={100} 
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${formatAmountDisplay(value, displayCurrency)}`, "Amount"]} // 💡 Sử dụng Currency Code
                                        contentStyle={{ 
                                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                            borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                            borderRadius: "8px" 
                                        }}
                                    />
                                    <Bar dataKey="value" fill={INCOME_TREND_COLOR} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}