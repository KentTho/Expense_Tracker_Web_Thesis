// pages/AdminUserManagement.jsx
// - ✅ REAL DATA: Kết nối KPI thật (Total, 2FA, New Users).
// - ✅ SECURITY: Khóa chỉnh sửa Email (Read-only) để tránh lỗi Auth.
// - ✅ UI/UX: Giao diện Clean, Dark mode chuẩn, Toggle mượt.

import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users, Search, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Loader2, ShieldCheck, UserPlus, X, Save
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  adminGetAllUsers,
  adminDeleteUser,
  adminGetGlobalKPIs,
  adminUpdateUser, 
} from "../services/adminService";

// Helper: Nút gạt (Toggle Switch) chuyên nghiệp
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

// Helper format ngày
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

export default function AdminUserManagement() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States cho Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form state cho Edit
  const [editForm, setEditForm] = useState({ name: "", email: "", is_admin: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, kpisData] = await Promise.all([
        adminGetAllUsers(),
        adminGetGlobalKPIs(),
      ]);
      setUsers(usersData);
      setKpis(kpisData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Logic Edit ---
  const initiateEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ 
        name: user.name || "", 
        email: user.email || "", 
        is_admin: user.is_admin 
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    try {
        // Chỉ gửi những trường cho phép sửa
        const payload = {
            name: editForm.name,
            is_admin: editForm.is_admin
        };
        
        const updatedUser = await adminUpdateUser(selectedUser.id, payload);
        
        // Cập nhật UI ngay lập tức
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        toast.success("User updated successfully!");
        setShowEditModal(false);
    } catch (error) {
        toast.error("Failed to update user.");
    }
  };

  // --- Logic Delete ---
  const initiateDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await adminDeleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      // Cập nhật lại KPI thủ công (giảm user đi 1)
      if (kpis) {
          setKpis(prev => ({...prev, total_users: prev.total_users - 1}));
      }
      
      toast.success("User deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete user.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Filter Users
  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen pb-10 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <Toaster position="top-center" />

      {/* Header */}
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 flex items-center gap-3">
        <Users className="text-blue-500" size={36} />
        User Management
      </h1>

      {/* 1. KPI Cards (Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className={`p-6 rounded-2xl shadow-sm ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><Users size={16} /> Total Users</p>
            <p className="text-4xl font-bold mt-2">{kpis?.total_users ?? "..."}</p>
        </div>

        {/* 2FA Enabled */}
        <div className={`p-6 rounded-2xl shadow-sm ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><ShieldCheck size={16} /> 2FA Enabled</p>
            <p className="text-4xl font-bold mt-2 text-green-500">
                {kpis?.total_2fa_users ?? 0}
            </p> 
        </div>

        {/* New Users (24h) */}
        <div className={`p-6 rounded-2xl shadow-sm ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-2"><UserPlus size={16} /> New Users (24h)</p>
            <p className="text-4xl font-bold mt-2 text-blue-500">
                +{kpis?.new_users_24h ?? 0}
            </p>
        </div>
      </div>

      {/* 2. Search & Tools */}
      <div className={`p-4 rounded-2xl mb-6 shadow-sm ${isDark ? "bg-gray-800" : "bg-white border border-gray-100"}`}>
        <div className="relative w-full max-w-md">
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDark ? "bg-gray-700 border-gray-600 placeholder-gray-400" : "bg-gray-50 border-gray-200"
                }`}
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* 3. User Table */}
      <div className={`rounded-2xl shadow-xl border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="overflow-x-auto">
            <table className="min-w-full text-base">
                <thead>
                    <tr className={`${isDark ? "bg-gray-700/50" : "bg-gray-50"} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <th className="py-4 px-6 text-left text-xs font-bold uppercase text-gray-500">User</th>
                        <th className="py-4 px-6 text-left text-xs font-bold uppercase text-gray-500">Role</th>
                        <th className="py-4 px-6 text-left text-xs font-bold uppercase text-gray-500">2FA</th>
                        <th className="py-4 px-6 text-left text-xs font-bold uppercase text-gray-500">Joined</th>
                        <th className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        <tr><td colSpan="5" className="py-12 text-center"><Loader2 className="animate-spin inline text-blue-500" /></td></tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan="5" className="py-8 text-center text-gray-500">No users found.</td></tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className={`group transition-colors ${isDark ? "hover:bg-gray-700/30" : "hover:bg-blue-50/50"}`}>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                            alt="avatar" 
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{user.name || "No Name"}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
                                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle size={14}/> Enabled</div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-gray-400 text-xs"><XCircle size={14}/> Disabled</div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => initiateEdit(user)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Edit">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => initiateDelete(user)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* ✅ EDIT MODAL (SECURE) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-xl font-bold">Edit User</h3>
                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email (Read-only)</label>
                        <input
                            type="email"
                            value={editForm.email}
                            readOnly
                            className={`w-full px-4 py-2.5 rounded-lg border opacity-60 cursor-not-allowed ${isDark ? "bg-gray-900 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-500"}`}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 italic">Email cannot be changed for security reasons.</p>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                        <div>
                            <label className="block text-sm font-bold text-purple-700 dark:text-purple-300">Administrator Access</label>
                            <p className="text-xs text-purple-600/70 dark:text-purple-400/60">Grant full control over the system.</p>
                        </div>
                        <ToggleSwitch
                            checked={editForm.is_admin}
                            onChange={(val) => setEditForm({...editForm, is_admin: val})}
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto animate-bounce">
                    <AlertTriangle className="text-red-600 dark:text-red-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Account?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">
                    You are about to permanently delete <strong className="text-red-500">{selectedUser?.email}</strong>. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowDeleteModal(false)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}