// Income.jsx
// - ĐÃ CẬP NHẬT: Bố cục 1-2-3 (Giống Expense).
// - ĐÃ CẬP NHẬT: Delete Modal Custom.
// - ĐÃ CẬP NHẬT: Chart Font Size to (14px).
// - ĐÃ CẬP NHẬT: Thẻ Total Income (Mini-stats & Decor).

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
    AlertTriangle, // Icon cho Delete Modal
    Activity,      // Icon Mini-stat
    ArrowUpRight,  // Icon Mini-stat
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

// Màu sắc chủ đạo
const INCOME_TREND_COLOR = "#10B981"; 

// Danh sách đơn vị tiền tệ
const CURRENCIES = [
    { code: "USD", name: "US Dollar ($)" },
    { code: "VND", name: "Vietnamese Dong (₫)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "JPY", name: "Japanese Yen (¥)" },
    { code: "GBP", name: "British Pound (£)" },
];

// HELPER: ĐỊNH DẠNG TIỀN TỆ
const formatAmountDisplay = (amount, currencyCode) => {
    const roundedAmount = Math.round(Number(amount));
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0,
        }).format(roundedAmount);
    } catch (e) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0,
        }).format(roundedAmount);
    }
};

// Custom Tooltip (Style giống Expense)
const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm">
                <p className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-200">{`Date: ${label}`}</p>
                <p className="text-base font-bold text-green-500">
                    Income: {formatAmountDisplay(payload[0].value, currencyCode)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Income() {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";

    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incomeSummary, setIncomeSummary] = useState([]); 
    
    // Modal States
    const [showModal, setShowModal] = useState(false); 
    const [showSummaryModal, setShowSummaryModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false); // 🔔 Delete Modal
    const [deleteId, setDeleteId] = useState(null);

    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState(""); 
    const [displayCurrency, setDisplayCurrency] = useState("USD"); 
    
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💰",
        category_id: "",
    });

    // 📊 TÍNH TOÁN CHỈ SỐ (Total, Avg, Max)
    const { totalIncome, avgIncome, maxIncome } = useMemo(() => {
        const total = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
        const avg = incomes.length > 0 ? total / incomes.length : 0;
        const max = incomes.length > 0 ? Math.max(...incomes.map(i => Number(i.amount))) : 0;

        return { 
            totalIncome: total,
            avgIncome: Math.round(avg),
            maxIncome: Math.round(max)
        };
    }, [incomes]);

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
            amount: String(Math.round(income.amount)), // Làm tròn khi edit
            date: income.date,
            emoji: income.emoji,
            category_id: income.category?.id || '',
        });
        setShowModal(true);
    };

    // 🔔 Logic Delete mới
    const initiateDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteIncome(deleteId);
            setIncomes(incomes.filter((i) => i.id !== deleteId));
            await fetchData(); 
            toast.success("Income deleted successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Error deleting income.");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
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
        setForm({ 
            ...form, 
            category_id: categoryId,
            category_name: selectedCategory ? selectedCategory.name : "",
            emoji: selectedCategory ? selectedCategory.icon : form.emoji || "💰",
        });
    };

    // ----------------------------------------------------
    // 🖼️ UI RENDER
    // ----------------------------------------------------

    return (
        <div className={`p-4 sm:p-6 min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
            <Toaster position="top-center" />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign size={32} className="text-green-500" /> Income Transactions
                </h1>
                <div className="flex gap-3 items-center">
                    {/* Currency Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value)}
                            className={`px-2 py-1 text-sm bg-transparent outline-none font-medium ${isDark ? "text-white" : "text-gray-700"}`}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowSummaryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-lg"
                    >
                        <BarChart3 size={20} /> View Summary
                    </button>
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-lg transform hover:scale-105 active:scale-95"
                    >
                        <PlusCircle size={20} /> Add Income
                    </button>
                </div>
            </div>

            {/* 💡 --- ROW 1: KPI & LIST (Bố cục 1-2-3 giống Expense) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* 1. TOTAL INCOME CARD (ĐÃ NÂNG CẤP) */}
                <div className={`lg:col-span-1 relative overflow-hidden p-6 rounded-2xl shadow-xl flex flex-col justify-between ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                     {/* Decor Background Icon */}
                     <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-[0.03] pointer-events-none">
                        <DollarSign size={180} className={isDark ? "text-white" : "text-black"} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <DollarSign size={20} className="mr-1 text-green-500" />
                            Total Income (All Time)
                        </h2>
                        <p className="text-5xl font-extrabold text-green-500 tracking-tight leading-tight">
                            {formatAmountDisplay(totalIncome, displayCurrency)}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 mb-6">
                            Calculated from {incomes.length} transactions.
                        </p>
                    </div>

                    {/* Mini Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mt-auto relative z-10">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <Activity size={12} /> Avg. / Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(avgIncome, displayCurrency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <ArrowUpRight size={12} /> Highest Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(maxIncome, displayCurrency)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. RECENT INCOMES LIST (Cột 2 & 3) */}
                <div className={`lg:col-span-2 p-6 rounded-2xl shadow-xl flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Recent Incomes</h2>
                        
                        {/* Filter Controls */}
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className={`px-3 py-1 text-sm rounded-lg border outline-none ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}
                            />
                             {filterDate && (
                                <button
                                    onClick={() => setFilterDate("")}
                                    className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <button className={`p-2 rounded-lg border transition ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}>
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 size={32} className="animate-spin text-green-500" />
                            </div>
                        ) : filteredIncomes.length === 0 ? (
                            <p className="text-center py-10 text-gray-500">No income transactions found.</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredIncomes.map((income) => (
                                    <div
                                        key={income.id}
                                        className={`flex justify-between items-center p-3 rounded-lg border-b last:border-0 border-gray-100 dark:border-gray-700 transition ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                                                {income.emoji || income.category?.icon || '💰'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base">{income.category_name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {income.date ? format(new Date(income.date), "dd/MM/yyyy") : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-green-500 text-lg">
                                                + {formatAmountDisplay(income.amount, displayCurrency)}
                                            </p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEdit(income)}
                                                    className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => initiateDelete(income.id)}
                                                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    <Trash2 size={18} />
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
            
            {/* --- ROW 2: CHART (NẰM DƯỚI CÙNG, FULL WIDTH) --- */}
            <div className={`w-full p-6 rounded-2xl shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calendar size={24} className="text-green-500" /> Income Trend by Date
                </h2>
                <div className="h-[500px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={INCOME_TREND_COLOR} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={INCOME_TREND_COLOR} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                angle={-45} 
                                textAnchor="end" 
                                height={70} 
                                tick={{ fontSize: 14, fontWeight: 600 }} // ✅ Font to
                            /> 
                            <YAxis 
                                stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                tickFormatter={(value) => formatAmountDisplay(value, displayCurrency)}
                                tick={{ fontSize: 14, fontWeight: 600 }} // ✅ Font to
                                width={100} // ✅ Rộng hơn
                            /> 
                            <Tooltip content={<CustomTooltip currencyCode={displayCurrency} />} />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke={INCOME_TREND_COLOR} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorIncome)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* --- DELETE CONFIRMATION MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all scale-100 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Delete Income?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                Are you sure you want to delete this record? This action cannot be undone.
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
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHUNG (CREATE/UPDATE) --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount" 
                                        value={form.amount}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 1000"
                                        min="1"
                                        step="1"
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date" 
                                        value={form.date}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={form.category_id}
                                    onChange={handleCategoryChange}
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-base ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}> 
                                            {c.icon ? `${c.icon} ` : ""}{c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Emoji</label>
                                <input
                                    type="text"
                                    value={form.emoji}
                                    readOnly
                                    className={`w-full px-4 py-3 rounded-lg border outline-none text-center text-2xl ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300"}`}
                                />
                            </div>
                            
                            <button
                                onClick={handleFormSubmit}
                                className="w-full mt-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2 transition font-semibold shadow-lg"
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
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`w-full max-w-3xl p-6 rounded-xl shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={() => setShowSummaryModal(false)}
                            className={`absolute top-4 right-4 text-gray-500 transition hover:text-red-500 ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
                            aria-label="Close Summary Chart"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <BarChart3 size={24} className="text-purple-500" /> Income Summary (Top 10)
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
                                        tickFormatter={(value) => formatAmountDisplay(value, displayCurrency)}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        width={100} 
                                        tick={{ fontSize: 12, fontWeight: 500 }}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${formatAmountDisplay(value, displayCurrency)}`, "Amount"]}
                                        contentStyle={{ 
                                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                            borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                            borderRadius: "8px" 
                                        }}
                                    />
                                    <Bar dataKey="value" fill={INCOME_TREND_COLOR} radius={[0, 4, 4, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}