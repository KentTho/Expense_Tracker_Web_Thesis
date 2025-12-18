// pages/AdminUserManagement.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users, Search, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Loader2, 
  ShieldCheck, UserPlus, X, Save, SearchX, Mail, Calendar, Shield, LifeBuoy, Zap, AlertOctagon
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  adminGetAllUsers,
  adminDeleteUser,
  adminGetGlobalKPIs,
  adminUpdateUser, 
  adminGetAuditLogs 
} from "../services/adminService";
import { sendChatMessage } from "../services/chatService"; 

// --- 1. COMPONENT MODAL CỨU HỘ MỚI (CHUYÊN NGHIỆP) ---
const RescueConfirmationModal = ({ isOpen, onClose, onConfirm, user, isDark }) => {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop làm mờ nền */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn" 
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border transform transition-all animate-scaleIn overflow-hidden
                ${isDark ? "bg-[#111827] border-red-500/30" : "bg-white border-red-100"}`}>
                
                {/* Header Gradient Đỏ */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-md shadow-lg animate-pulse">
                        <LifeBuoy size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Xác Nhận Cứu Hộ</h3>
                    <p className="text-red-100 text-xs mt-1 font-mono">EMERGENCY RECOVERY PROTOCOL</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className={`text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        Bạn đang thực hiện thao tác <span className="font-bold text-red-500">CỰC KỲ QUAN TRỌNG</span> đối với tài khoản:
                    </p>
                    
                    <div className={`p-3 rounded-lg border text-center font-mono text-sm font-bold flex items-center justify-center gap-2
                        ${isDark ? "bg-gray-800 border-gray-700 text-blue-400" : "bg-gray-50 border-gray-200 text-blue-600"}`}>
                        <Mail size={14}/> {user.email}
                    </div>

                    <div className={`text-xs p-4 rounded-xl border-l-4 space-y-2
                        ${isDark ? "bg-red-900/10 border-red-500 text-gray-300" : "bg-red-50 border-red-500 text-gray-700"}`}>
                        <p className="font-bold flex items-center gap-2 text-red-500">
                            <AlertOctagon size={14}/> HỆ THỐNG SẼ THỰC HIỆN:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 opacity-90">
                            <li>Vô hiệu hóa xác thực 2 lớp (2FA).</li>
                            <li>Đá văng Hacker/Thiết bị lạ ra khỏi hệ thống.</li>
                            <li>Gửi email thông báo cho người dùng.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`p-4 border-t flex gap-3 ${isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                    <button 
                        onClick={onClose}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors
                            ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"}`}
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Zap size={16} fill="white" /> THỰC THI NGAY
                    </button>
                </div>
            </div>
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <div 
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 ${
      checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <div
      className={`absolute left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
        checked ? "translate-x-6" : "translate-x-0"
      }`}
    />
  </div>
);

// Helper format date safe
const formatDate = (dateString) => {
    try {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return "Invalid Date";
    }
};

