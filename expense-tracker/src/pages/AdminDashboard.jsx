// pages/AdminDashboard.jsx (TẠO FILE MỚI)
import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { 
    LayoutDashboard, Users, TrendingUp, TrendingDown, DollarSign, Loader2,
    BarChart, PieChart as PieIcon, UserPlus
} from "lucide-react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, 
    XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { toast, Toaster } from "react-hot-toast";
import { 
    adminGetGlobalKPIs, 
    adminGetGlobalUserGrowth,
    adminGetAllUsers // Tái sử dụng để lấy user mới
} from "../services/adminService";

// Helper Format Tiền (Giống Home.jsx)
const formatAmountDisplay = (amount, decimals = 0) => {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) return 'N/A';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD', // Admin dashboard dùng USD chung
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(numberAmount);
    } catch (error) {
        return `USD ${numberAmount.toLocaleString()}`;
    }
};

// Helper Format Ngày (Giống UserManagement)
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: 'short', day: 'numeric'
    });
};

const PIE_COLORS = ["#10B981", "#EF4444"]; // Xanh lá, Đỏ

export default function AdminDashboard() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [kpis, setKpis] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpisData, growthData, usersData] = await Promise.all([
        adminGetGlobalKPIs(),
        adminGetGlobalUserGrowth(30), // Lấy 30 ngày
        adminGetAllUsers(), // Lấy user để tìm 5 người mới nhất
      ]);
      setKpis(kpisData);
      setUserGrowth(growthData.map(d => ({...d, date: formatDate(d.date)})));
      setRecentUsers(usersData.slice(0, 5)); // Lấy 5 user mới nhất
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dữ liệu cho biểu đồ Donut (từ KPI)
  const financialBreakdownData = useMemo(() => {
    if (!kpis) return [];
    return [
        { name: 'Total Income', value: kpis.total_income },
        { name: 'Total Expense', value: kpis.total_expense }
    ];
  }, [kpis]);


  if (loading) {
    return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="text-center">
                <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                <p className="text-gray-500 font-medium">Loading Admin Dashboard...</p>
            </div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <Toaster position="top-center" />

      {/* Header */}
      <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
        <LayoutDashboard className="text-blue-500" size={36} />
        Admin Dashboard
      </h1>

      {/* 1. KPI Cards (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
            <div className="absolute right-0 top-0 p-4 opacity-5"><Users size={100} /></div>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><Users size={16} /> Total Users</p>
            <p className="text-4xl font-bold mt-2">{kpis?.total_users ?? "..."}</p>
        </div>
        {/* Total Income */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={100} /></div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">Total Income</p>
            <p className="text-4xl font-extrabold mt-2">{formatAmountDisplay(kpis?.total_income, 0)}</p>
        </div>
        {/* Total Expense */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown size={100} /></div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">Total Expense</p>
            <p className="text-4xl font-extrabold mt-2">{formatAmountDisplay(kpis?.total_expense, 0)}</p>
        </div>
        {/* Net Balance */}
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
            <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={100} /></div>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><DollarSign size={16} /> System Net Balance</p>
            <p className={`text-4xl font-bold mt-2 ${kpis?.net_balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{formatAmountDisplay(kpis?.net_balance, 0)}</p>
        </div>
      </div>

      {/* 2. Charts (Smart Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Growth Chart (2/3) */}
        <div className={`lg:col-span-2 p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <BarChart className="text-blue-500" size={24} />
                New User Growth (Last 30 Days)
            </h2>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowth}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12}} allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#FFF", borderRadius: "12px", border: "none" }}
                            formatter={(val) => [val, "New Users"]}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fill="url(#colorGrowth)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Financial Snapshot (1/3) */}
        <div className={`lg:col-span-1 p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <PieIcon className="text-purple-500" size={24} />
                Financial Snapshot
            </h2>
            <div className="flex-1 min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={financialBreakdownData}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {financialBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={isDark ? "#1F2937" : "#FFF"} strokeWidth={3} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val) => formatAmountDisplay(val, 0)} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Chú thích (Legend) tùy chỉnh */}
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-500">Income</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-gray-500">Expense</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Recent Signups */}
      <div className={`p-6 rounded-2xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="text-orange-500" size={24} />
                Recent Signups
            </h2>
            <Link to="/admin/users" className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                View All Users
            </Link>
        </div>
        <div className="space-y-1">
            {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                    <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}
                    >
                        <div className="flex items-center gap-4">
                            <img 
                                src={user.profile_image || "https://i.pravatar.cc/40"} 
                                alt="avatar" 
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-bold text-base">{user.name || "Unnamed"}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-400">
                                {new Date(user.created_at).toLocaleDateString()}
                            </p>
                            {user.is_admin && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                                    ADMIN
                                </span>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>No new users found recently.</p>
                </div>
            )}
        </div>
      </div>

    </div>
  );
}