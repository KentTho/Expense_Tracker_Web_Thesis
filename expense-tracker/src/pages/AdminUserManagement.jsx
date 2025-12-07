// pages/AdminUserManagement.jsx

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

// Helper: Nút gạt (Toggle Switch)
const ToggleSwitch = ({ checked, onChange, name, disabled }) => (
  <div 
    onClick={() => !disabled && onChange({ target: { name, checked: !checked } })}
    className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
      checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <div
      className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
        checked ? "translate-x-7" : "translate-x-0"
      }`}
    />
  </div>
);

// Helper format ngày
const formatDate = (dateString) => {
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
  const [currentUser, setCurrentUser] = useState(null);
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
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Logic cho Edit Modal ---
  const initiateEdit = (user) => {
    setCurrentUser(user);
    setEditForm({ name: user.name, email: user.email, is_admin: user.is_admin });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setEditForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async () => {
    if (!currentUser) return;
    try {
        // Chỉ gửi name và is_admin, không gửi email (vì email không được sửa)
        const payload = {
            name: editForm.name,
            is_admin: editForm.is_admin
        };
        
        const updatedUser = await adminUpdateUser(currentUser.id, payload);
        
        // Cập nhật lại list user trong state
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        toast.success(`User updated successfully!`);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setShowEditModal(false);
        setCurrentUser(null);
    }
  };

  // --- Logic cho Delete Modal ---
  const initiateDelete = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    try {
      await adminDeleteUser(currentUser.id);
      setUsers(users.filter(u => u.id !== currentUser.id));
      toast.success(`User deleted.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setShowDeleteModal(false);
      setCurrentUser(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      <Toaster position="top-center" />

      {/* Header */}
      <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
        <Users className="text-blue-500" size={36} />
        User Management
      </h1>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><Users size={16} /> Total Users</p>
            <p className="text-4xl font-bold mt-2">{kpis?.total_users ?? "..."}</p>
        </div>
        <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><ShieldCheck size={16} /> 2FA Enabled</p>
            <p className="text-4xl font-bold mt-2 text-green-500">{kpis?.total_2fa_users ?? 0}</p> 
        </div>
        <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border"}`}>
            <p className="text-sm font-semibold text-gray-400 flex items-center gap-2"><UserPlus size={16} /> New Users (24h)</p>
            <p className="text-4xl font-bold mt-2 text-blue-500">+{kpis?.new_users_24h ?? 0}</p>
        </div>
      </div>

      {/* 2. Control Panel */}
      <div className={`p-4 rounded-2xl mb-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="relative w-full max-w-md">
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                }`}
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* 3. User List Table */}
      <div className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
        {loading ? (
            <div className="h-64 flex justify-center items-center"><Loader2 className="animate-spin" /></div>
        ) : (
            <table className="min-w-full text-base border-collapse">
                <thead>
                    <tr className={`${isDark ? "bg-gray-700/50" : "bg-gray-100"} text-left border-b-2 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                        <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500">User</th>
                        <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500">Status</th>
                        <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500">2FA</th>
                        <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500">Joined Date</th>
                        <th className="py-3 px-4 text-sm font-semibold uppercase text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className={`transition-colors ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                            <td className="py-4 px-4 flex items-center gap-3">
                                <img 
                                    src={user.profile_image || "https://i.pravatar.cc/40"} 
                                    alt="avatar" 
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-bold">{user.name || "Unnamed User"}</p>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <span className={`py-1 px-2.5 rounded-full text-xs font-bold ${
                                    user.is_admin 
                                    ? "bg-purple-500/10 text-purple-400" 
                                    : "bg-green-500/10 text-green-400"
                                }`}>
                                    {user.is_admin ? "Admin" : "Active"}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                {user.is_2fa_enabled ? (
                                    <CheckCircle size={18} className="text-green-500" />
                                ) : (
                                    <XCircle size={18} className="text-gray-500" />
                                )}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-400">{formatDate(user.created_at)}</td>
                            <td className="py-4 px-4">
                                <button onClick={() => initiateEdit(user)} className="p-2 text-gray-400 hover:text-blue-500" title="Edit Role">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => initiateDelete(user)} className="p-2 text-gray-400 hover:text-red-500" title="Delete User">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* ✅ MODAL SỬA USER (ĐÃ KHÓA EMAIL) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit User Permissions</h3>
                    <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleFormChange}
                            className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email (Read-only)</label>
                        <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            readOnly // 🔒 KHÓA KHÔNG CHO SỬA
                            className={`w-full px-3 py-2 rounded-lg border opacity-60 cursor-not-allowed ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}
                        />
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                        <div>
                            <label className="block text-sm font-bold">Administrator Access</label>
                            <p className="text-xs text-gray-500">Grant full control over the system.</p>
                        </div>
                        <ToggleSwitch
                            name="is_admin"
                            checked={editForm.is_admin}
                            onChange={(e) => handleFormChange({ target: { name: 'is_admin', checked: e.target.checked, type: 'checkbox' } })}
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <Save size={16} className="inline mr-2" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Modal (Giữ nguyên) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Delete User?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                        Are you sure you want to delete <strong className={isDark ? "text-white" : "text-black"}>{currentUser?.email}</strong>? 
                        This action is irreversible.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white"
                        >
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}