export default function AdminUserManagement() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [sosEmails, setSosEmails] = useState(new Set()); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 🔥 STATE MỚI CHO MODAL CỨU HỘ
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [userToRescue, setUserToRescue] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", is_admin: false });

  // --- FETCH DATA (Kết hợp User + Scan Audit Log) ---
  const fetchData = useCallback(async () => {
    try {
      const [usersData, kpisData, logsData] = await Promise.all([
        adminGetAllUsers().catch(err => { console.warn("Users fetch fail:", err); return []; }),
        adminGetGlobalKPIs().catch(err => { console.warn("KPI fetch fail:", err); return null; }),
        adminGetAuditLogs(100).catch(err => { console.warn("Log fetch fail:", err); return []; })
      ]);

      const safeUsers = Array.isArray(usersData) 
          ? usersData 
          : (usersData?.users && Array.isArray(usersData.users) ? usersData.users : []);
      
      setUsers(safeUsers);
      setKpis(kpisData || { total_users: 0, total_2fa_users: 0, new_users_24h: 0 });

      if (Array.isArray(logsData)) {
          const sosSet = new Set();
          logsData.forEach(log => {
              if (log.action === "SOS_REQUEST" && log.status === "PENDING") {
                  sosSet.add(log.actor_email);
              }
          });
          setSosEmails(sosSet);
      }

    } catch (error) {
      console.error("Critical User Mgmt Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 🆘 1. MỞ MODAL CỨU HỘ ---
  const initiateRescue = (user) => {
      setUserToRescue(user);
      setShowRescueModal(true);
  };

  // --- 🆘 2. THỰC THI CỨU HỘ (KHI BẤM NÚT TRONG MODAL) ---
  const confirmRescueAction = async () => {
      if (!userToRescue) return;
      
      setShowRescueModal(false); // Đóng modal ngay để hiển thị loading toast
      const toastId = toast.loading("Sending Rescue Command via AI Agent...");
      
      try {
          const res = await sendChatMessage(`Reset bảo mật cho user ${userToRescue.email}`);
          
          if (res && res.reply) {
              toast.success("✅ Rescue command executed successfully!", { id: toastId });
              setTimeout(fetchData, 1000); 
          } else {
              throw new Error("No response from AI Agent");
          }
      } catch (error) {
          console.error(error);
          toast.error("Failed to rescue user. Agent busy.", { id: toastId });
      } finally {
          setUserToRescue(null);
      }
  };

  // --- HANDLERS (Edit/Delete) ---
  const initiateEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ name: user.name || "", email: user.email || "", is_admin: user.is_admin });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    const toastId = toast.loading("Updating user...");
    try {
        const payload = { name: editForm.name, is_admin: editForm.is_admin };
        const updatedUser = await adminUpdateUser(selectedUser.id, payload);
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        toast.success("User updated successfully!", { id: toastId });
        setShowEditModal(false);
    } catch (error) {
        toast.error("Failed to update user.", { id: toastId });
    }
  };

  const initiateDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const toastId = toast.loading("Deleting user...");
    try {
      await adminDeleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      if (kpis) setKpis(prev => ({...prev, total_users: Math.max(0, (prev?.total_users || 1) - 1)}));
      toast.success("User deleted successfully.", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete user.", { id: toastId });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const filteredUsers = useMemo(() => {
      let result = users.filter((user) =>
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
      
      result.sort((a, b) => {
          const aSos = sosEmails.has(a.email) ? 1 : 0;
          const bSos = sosEmails.has(b.email) ? 1 : 0;
          return bSos - aSos;
      });
      
      return result;
  }, [users, searchTerm, sosEmails]);

  if (loading) {
      return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      );
  }

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDark ? "text-gray-100 bg-gray-900" : "text-gray-900 bg-gray-50"}`}>
      <Toaster position="top-right" />

      {/* 🔥 RENDER MODAL CỨU HỘ */}
      <RescueConfirmationModal 
          isOpen={showRescueModal}
          onClose={() => setShowRescueModal(false)}
          onConfirm={confirmRescueAction}
          user={userToRescue}
          isDark={isDark}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-3">
                <Users className="text-blue-500" size={28} />
                User Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                Manage accounts, roles, and permissions.
            </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { label: "Total Users", val: kpis?.total_users ?? 0, icon: Users, color: "text-gray-900 dark:text-white" },
                { label: "2FA Enabled", val: kpis?.total_2fa_users ?? 0, icon: ShieldCheck, color: "text-green-500" },
                { label: "New (24h)", val: `+${kpis?.new_users_24h ?? 0}`, icon: UserPlus, color: "text-blue-500" }
            ].map((kpi, idx) => (
                <div key={idx} className={`p-5 rounded-2xl shadow-sm border transition-all ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <kpi.icon size={16} /> {kpi.label}
                    </p>
                    <p className={`text-3xl font-extrabold mt-2 ${kpi.color}`}>{kpi.val}</p>
                </div>
            ))}
        </div>

        {/* Search Bar */}
        <div className={`p-2 rounded-xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="relative w-full">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-lg bg-transparent outline-none transition-all placeholder-gray-400 text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                />
            </div>
        </div>

        {/* CONTENT AREA */}
        <div>
            {filteredUsers.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                        <SearchX size={48} className="mb-2" />
                        <p className="font-medium">No users found.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* MOBILE VIEW */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredUsers.map((user) => {
                            const isSOS = sosEmails.has(user.email);
                            return (
                                <div key={user.id} className={`p-4 rounded-2xl shadow-sm border flex flex-col gap-4 relative overflow-hidden transition-all
                                    ${isSOS 
                                        ? (isDark ? "bg-red-900/20 border-red-500/50 shadow-red-500/20" : "bg-red-50 border-red-300 shadow-red-100") 
                                        : (isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}`}>
                                    
                                    {isSOS && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm animate-pulse flex items-center gap-1">
                                            <AlertTriangle size={10} /> SOS PENDING
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img 
                                                src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                                alt="avatar" 
                                                className={`w-12 h-12 rounded-full border-2 shadow-sm ${isSOS ? "border-red-500" : "border-white dark:border-gray-600"}`}
                                            />
                                            {isSOS && <span className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border border-white"><Zap size={10} fill="white"/></span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-base truncate ${isSOS ? "text-red-500" : (isDark ? "text-white" : "text-gray-900")}`}>
                                                {user.name || "Unknown"}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                <Mail size={10} /> {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={`grid grid-cols-2 gap-2 p-3 rounded-xl text-xs font-medium border
                                        ${isDark ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase text-gray-500 flex items-center gap-1"><Shield size={10}/> Status</span>
                                            {user.is_2fa_enabled ? (
                                                <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12}/> Active 2FA</span>
                                            ) : (
                                                <span className="text-gray-400 flex items-center gap-1"><XCircle size={12}/> Inactive</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="text-[10px] uppercase text-gray-500 flex items-center justify-end gap-1">Joined <Calendar size={10}/></span>
                                            <span>{formatDate(user.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-1">
                                        <button 
                                            onClick={() => initiateRescue(user)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-lg
                                                ${isSOS 
                                                    ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-red-500/30 animate-pulse" 
                                                    : (isDark ? "bg-gray-700 hover:bg-orange-900/30 text-orange-400" : "bg-orange-50 hover:bg-orange-100 text-orange-600")}`}
                                        >
                                            <LifeBuoy size={16} /> Rescue
                                        </button>
                                        <button onClick={() => initiateEdit(user)} className={`p-2.5 rounded-xl border transition-all active:scale-95 ${isDark ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-gray-100 border-gray-200 text-gray-700"}`}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => initiateDelete(user)} className={`p-2.5 rounded-xl border border-red-500/30 bg-red-600 text-white transition-all active:scale-95`}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP VIEW */}
                    <div className="hidden md:block rounded-2xl shadow-xl border overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className={`${isDark ? "bg-gray-700/50" : "bg-gray-50"} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                        <th className="py-4 px-6 text-left font-bold uppercase text-xs text-gray-500 tracking-wider">User</th>
                                        <th className="py-4 px-6 text-left font-bold uppercase text-xs text-gray-500 tracking-wider">Role</th>
                                        <th className="py-4 px-6 text-left font-bold uppercase text-xs text-gray-500 tracking-wider">Status</th>
                                        <th className="py-4 px-6 text-left font-bold uppercase text-xs text-gray-500 tracking-wider">Joined</th>
                                        <th className="py-4 px-6 text-right font-bold uppercase text-xs text-gray-500 tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredUsers.map((user) => {
                                        const isSOS = sosEmails.has(user.email);
                                        return (
                                            <tr key={user.id} className={`group transition-colors 
                                                ${isSOS 
                                                    ? (isDark ? "bg-red-900/10 hover:bg-red-900/20" : "bg-red-50 hover:bg-red-100") 
                                                    : (isDark ? "hover:bg-gray-700/30" : "hover:bg-blue-50/30")}`}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img 
                                                                src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                                                alt="avatar" 
                                                                className={`w-10 h-10 rounded-full border-2 flex-shrink-0 ${isSOS ? "border-red-500 animate-pulse" : "border-transparent"}`}
                                                            />
                                                            {isSOS && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`font-bold text-sm truncate max-w-[150px] ${isSOS ? "text-red-600" : ""}`}>
                                                                    {user.name || "Unknown User"}
                                                                </p>
                                                                {isSOS && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">SOS</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        user.is_admin 
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    }`}>
                                                        {user.is_admin ? "Admin" : "Member"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {user.is_2fa_enabled ? (
                                                        <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold"><CheckCircle size={14}/> Active</div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs"><XCircle size={14}/> Inactive</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => initiateRescue(user)}
                                                            className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold
                                                                ${isSOS 
                                                                    ? "bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 animate-pulse" 
                                                                    : (isDark ? "bg-gray-700 text-orange-400 hover:bg-gray-600" : "bg-orange-50 text-orange-600 hover:bg-orange-100")}`}
                                                            title="Emergency Rescue"
                                                        >
                                                            <LifeBuoy size={16} /> {isSOS ? "RESCUE NOW" : "Rescue"}
                                                        </button>
                                                        <button onClick={() => initiateEdit(user)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"><Edit size={18} /></button>
                                                        <button onClick={() => initiateDelete(user)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filteredUsers.length > 0 && (
                            <div className={`px-6 py-3 border-t text-xs font-medium ${isDark ? "border-gray-800 text-gray-500 bg-gray-800/30" : "border-gray-200 text-gray-400 bg-gray-50"}`}>
                                Showing {filteredUsers.length} users
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* Modal EDIT & DELETE */}
        {showEditModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-xl font-bold">Edit User Details</h3>
                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email (Read-only)</label>
                            <input type="email" value={editForm.email} readOnly className={`w-full px-4 py-2.5 rounded-lg border opacity-60 cursor-not-allowed ${isDark ? "bg-gray-900 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-500"}`} />
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                            <div>
                                <label className="block text-sm font-bold text-purple-700 dark:text-purple-300">Administrator Access</label>
                                <p className="text-xs text-purple-600/70 dark:text-purple-400/60">Full system control.</p>
                            </div>
                            <ToggleSwitch checked={editForm.is_admin} onChange={(val) => setEditForm({...editForm, is_admin: val})} />
                        </div>
                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setShowEditModal(false)} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100 text-gray-600"}`}>Cancel</button>
                            <button onClick={handleUpdate} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2"><Save size={16} /> Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto animate-bounce-short">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete User?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">Are you sure you want to delete <strong className="text-red-500">{selectedUser?.email}</strong>? This cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30">Delete</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}