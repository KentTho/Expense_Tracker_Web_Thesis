import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
    PlusCircle, TrendingDown, DollarSign, BarChart3, LineChart,
    Activity, ArrowUpRight, Calendar, X 
} from "lucide-react";
import {
    ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import {
    createExpense, getExpenses, updateExpense, deleteExpense, getExpenseDailyTrend, getExpenseBreakdown, 
} from "../../services/expenseService"; 
import { getCategories } from "../../services/categoryService";
import { format } from "date-fns";

// Shared Components
import TransactionEmptyState from "../../components/transactions/TransactionEmptyState";
import ConfirmDeleteModal from "../../components/transactions/ConfirmDeleteModal";
import TransactionFormModal from "../../components/transactions/TransactionFormModal";
import TransactionList from "../../components/transactions/TransactionList";
import TransactionDetailModal from "../../components/transactions/TransactionDetailModal";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";

// Helper Định dạng tiền tệ an toàn
const formatAmountDisplay = (amount, currencyCode = 'USD') => {
    const numberAmount = Number(amount) || 0; 
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numberAmount);
    } catch {
        return `${currencyCode} ${numberAmount.toLocaleString()}`;
    }
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label, currencyCode }) => {
    const isBreakdown = payload?.[0]?.dataKey === 'total_amount' && payload?.[0]?.payload?.category_name;

    if (active && payload && payload.length) {
        let value = payload[0].value;
        let name = payload[0].name;

        if (isBreakdown) {
            name = payload[0].payload.category_name;
        }

        return (
            <div className="p-3 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm z-50">
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
    const { theme, currencyCode } = useOutletContext();
    const isDark = theme === "dark";

    const [expenseData, setExpenseData] = useState({ items: [] });
    const [categories, setCategories] = useState([]);
    
    // UI States
    const [showModal, setShowModal] = useState(false); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const [filterDate, setFilterDate] = useState(""); 

    // Chart States
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
        currency_code: currencyCode 
    });

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

    const filteredExpenses = useMemo(() => {
        if (!filterDate) return expenseData.items || [];
        return (expenseData.items || []).filter(item => item.date === filterDate);
    }, [expenseData.items, filterDate]);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async () => {
        try {
            const [expData, categoryData, trendData, breakdown] = await Promise.all([
                getExpenses().catch(err => { console.warn("Expense fetch fail:", err); return { items: [] }; }),            
                getCategories('expense').catch(err => { console.warn("Cat fetch fail:", err); return []; }), 
                getExpenseDailyTrend(chartDays).catch(err => { console.warn("Trend fetch fail:", err); return []; }), 
                getExpenseBreakdown().catch(err => { console.warn("Breakdown fetch fail:", err); return []; })     
            ]);

            setExpenseData(expData && expData.items ? expData : { items: [] });
            setCategories(Array.isArray(categoryData) ? categoryData : []);
            setDailyTrend(Array.isArray(trendData) ? trendData : []);
            setBreakdownData(Array.isArray(breakdown) ? breakdown : []);

        } catch (error) {
            console.error("Critical Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [chartDays]);

    useEffect(() => {
        fetchData();
        const handleUpdate = () => {
            fetchData(); 
        };
        window.addEventListener("transactionUpdated", handleUpdate);
        return () => window.removeEventListener("transactionUpdated", handleUpdate);
    }, [fetchData]);

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
            category_id: String(expense.category?.id || expense.category_id || ""),
            category_name: String(expense.category?.name || expense.category_name || ""),
            amount: String(Math.round(expense.amount ?? 0)),
            date: expense.date || new Date().toISOString().split('T')[0],
            emoji: expense.emoji || expense.category?.emoji || "💸",
            note: expense.note || "",
            currency_code: currencyCode
        });
        setShowModal(true); 
    };

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
                finalForm.emoji = foundCategory.emoji || foundCategory.icon || finalForm.emoji; 
            }
        }

        const toastId = toast.loading(editId ? "Updating expense..." : "Saving expense...");
        
        try {
            if (editId) {
                await updateExpense(editId, finalForm); 
                toast.success("Expense updated successfully!", { id: toastId });
            } else {
                await createExpense(finalForm); 
                toast.success("Expense saved successfully!", { id: toastId });
            }
            setShowModal(false);
            setEditId(null);
            resetForm();
            fetchData(); 
        } catch {
            toast.error("Failed to save expense. Please try again.", { id: toastId });
        }
    };

    const initiateDelete = (id) => { setDeleteId(id); setShowDeleteModal(true); };
    
    const confirmDelete = async () => {
        if (!deleteId) return;
        const toastId = toast.loading("Deleting expense...");
        try {
            await deleteExpense(deleteId);
            toast.success("Expense deleted successfully!", { id: toastId });
            fetchData();
        } catch {
            toast.error("Failed to delete expense.", { id: toastId });
        } finally {
            setShowDeleteModal(false); setDeleteId(null);
        }
    };

    const handleItemClick = (expense) => {
        if (window.innerWidth < 768) {
            setSelectedExpense(expense);
            setShowDetailModal(true);
        }
    };

    // --- CHART UI ---
    const chartTitle = chartView === 'trend' ? `Daily Expense Trend (${chartDays} Days)` : 'Expense Breakdown';
    
    const TrendChart = (
        <RechartsLineChart data={dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis
                dataKey="date" height={50} tickMargin={10}
                tickFormatter={(tick) => tick.substring(5)}
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
            />
            <YAxis
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                width={40}
            />
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{stroke: '#EF4444', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Line type="monotone" dataKey="total_amount" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
        </RechartsLineChart>
    );

    const SummaryChart = (
        <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis dataKey="category_name" stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} height={50} axisLine={false} tickLine={false} />
            <YAxis 
                tickFormatter={(value) => formatAmountDisplay(value, currencyCode).replace(currencyCode, "").trim()} 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                width={40}
            />
            <Tooltip content={<CustomTooltip currencyCode={currencyCode} />} cursor={{fill: isDark ? '#374151' : '#F3F4F6', opacity: 0.4}} />
            <Bar dataKey="total_amount" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={60} />
        </BarChart>
    );

    if (loading) {
        return <DashboardSkeleton isDark={isDark} />;
    }

    return (
        <div className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
            <Toaster position="top-center" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-2 tracking-tight">
                        <TrendingDown className="text-red-500" size={32} />
                        Expenses
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Manage your daily spending.</p>
                </div>
                
                <button 
                    onClick={() => {
                        setEditId(null);
                        resetForm();
                        setShowModal(true);
                    }} 
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 transition-all transform hover:-translate-y-0.5"
                >
                    <PlusCircle size={20} className="mr-2" /> Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className={`lg:col-span-1 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.01] ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 flex items-center mb-6">
                            Total Expense
                        </h2>
                        <p className="text-4xl sm:text-5xl font-black text-red-500 tracking-tight leading-tight break-all">
                            {formatAmountDisplay(totalExpense, currencyCode)}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t-2 border-gray-100 dark:border-gray-700 pt-8 mt-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Avg. / Txn</p>
                            <p className="font-black text-xl text-gray-700 dark:text-gray-100">{formatAmountDisplay(avgExpense, currencyCode)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Max. Txn</p>
                            <p className="font-black text-xl text-gray-700 dark:text-gray-100">{formatAmountDisplay(maxExpense, currencyCode)}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <TransactionList
                        items={filteredExpenses}
                        type="expense"
                        isDark={isDark}
                        currencyCode={currencyCode}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        onEdit={handleEdit}
                        onDelete={initiateDelete}
                        onItemClick={handleItemClick}
                        onAdd={() => setShowModal(true)}
                        formatAmount={(amt) => formatAmountDisplay(amt, currencyCode)}
                        emptyTitle="No expenses found"
                        emptyDescription="Start tracking your finances by adding your first expense."
                        emptyActionLabel="Add Expense"
                    />
                </div>
            </div>

            <div className={`w-full p-8 rounded-[2.5rem] shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-xl font-black flex items-center gap-2 tracking-tight">
                        <BarChart3 size={24} className="text-red-500"/>
                        {chartTitle}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {chartView === 'trend' && (
                            <select 
                                value={chartDays} 
                                onChange={(e) => setChartDays(Number(e.target.value))} 
                                className={`text-sm py-2 px-3 rounded-xl border-2 outline-none focus:ring-4 focus:ring-red-500/10 ${isDark ? "bg-gray-700 border-gray-600 focus:border-red-500" : "bg-gray-50 border-gray-200 focus:border-red-500"}`} 
                                disabled={loading}
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>
                        )}
                        <button 
                            onClick={() => setChartView(chartView === 'trend' ? 'summary' : 'trend')} 
                            className={`flex items-center text-sm px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                        >
                            {chartView === 'trend' ? <BarChart3 size={16} className="mr-2" /> : <LineChart size={16} className="mr-2" />} 
                            Switch View
                        </button>
                    </div>
                </div>
                
                <div className="h-[300px] sm:h-[400px] w-full"> 
                    <ResponsiveContainer width="100%" height="100%"> 
                        {(chartView === 'trend' && dailyTrend.length === 0) || (chartView === 'summary' && breakdownData.length === 0) ? (
                            <TransactionEmptyState
                                isDark={isDark}
                                title="No analytics data available"
                                description="Start adding expenses to see trends."
                                icon={BarChart3}
                            />
                        ) : (
                            chartView === 'trend' ? TrendChart : SummaryChart
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            <TransactionFormModal
                open={showModal}
                mode={editId ? "edit" : "create"}
                type="expense"
                form={form}
                setForm={setForm}
                categories={categories}
                onSubmit={handleFormSubmit}
                onClose={() => { setShowModal(false); setEditId(null); resetForm(); }}
                isDark={isDark}
                currencyCode={currencyCode}
            />

            <ConfirmDeleteModal
                open={showDeleteModal}
                tone="expense"
                isDark={isDark}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteModal(false); setDeleteId(null); }}
                title="Delete Expense?"
                description="This action cannot be undone. Are you sure you want to remove this record?"
            />

            <TransactionDetailModal
                open={showDetailModal}
                item={selectedExpense}
                type="expense"
                isDark={isDark}
                currencyCode={currencyCode}
                onClose={() => setShowDetailModal(false)}
                formatAmount={(amt) => formatAmountDisplay(amt, currencyCode)}
            />
        </div>
    );
}