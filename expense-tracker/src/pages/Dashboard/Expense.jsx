// Expense.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle, TrendingDown, DollarSign, Loader2, BarChart3, LineChart, Trash2, Edit,
    AlertTriangle, Activity, ArrowUpRight
} from "lucide-react";
import {
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense, getExpenses, updateExpense, deleteExpense, getExpenseDailyTrend, getExpenseBreakdown, 
} from "../../services/expenseService"; 
import { getCategories } from "../../services/categoryService";

// Helper Định dạng tiền tệ (Cập nhật để nhận currencyCode động)
const formatAmountDisplay = (amount, currencyCode = 'USD') => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return 'N/A';
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

// Custom Tooltip (Nhận currencyCode)
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
                    {formatAmountDisplay(value, currencyCode)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Expense() {
    // ✅ LẤY CURRENCY CODE TỪ CONTEXT
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";

    const [expenseData, setExpenseData] = useState({ items: [] });
    const [categories, setCategories] = useState([]);
    
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
        note: "",
        currency_code: currencyCode // Mặc định dùng currency hiện tại
    });

    // Cập nhật currency cho form khi context thay đổi
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

    // Data Fetching
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

    // Lắng nghe Chatbot
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
            toast.error("Please fill out all required fields.");
            return;
        }
        // Sử dụng currencyCode từ Context để đảm bảo đồng bộ
        let finalForm = { ...form, currency_code: currencyCode };
        
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

    const initiateDelete = (id) => { setDeleteId(id); setShowDeleteModal(true); };
    const confirmDelete = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await deleteExpense(deleteId);
            toast.success("Expense deleted successfully!");
            fetchData();
        } catch (error) {
            toast.error(error.message || "Failed to delete expense.");
        } finally {
            setLoading(false); setShowDeleteModal(false); setDeleteId(null);
        }
    };
    const closeModal = () => { setShowModal(false); setEditId(null); resetForm(); };

    // --- UI ---
    const chartTitle = chartView === 'trend' ? `Daily Expense Trend (${chartDays} Days)` : 'Expense Breakdown by Category';
    
    const TrendChart = (
        <RechartsLineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis
                dataKey="date" angle={-45} textAnchor="end" height={70} tickMargin={10}
                tickFormatter={(tick) => tick.substring(5)}
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 14, fontWeight: 600 }} 
            />
            <YAxis
                // ✅ FIX: Dùng currencyCode
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "")} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 14, fontWeight: 600 }} width={100} 
            />
            {/* ✅ FIX: Truyền currencyCode vào Tooltip */}
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} />
            <Line type="monotone" dataKey="total_amount" stroke="#EF4444" strokeWidth={4} dot={{ r: 5 }} activeDot={{ r: 8 }} />
        </RechartsLineChart>
    );

    const SummaryChart = (
        <BarChart data={breakdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis dataKey="category_name" stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 14, fontWeight: 600 }} height={50} />
            <YAxis 
                // ✅ FIX: Dùng currencyCode
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "")} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 14, fontWeight: 600 }} width={100} 
            />
            {/* ✅ FIX: Truyền currencyCode vào Tooltip */}
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} />
            <Bar dataKey="total_amount" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={60} />
        </BarChart>
    );

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <TrendingDown className="mr-2 text-red-500" size={32} />
                    Expense Transactions
                </h1>
                <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium shadow-lg transition-all">
                    <PlusCircle size={20} className="mr-2" /> Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className={`lg:col-span-1 p-6 rounded-2xl shadow-xl flex flex-col justify-between ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-500 flex items-center mb-4">
                            <DollarSign size={20} className="mr-1 text-red-500" /> Total Expense
                        </h2>
                        <p className="text-5xl font-extrabold text-red-500 tracking-tight leading-tight">
                            {/* ✅ FIX: Dùng currencyCode */}
                            {formatAmountDisplay(totalExpense, currencyCode)}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mt-auto">
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Activity size={12} /> Avg. / Txn</p>
                            {/* ✅ FIX: Dùng currencyCode */}
                            <p className="font-bold text-lg">{formatAmountDisplay(avgExpense, currencyCode)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><ArrowUpRight size={12} /> Highest Txn</p>
                            {/* ✅ FIX: Dùng currencyCode */}
                            <p className="font-bold text-lg">{formatAmountDisplay(maxExpense, currencyCode)}</p>
                        </div>
                    </div>
                </div>

                <div className={`lg:col-span-2 p-6 rounded-2xl shadow-xl flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                    <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
                    <div className="flex-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {loading && expenseData.items.length === 0 ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-red-500" /></div>
                        ) : expenseData.items.length > 0 ? (
                            <div className="space-y-3">
                                {expenseData.items.map(expense => (
                                    <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg border-b last:border-0 border-gray-100 dark:border-gray-700 transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                                                {expense.category?.icon || expense.icon || "💸"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">{expense.category?.name || expense.category_name || "Uncategorized"}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    {expense.date} {expense.note && <span className="italic ml-1">({expense.note})</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-red-500 text-lg">
                                                {/* ✅ FIX: Dùng currencyCode */}
                                                - {formatAmountDisplay(expense.amount, currencyCode)}
                                            </p>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(expense)} className="p-2 text-gray-400 hover:text-blue-500"><Edit size={18} /></button>
                                                <button onClick={() => initiateDelete(expense.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( <p className="text-center py-8 text-gray-500">No expenses recorded yet.</p> )}
                    </div>
                </div>
            </div>

            <div className={`w-full p-6 rounded-2xl shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={24} className="text-red-500"/>{chartTitle}</h2>
                    <div className="flex items-center space-x-3">
                        {chartView === 'trend' && (
                            <select value={chartDays} onChange={(e) => setChartDays(Number(e.target.value))} className={`text-sm py-2 px-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100"}`} disabled={loading}>
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                        )}
                        <button onClick={() => setChartView(chartView === 'trend' ? 'summary' : 'trend')} className="flex items-center text-sm px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:opacity-80">
                            {chartView === 'trend' ? <BarChart3 size={16} className="mr-2" /> : <LineChart size={16} className="mr-2" />} Switch View
                        </button>
                    </div>
                </div>
                <div className="h-[500px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%"> 
                        {chartView === 'trend' ? TrendChart : SummaryChart}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Modals (Giữ nguyên cấu trúc render modal) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <h2 className="text-2xl font-bold mb-4">{editId ? "Edit Expense" : "Add Expense"}</h2>
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">&times;</button>
                        <div className="space-y-4">
                            {/* Category Select */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select name="category_id" value={form.category_id} onChange={handleCategoryChange} className={`w-full px-4 py-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100"}`}>
                                    <option value="" disabled>Select Category</option>
                                    {categories.filter(c => c.type === 'expense').map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Amount & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    {/* ✅ FIX: Hiển thị currency code trong label */}
                                    <label className="block text-sm font-medium mb-1">Amount ({currencyCode})</label>
                                    <input type="number" name="amount" value={form.amount} onChange={handleFormChange} className={`w-full px-4 py-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100"}`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input type="date" name="date" value={form.date} onChange={handleFormChange} className={`w-full px-4 py-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100"}`} />
                                </div>
                            </div>
                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Note</label>
                                <textarea name="note" value={form.note} onChange={handleFormChange} className={`w-full px-4 py-3 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100"}`} />
                            </div>
                            <button onClick={handleFormSubmit} disabled={loading} className="w-full mt-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg">
                                {loading ? "Saving..." : (editId ? "Update Expense" : "Save Expense")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><Trash2 className="text-red-600" /></div>
                        <h3 className="text-lg font-bold mb-2">Delete Expense?</h3>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 rounded-lg border">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}