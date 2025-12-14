// pages/AdminUserManagement.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users, Search, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Loader2, ShieldCheck, UserPlus, X, Save, SearchX
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import {
  adminGetAllUsers,
  adminDeleteUser,
  adminGetGlobalKPIs,
  adminUpdateUser, 
} from "../services/adminService";

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form State
  const [editForm, setEditForm] = useState({ name: "", email: "", is_admin: false });

  // --- FETCH DATA (SILENT FAIL) ---
  const fetchData = useCallback(async () => {
    // setLoading(true); // Chỉ set loading lần đầu
    try {
      const [usersData, kpisData] = await Promise.all([
        adminGetAllUsers().catch(err => { console.warn("Users fetch fail:", err); return { users: [] }; }),
        adminGetGlobalKPIs().catch(err => { console.warn("KPI fetch fail:", err); return null; }),
      ]);

      // Xử lý dữ liệu an toàn
      const safeUsers = usersData?.users && Array.isArray(usersData.users) ? usersData.users : (Array.isArray(usersData) ? usersData : []);
      setUsers(safeUsers);
      
      setKpis(kpisData || { total_users: 0, total_2fa_users: 0, new_users_24h: 0 });

    } catch (error) {
      console.error("Critical User Mgmt Error:", error);
      // Không toast error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- EDIT HANDLERS ---
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
    const toastId = toast.loading("Updating user...");
    try {
        const payload = {
            name: editForm.name,
            is_admin: editForm.is_admin
        };
        
        const updatedUser = await adminUpdateUser(selectedUser.id, payload);
        
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        toast.success("User updated successfully!", { id: toastId });
        setShowEditModal(false);
    } catch (error) {
        toast.error("Failed to update user.", { id: toastId });
    }
  };

  // --- DELETE HANDLERS ---
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
      
      if (kpis) {
          setKpis(prev => ({...prev, total_users: Math.max(0, (prev?.total_users || 1) - 1)}));
      }
      
      toast.success("User deleted successfully.", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete user.", { id: toastId });
    } finally {
      setShowDeleteModal(false);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) {
      return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      );
  }

  return (
    <div className={`min-h-screen pb-10 transition-colors duration-300 ${isDark ? "text-gray-100 bg-gray-900" : "text-gray-900 bg-gray-50"}`}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                    <Users className="text-blue-500" size={32} />
                    User Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                    Manage accounts, roles, and permissions.
                </p>
            </div>
        </div>

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Users */}
            <div className={`p-6 rounded-2xl shadow-sm border transition-transform hover:scale-[1.02] ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2"><Users size={16} /> Total Users</p>
                <p className="text-4xl font-extrabold mt-2">{kpis?.total_users ?? 0}</p>
            </div>

            {/* 2FA Enabled */}
            <div className={`p-6 rounded-2xl shadow-sm border transition-transform hover:scale-[1.02] ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2"><ShieldCheck size={16} /> 2FA Enabled</p>
                <p className="text-4xl font-extrabold mt-2 text-green-500">
                    {kpis?.total_2fa_users ?? 0}
                </p> 
            </div>

            {/* New Users */}
            <div className={`p-6 rounded-2xl shadow-sm border transition-transform hover:scale-[1.02] ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2"><UserPlus size={16} /> New (24h)</p>
                <p className="text-4xl font-extrabold mt-2 text-blue-500">
                    +{kpis?.new_users_24h ?? 0}
                </p>
            </div>
        </div>

        {/* 2. Search Bar */}
        <div className={`p-2 rounded-2xl shadow-sm border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="relative w-full">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none transition-all placeholder-gray-400 ${
                        isDark ? "text-white" : "text-gray-900"
                    }`}
                />
            </div>
        </div>

        {/* 3. User Table */}
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
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
                        {filteredUsers.length === 0 ? (
                            // --- EMPTY STATE UI ---
                            <tr>
                                <td colSpan="5" className="py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400 opacity-70">
                                        <SearchX size={48} className="mb-2" />
                                        <p className="font-medium text-base">No users found.</p>
                                        <p className="text-xs mt-1">Try a different search term.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className={`group transition-colors ${isDark ? "hover:bg-gray-700/30" : "hover:bg-blue-50/30"}`}>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <img 
                                            src={user.profile_image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                                            alt="avatar" 
                                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate max-w-[150px]">{user.name || "Unknown User"}</p>
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
            
            {/* Footer info */}
            {!loading && filteredUsers.length > 0 && (
                <div className={`px-6 py-3 border-t text-xs font-medium ${isDark ? "border-gray-800 text-gray-500 bg-gray-800/30" : "border-gray-200 text-gray-400 bg-gray-50"}`}>
                    Showing {filteredUsers.length} users
                </div>
            )}
        </div>
      </div>

      {/* EDIT MODAL */}
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
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                        <div>
                            <label className="block text-sm font-bold text-purple-700 dark:text-purple-300">Administrator Access</label>
                            <p className="text-xs text-purple-600/70 dark:text-purple-400/60">Full system control.</p>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto animate-bounce-short">
                    <AlertTriangle className="text-red-600 dark:text-red-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete User?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">
                    Are you sure you want to delete <strong className="text-red-500">{selectedUser?.email}</strong>? This cannot be undone.
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
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}