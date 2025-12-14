// Income.jsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next"; 
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
    AlertTriangle, 
    Activity,      
    ArrowUpRight,  
    FileText,
    SearchX,
    TrendingUp,
    Info // ✅ Thêm icon Info
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

const INCOME_TREND_COLOR = "#10B981"; 

// Helper format tiền tệ an toàn
const formatAmountDisplay = (amount, currencyCode = 'USD') => {
    const roundedAmount = Math.round(Number(amount) || 0);
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0,
        }).format(roundedAmount);
    } catch (e) {
        return `${currencyCode} ${roundedAmount.toLocaleString()}`;
    }
};

// CustomTooltip
const CustomTooltip = ({ active, payload, label, currencyCode, t }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50">
                <p className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-200">{label}</p>
                <p className="text-base font-bold text-green-500">
                    Income: {formatAmountDisplay(payload[0].value, currencyCode)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Income() {
    const { t } = useTranslation(); 
    
    // Lấy context
    const { theme, currencyCode } = useOutletContext(); 
    const isDark = theme === "dark";

    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incomeSummary, setIncomeSummary] = useState([]); 
    
    // UI States
    const [showModal, setShowModal] = useState(false); 
    const [showSummaryModal, setShowSummaryModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [deleteId, setDeleteId] = useState(null);

    // ✅ State cho Modal Chi Tiết (Mobile)
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);

    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(""); 
    
    // Form state
    const [form, setForm] = useState({
        category_name: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        emoji: "💰",
        category_id: "",
        note: "",
        currency_code: currencyCode 
    });

    useEffect(() => {
        setForm(prev => ({ ...prev, currency_code: currencyCode }));
    }, [currencyCode]);

    // KPI Calculation (Memoized)
    const { totalIncome, avgIncome, maxIncome } = useMemo(() => {
        const total = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
        const avg = incomes.length > 0 ? total / incomes.length : 0;
        const max = incomes.length > 0 ? Math.max(...incomes.map(i => Number(i.amount))) : 0;

        return { 
            totalIncome: Math.round(total),
            avgIncome: Math.round(avg),
            maxIncome: Math.round(max)
        };
    }, [incomes]);

    // --- DATA FETCHING (SILENT FAIL) ---
    const fetchData = useCallback(async () => {
        try {
            const [incomesResult, categoriesResult, summaryResult] = await Promise.all([
                getIncomes().catch(err => { console.warn("Incomes fetch fail:", err); return []; }),
                getCategories("income").catch(err => { console.warn("Cat fetch fail:", err); return []; }),
                getIncomeSummary().catch(err => { console.warn("Summary fetch fail:", err); return []; }),
            ]);

            const safeIncomes = Array.isArray(incomesResult) ? incomesResult : [];
            const safeCategories = Array.isArray(categoriesResult) ? categoriesResult : [];
            const safeSummary = Array.isArray(summaryResult) ? summaryResult : [];

            const formattedSummary = safeSummary.map(item => ({
                name: item.category_name,
                value: Number(item.total_amount) || 0,
            })).filter(item => item.value > 0);

            setIncomes(safeIncomes);
            setCategories(safeCategories);
            setIncomeSummary(formattedSummary);

        } catch (err) {
            console.error("Critical Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const handleUpdate = () => {
            console.log("♻️ Income Page: Reloading data...");
            fetchData();
        };
        window.addEventListener("transactionUpdated", handleUpdate);
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

    const handleFormSubmit = async () => {
        if (!form.amount || !form.date) {
            toast.error(t ? t('common.fill_required') : "Please fill required fields."); 
            return;
        }
        
        let finalForm = { ...form, currency_code: currencyCode };
        
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                finalForm.emoji = foundCategory.icon || finalForm.emoji;
            }
        }
        
        const toastId = toast.loading(editId ? "Updating income..." : "Adding income...");

        try {
            let updatedList;
            if (editId) {
                const updated = await updateIncome(editId, finalForm);
                updatedList = incomes.map((i) => (i.id === editId ? updated : i));
                toast.success("Income updated successfully!", { id: toastId });
            } else {
                const created = await createIncome(finalForm);
                updatedList = [...incomes, created];
                toast.success("New income added successfully!", { id: toastId });
            }
            setIncomes(updatedList);
            await fetchData(); 
            handleCloseModal();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save income.", { id: toastId });
        }
    };
    
    const handleEdit = (income) => {
        setEditId(income.id);
        setForm({
            category_name: income.category_name,
            amount: String(Math.round(income.amount)), 
            date: income.date,
            emoji: income.emoji,
            category_id: income.category?.id || '',
            note: income.note || "",
            currency_code: currencyCode 
        });
        setShowModal(true);
    };

    const initiateDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const toastId = toast.loading("Deleting income...");
        try {
            await deleteIncome(deleteId);
            setIncomes(incomes.filter((i) => i.id !== deleteId));
            await fetchData(); 
            toast.success("Income deleted successfully!", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete income.", { id: toastId });
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
            note: "",
            currency_code: currencyCode
        });
    }

    // ✅ Hàm xử lý mở chi tiết (Chỉ active trên Mobile < 768px)
    const handleItemClick = (income) => {
        if (window.innerWidth < 768) {
            setSelectedIncome(income);
            setShowDetailModal(true);
        }
    };

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

    if (loading) {
        return (
            <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
                <div className="text-center">
                    <Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Loading income data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
            <Toaster position="top-center" />

            {/* HEADER */}
            <div id="tour-income-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <TrendingUp size={32} className="text-green-500" /> Income
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track your earnings and revenue.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                    <button
                        onClick={() => setShowSummaryModal(true)}
                        disabled={incomes.length === 0}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${incomes.length === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'}`}
                    >
                        <BarChart3 size={20} /> Summary
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
                                note: "",
                                currency_code: currencyCode
                            });
                            setShowModal(true);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium shadow-lg transform hover:-translate-y-0.5"
                    >
                        <PlusCircle size={20} /> Add Income
                    </button>
                </div>
            </div>

            {/* 💡 --- ROW 1: KPI & LIST --- */}
            <div id="tour-income-list" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* 1. TOTAL INCOME CARD */}
                <div className={`lg:col-span-1 relative overflow-hidden p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.01] ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                     <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-[0.03] pointer-events-none">
                        <DollarSign size={180} className={isDark ? "text-white" : "text-black"} />
                    </div>

                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center mb-4">
                            <DollarSign size={16} className="mr-1 text-green-500" />
                            Total Income
                        </h2>
                        <p className="text-4xl sm:text-5xl font-extrabold text-green-500 tracking-tight leading-tight break-all">
                            {formatAmountDisplay(totalIncome, currencyCode)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6 mt-8 relative z-10">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 font-medium">
                                <Activity size={12} /> Avg. / Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(avgIncome, currencyCode)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 font-medium">
                                <ArrowUpRight size={12} /> Max. Txn
                            </p>
                            <p className="font-bold text-lg text-gray-700 dark:text-gray-200">
                                {formatAmountDisplay(maxIncome, currencyCode)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. RECENT INCOMES LIST (MOBILE OPTIMIZED) */}
                <div className={`lg:col-span-2 p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col h-full ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar size={20} className="text-gray-400" /> Recent Incomes
                        </h2>
                        
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
                        {filteredIncomes.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400 opacity-70">
                                <SearchX size={48} className="mb-2" />
                                <p className="font-medium">No incomes recorded.</p>
                                <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-green-500 hover:underline">Add your first income</button>
                            </div> 
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {filteredIncomes.map((income) => (
                                    <div
                                        key={income.id}
                                        // ✅ Thêm onClick để mở chi tiết trên mobile
                                        onClick={() => handleItemClick(income)}
                                        className={`flex justify-between items-center p-3 sm:p-3.5 rounded-xl border-b last:border-0 border-gray-100 dark:border-gray-700 transition ${isDark ? "bg-gray-700/30 hover:bg-gray-700/60" : "bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200"} cursor-pointer md:cursor-default`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                            {/* Icon nhỏ hơn trên Mobile */}
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-sm ${isDark ? "bg-gray-700" : "bg-white border border-gray-100"}`}>
                                                {income.emoji || income.category?.icon || '💰'}
                                            </div>
                                            <div className="min-w-0">
                                                {/* Font chữ điều chỉnh cho Mobile */}
                                                <p className="font-bold text-sm sm:text-base truncate">{income.category_name}</p>
                                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                    <span className="font-medium bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                                                        {income.date ? format(new Date(income.date), "dd/MM/yyyy") : 'N/A'}
                                                    </span>
                                                    {income.note && (
                                                        <span className="italic truncate max-w-[80px] sm:max-w-[150px] flex items-center gap-1">
                                                            <FileText size={10}/> {income.note}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 ml-2">
                                            {/* Amount nhỏ hơn trên Mobile */}
                                            <p className="font-bold text-green-500 text-sm sm:text-lg whitespace-nowrap">
                                                + {formatAmountDisplay(income.amount, currencyCode)}
                                            </p>
                                            {/* Button nhỏ hơn trên Mobile */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(income); }} // ✅ Chặn sự kiện click lan ra ngoài
                                                    className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                >
                                                    <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); initiateDelete(income.id); }} // ✅ Chặn sự kiện click lan ra ngoài
                                                    className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
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
            
            {/* CHART SECTION */}
            <div id="tour-income-chart" className={`w-full p-6 rounded-2xl shadow-xl mb-8 transition-all duration-300 hover:shadow-2xl ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BarChart3 size={24} className="text-green-500" /> 
                            Income Trend
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Overview of your earnings over time.
                        </p>
                    </div>
                </div>

                <div className="h-[300px] sm:h-[400px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%">
                        {dailyTrendData.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                <BarChart3 size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-lg font-medium">No trend data available</p>
                                <p className="text-sm">Add income to see analytics.</p>
                            </div>
                        ) : (
                            <AreaChart data={dailyTrendData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                                    </linearGradient>
                                </defs>
                                
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} opacity={0.5} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                    tickMargin={15}
                                    tick={{ fontSize: 12, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                /> 
                                <YAxis 
                                    stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                    tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                                    tick={{ fontSize: 12, fontWeight: 500 }}
                                    width={40}
                                    axisLine={false}
                                    tickLine={false}
                                /> 
                                <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#10B981" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorIncome)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }} 
                                    animationDuration={1500} 
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 animate-bounce-short">
                                <Trash2 className="text-red-600 dark:text-red-500" size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Delete Income?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 transition-colors"
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
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={handleCloseModal}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold mb-6 text-center">
                            {editId ? "Edit Income" : "Add Income"}
                        </h3>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-semibold mb-2">Amount</label>
                                    <input
                                        type="number"
                                        name="amount" 
                                        value={form.amount}
                                        onChange={handleFormChange}
                                        placeholder="0"
                                        min="1"
                                        step="1"
                                        className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-semibold mb-2">Date</label>
                                    <input
                                        type="date"
                                        name="date" 
                                        value={form.date}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-2">Category</label>
                                <select
                                    value={form.category_id}
                                    onChange={handleCategoryChange}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}
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
                                <label className="block text-sm font-semibold mb-2">Note (Optional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <textarea
                                        name="note"
                                        value={form.note}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Freelance project..."
                                        rows={3}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none resize-none focus:ring-2 focus:ring-green-500 ${
                                            isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                                        }`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFormSubmit}
                                className="w-full mt-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <DollarSign size={20} />
                                {editId ? "Update Income" : "Save Income"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- MODAL SUMMARY CHART --- */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-3xl p-6 rounded-2xl shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={() => setShowSummaryModal(false)}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <BarChart3 size={28} className="text-purple-500" /> Income Summary (Top 10)
                        </h3>

                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={summaryData.slice(0, 10)} 
                                    layout="vertical" 
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} horizontal={true} vertical={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()}
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
                                        formatter={(value) => [`${formatAmountDisplay(value, currencyCode)}`, "Amount"]}
                                        contentStyle={{ 
                                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                            borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                        }}
                                        cursor={{ fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4 }}
                                    />
                                    <Bar dataKey="value" fill={INCOME_TREND_COLOR} radius={[0, 6, 6, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ DETAIL MODAL (MOBILE ONLY) */}
            {showDetailModal && selectedIncome && (
                <div 
                    className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()} 
                        className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 relative animate-slideUp sm:animate-none ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
                    >
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden"></div>
                        
                        <div className="text-center mt-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                                {selectedIncome.emoji || "💰"}
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Income Details</h3>
                            <h2 className="text-3xl font-extrabold text-green-500">
                                {formatAmountDisplay(selectedIncome.amount, currencyCode)}
                            </h2>
                        </div>

                        <div className={`mt-6 space-y-4 p-4 rounded-xl ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 text-sm font-medium">Category</span>
                                <span className="font-bold">{selectedIncome.category_name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                                <span className="text-gray-500 text-sm font-medium">Date</span>
                                <span className="font-bold">{format(new Date(selectedIncome.date), "dd MMMM yyyy")}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-sm font-medium block mb-1">Note</span>
                                <p className={`text-sm leading-relaxed ${!selectedIncome.note && "italic opacity-50"}`}>
                                    {selectedIncome.note || "No details provided."}
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