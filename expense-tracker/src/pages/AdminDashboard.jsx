// pages/AdminDashboard.jsx
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
    adminGetAllUsers 
} from "../services/adminService";

const formatAmountDisplay = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(Number(amount));
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
};

const PIE_COLORS = ["#10B981", "#EF4444"];

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
        adminGetGlobalUserGrowth(30),
        adminGetAllUsers(0, 5), 
      ]);
      setKpis(kpisData);
      setUserGrowth(growthData.map(d => ({...d, date: formatDate(d.date)})));
      setRecentUsers(usersData);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const financialBreakdownData = useMemo(() => {
    if (!kpis) return [];
    return [
        { name: 'Income', value: kpis.total_income },
        { name: 'Expense', value: kpis.total_expense }
    ];
  }, [kpis]);


  if (loading) {
    return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );
  }

  return (
    <div className={`min-h-screen pb-10 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <Toaster position="top-center" />

      {/* Header - Responsive Flex */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" size={32} />
            <span className="truncate">Admin Dashboard</span>
        </h1>
      </div>

      {/* 1. KPI Cards (RESPONSIVE GRID) */}
      {/* Mobile: 1 cột | Tablet: 2 cột | Desktop: 4 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Users */}
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
            <div className="absolute right-0 top-0 p-4 opacity-5"><Users size={80} /></div>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><Users size={16} /> Total Users</p>
            <p className="text-3xl sm:text-4xl font-bold mt-2">{kpis?.total_users ?? "..."}</p>
        </div>
        {/* Total Income */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp size={80} /></div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">Total Income</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2 truncate">{formatAmountDisplay(kpis?.total_income)}</p>
        </div>
        {/* Total Expense */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown size={80} /></div>
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">Total Expense</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-2 truncate">{formatAmountDisplay(kpis?.total_expense)}</p>
        </div>
        {/* Net Balance */}
        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
            <div className="absolute right-0 top-0 p-4 opacity-5"><DollarSign size={80} /></div>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><DollarSign size={16} /> Net Balance</p>
            <p className={`text-2xl sm:text-3xl font-bold mt-2 truncate ${kpis?.net_balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {formatAmountDisplay(kpis?.net_balance)}
            </p>
        </div>
      </div>

      {/* 2. Charts (RESPONSIVE GRID) */}
      {/* Mobile: Stack dọc (cols-1) | Desktop: 2/3 và 1/3 (lg:grid-cols-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* User Growth Chart (2/3) */}
        <div className={`lg:col-span-2 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-6">
                <BarChart className="text-blue-500" size={24} />
                New User Growth
            </h2>
            {/* Fix height cứng -> responsive height */}
            <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowth}>
                        <defs>
                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#E5E7EB"} vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 10}} width={30} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? "#1F2937" : "#FFF", borderRadius: "12px", border: "none" }} />
                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fill="url(#colorGrowth)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Financial Snapshot (1/3) */}
        <div className={`lg:col-span-1 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-6">
                <PieIcon className="text-purple-500" size={24} />
                Financial Split
            </h2>
            <div className="h-[250px] sm:h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={financialBreakdownData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {financialBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={isDark ? "#1F2937" : "#FFF"} strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val) => formatAmountDisplay(val)} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-[-20px]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-gray-500">Inc</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs font-medium text-gray-500">Exp</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Recent Signups (RESPONSIVE TABLE) */}
      <div className={`p-4 sm:p-6 rounded-2xl shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <UserPlus className="text-orange-500" size={24} />
                Recent Signups
            </h2>
            <Link to="/admin/users" className="w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                View All Users
            </Link>
        </div>
        
        {/* List Items */}
        <div className="space-y-2">
            {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                    <div 
                        key={user.id} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl transition-colors border ${isDark ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <img 
                                src={user.profile_image || "https://i.pravatar.cc/40"} 
                                alt="avatar" 
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate max-w-[150px] sm:max-w-xs">{user.name || "Unnamed"}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-xs">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:block sm:text-right w-full sm:w-auto">
                            <p className="text-xs font-medium text-gray-400">
                                {new Date(user.created_at).toLocaleDateString()}
                            </p>
                            {user.is_admin && (
                                <span className="sm:ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                                    ADMIN
                                </span>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center py-8 text-gray-500">No new users found.</p>
            )}
        </div>
      </div>

    </div>
  );
}