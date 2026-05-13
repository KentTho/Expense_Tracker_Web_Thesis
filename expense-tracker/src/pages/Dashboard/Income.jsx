import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle,
    BarChart3,
    TrendingUp,
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

// Shared Components
import TransactionEmptyState from "../../components/transactions/TransactionEmptyState";
import ConfirmDeleteModal from "../../components/transactions/ConfirmDeleteModal";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import TransactionList from "../../components/transactions/TransactionList";
import TransactionDetailModal from "../../components/transactions/TransactionDetailModal";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";

const INCOME_TREND_COLOR = "#10B981"; 

const formatAmountDisplay = (amount, currencyCode = 'USD') => {
    const numberAmount = Number(amount) || 0;
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2,
        }).format(numberAmount);
    } catch (e) {
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50">
                <p className="text-sm font-bold mb-1 text-gray-700 dark:text-gray-200">{label}</p>
                <p className="text-base font-bold text-emerald-500">
                    Income: {formatAmountDisplay(payload[0].value, currencyCode)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Income() {
    const { theme, currencyCode } = useOutletContext(); 
    const isDark = theme === "dark";

    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incomeSummary, setIncomeSummary] = useState([]); 
    
    const [showModal, setShowModal] = useState(false); 
    const [showSummaryModal, setShowSummaryModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [deleteId, setDeleteId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);

    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(""); 
    
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

    const { totalIncome, avgIncome, maxIncome } = useMemo(() => {
        const total = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
        const avg = incomes.length > 0 ? total / incomes.length : 0;
        const max = incomes.length > 0 ? Math.max(...incomes.map(i => Number(i.amount))) : 0;

        return { 
            totalIncome: total,
            avgIncome: avg,
            maxIncome: max
        };
    }, [incomes]);

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
            fetchData();
        };
        window.addEventListener("transactionUpdated", handleUpdate);
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

    const handleFormSubmit = async () => {
        const amountNum = Number(form.amount);
        if (!form.amount || isNaN(amountNum) || amountNum <= 0 || !Number.isFinite(amountNum)) {
            toast.error("Amount must be a positive number.");
            return;
        }
        if (!form.date) {
            toast.error("Please select a date.");
            return;
        }
        
        let finalForm = { ...form, amount: amountNum, currency_code: currencyCode };
        
        if (!finalForm.category_id && finalForm.category_name) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === finalForm.category_name.toLowerCase());
            if (foundCategory) {
                finalForm.category_id = foundCategory.id;
                finalForm.emoji = foundCategory.icon || foundCategory.emoji || finalForm.emoji;
            }
        }
        
        const toastId = toast.loading(editId ? "Updating income..." : "Adding income...");

        try {
            if (editId) {
                const updated = await updateIncome(editId, finalForm);
                setIncomes(prev => prev.map((i) => (i.id === editId ? updated : i)));
                toast.success("Income updated successfully!", { id: toastId });
            } else {
                const created = await createIncome(finalForm);
                setIncomes(prev => [...prev, created]);
                toast.success("New income added successfully!", { id: toastId });
            }
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
            amount: String(income.amount), 
            date: income.date,
            emoji: income.emoji,
            category_id: income.category?.id || income.category_id || '',
            note: income.note || "",
            currency_code: currencyCode 
        });
        setShowModal(true);
    };

    const initiateDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDeleteAction = async () => {
        if (!deleteId) return;
        const toastId = toast.loading("Deleting income...");
        try {
            await deleteIncome(deleteId);
            setIncomes(prev => prev.filter((i) => i.id !== deleteId));
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

    if (loading) {
        return <DashboardSkeleton isDark={isDark} />;
    }

    return (
        <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
            <Toaster position="top-center" />

            <div id="tour-income-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-2 tracking-tight">
                        <TrendingUp size={32} className="text-emerald-500" /> Income
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Track your earnings and revenue streams.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                    <button
                        onClick={() => setShowSummaryModal(true)}
                        disabled={incomes.length === 0}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${incomes.length === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500 dark:bg-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/20'}`}
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
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5"
                    >
                        <PlusCircle size={20} /> Add Income
                    </button>
                </div>
            </div>

            <div id="tour-income-list" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className={`lg:col-span-1 relative overflow-hidden p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.01] ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 flex items-center mb-6">
                            Total Revenue
                        </h2>
                        <p className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tight leading-tight break-all">
                            {formatAmountDisplay(totalIncome, currencyCode)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t-2 border-gray-100 dark:border-gray-700 pt-8 mt-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Avg / Txn
                            </p>
                            <p className="font-black text-xl text-gray-700 dark:text-gray-100">
                                {formatAmountDisplay(avgIncome, currencyCode)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                Peak Txn
                            </p>
                            <p className="font-black text-xl text-gray-700 dark:text-gray-100">
                                {formatAmountDisplay(maxIncome, currencyCode)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <TransactionList
                        items={filteredIncomes}
                        type="income"
                        isDark={isDark}
                        currencyCode={currencyCode}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        onEdit={handleEdit}
                        onDelete={initiateDelete}
                        onItemClick={handleItemClick}
                        onAdd={() => setShowModal(true)}
                        formatAmount={(amt) => formatAmountDisplay(amt, currencyCode)}
                    />
                </div>
            </div>
            
            <div id="tour-income-chart" className={`w-full p-8 rounded-[2.5rem] shadow-xl mb-8 transition-all duration-300 hover:shadow-2xl ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                <div className="mb-8">
                    <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
                        <TrendingUp size={24} className="text-emerald-500" /> 
                        Income Trend
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        Visual representation of your cash flow.
                    </p>
                </div>

                <div className="h-[300px] sm:h-[400px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%">
                        {dailyTrendData.length === 0 ? (
                             <TransactionEmptyState
                                isDark={isDark}
                                title="No trend data"
                                description="Add your first income to see analytics here."
                                icon={TrendingUp}
                             />
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
                                    tick={{ fontSize: 11, fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                /> 
                                <YAxis 
                                    stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                    tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                                    tick={{ fontSize: 11, fontWeight: 700 }}
                                    width={45}
                                    axisLine={false}
                                    tickLine={false}
                                /> 
                                <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#10B981" 
                                    strokeWidth={4} 
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

            <ConfirmDeleteModal
                open={showDeleteModal}
                isDark={isDark}
                tone="income"
                onConfirm={confirmDeleteAction}
                onCancel={() => setShowDeleteModal(false)}
                title="Delete Income?"
                description="Are you sure you want to remove this record? This cannot be undone."
            />

            <TransactionFormModal
                open={showModal}
                mode={editId ? "edit" : "create"}
                type="income"
                form={form}
                setForm={setForm}
                categories={categories}
                onSubmit={handleFormSubmit}
                onClose={handleCloseModal}
                isDark={isDark}
                currencyCode={currencyCode}
            />
            
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-3xl p-8 rounded-[2.5rem] shadow-2xl relative ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
                        
                        <button 
                            onClick={() => setShowSummaryModal(false)}
                            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
                        >
                            <BarChart3 size={24} />
                        </button>

                        <h3 className="text-2xl font-black mb-8 flex items-center gap-2 tracking-tight">
                            <BarChart3 size={28} className="text-purple-500" /> Income Breakdown
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
                                        tick={{ fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                                        width={120} 
                                        tick={{ fontSize: 11, fontWeight: 800 }}
                                        axisLine={false}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${formatAmountDisplay(value, currencyCode)}`, "Total"]}
                                        contentStyle={{ 
                                            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", 
                                            borderColor: isDark ? "#4B5563" : "#D1D5DB", 
                                            borderRadius: "20px",
                                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                                            border: "none"
                                        }}
                                        cursor={{ fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4 }}
                                    />
                                    <Bar dataKey="value" fill={INCOME_TREND_COLOR} radius={[0, 10, 10, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            <TransactionDetailModal
                open={showDetailModal}
                item={selectedIncome}
                type="income"
                isDark={isDark}
                currencyCode={currencyCode}
                onClose={() => setShowDetailModal(false)}
                formatAmount={(amt) => formatAmountDisplay(amt, currencyCode)}
            />
        </div>
    );
}
