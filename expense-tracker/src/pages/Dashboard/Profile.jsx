// Profile.jsx
// - ✅ FIXED: Sửa lỗi 'QuotaExceededError' khi lưu profile.
// - RETAINED: Bố cục Dashboard 2 cột.
// - RETAINED: Chỉnh sửa nội tuyến (In-line Editing).
// - RETAINED: Hiển thị (Currency, 2FA Status).

import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  User, Mail, Calendar, Edit3, X, Save, Upload, Lock, 
  VenusAndMars, 
  Cake, 
  Wallet, ShieldCheck 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/profileService";

// Helper Component: InfoInput (Giữ nguyên)
const InfoInput = ({ isEditing, label, name, value, onChange, type = "text", children }) => {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";

  if (!isEditing) {
    return children;
  }
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-gray-500">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full p-2 mt-1 rounded-lg border outline-none text-base ${
          isDark
            ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            : "bg-gray-100 border-gray-300 focus:border-blue-500"
        }`}
      />
    </div>
  );
};

// Helper Component: InfoSelect (Giữ nguyên)
const InfoSelect = ({ isEditing, label, name, value, onChange, children, options }) => {
    const { theme } = useOutletContext();
    const isDark = theme === "dark";
  
    if (!isEditing) {
      return children;
    }
  
    return (
      <div>
        <label className="text-xs font-semibold uppercase text-gray-500">{label}</label>
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          className={`w-full p-2 mt-1 rounded-lg border outline-none text-base ${
            isDark
              ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
              : "bg-gray-100 border-gray-300 focus:border-blue-500"
          }`}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
};


export default function Profile() {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate(); 

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch profile từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error("You need to log in again!");
          navigate("/login");
          return;
        }
        const data = await getUserProfile();
        setUser(data);
        setForm(data);

        // ✅ FIX (PHÒNG NGỪA): Cập nhật localStorage ngay khi tải
        const userForStorage = { ...data };
        delete userForStorage.profile_image;
        localStorage.setItem("user", JSON.stringify(userForStorage));

      } catch (err) {
        console.error("❌ Profile fetch error:", err);
        toast.error("Could not load user information!");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // handleChange (Giữ nguyên)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Upload ảnh (Giữ nguyên)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((prev) => ({ ...prev, profile_image: reader.result }));
    reader.readAsDataURL(file);
  };

  // Hủy edit (Giữ nguyên)
  const handleCancel = () => {
    setForm(user); // Reset form về trạng thái user ban đầu
    setIsEditing(false);
  };

  // ==========================================================
  // 🧩 Lưu cập nhật (ĐÃ SỬA LỖI QUOTAEXCEEDED)
  // ==========================================================
  // Lưu cập nhật
  const handleSave = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Please log in again!");
        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        profile_image: form.profile_image, // Vẫn gửi ảnh Base64 lên BE
        gender: form.gender,
        birthday: form.birthday,
      };

      const updated = await updateUserProfile(payload); // BE trả về user (có ảnh Base64)

      // ✅ FIX: TẠO BẢN SAO SẠCH TRƯỚC KHI LƯU LOCALSTORAGE
      const userForStorage = { ...updated };
      delete userForStorage.profile_image; // Xóa trường ảnh nặng

      localStorage.setItem("user", JSON.stringify(userForStorage)); // Lưu bản sạch
      
      setUser(updated); // Cập nhật React state (vẫn giữ ảnh để hiển thị)
      setIsEditing(false);
      toast.success("Profile updated successfully 🎉");
    } catch (err) {
      console.error("❌ Update error:", err);
      // Lỗi của bạn (QuotaExceededError) sẽ bị bắt ở đây
      toast.error(err.message || "Update failed, please try again!");
    }
  };
  // ==========================================================

  if (loading)
    return (
      <div className={`flex justify-center items-center h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className="text-gray-500">Loading user profile...</p>
      </div>
    );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        
        {/* HEADER VÀ NÚT ĐIỀU KHIỂN (Giữ nguyên) */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <User className="text-blue-500" size={36} />
            My Profile
          </h1>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-all duration-300"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all duration-300"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all duration-300"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* --- BỐ CỤC DASHBOARD 2 CỘT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT 1: PROFILE CARD (Giữ nguyên) */}
          <div className={`lg:col-span-1 p-6 rounded-2xl shadow-xl flex flex-col items-center text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
            
            {/* Avatar & Upload */}
            <div className="relative mb-4">
              <img
                src={isEditing ? form.profile_image : user?.profile_image || "https://i.pravatar.cc/150"}
                alt="avatar"
                className="w-36 h-36 rounded-full border-4 border-blue-500 shadow-lg object-cover"
              />
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 transition shadow-md"
                >
                  <Upload size={20} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Name (Inline Edit) */}
            <InfoInput
              isEditing={isEditing}
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            >
              <h2 className="text-2xl font-bold mt-2">
                {user?.name || "Your Name"}
              </h2>
            </InfoInput>
            
            {/* Email (Inline Edit) */}
            <InfoInput
              isEditing={isEditing}
              label="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {user?.email || "your.email@example.com"}
              </p>
            </InfoInput>

            {/* Joined Date (Không edit) */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-6">
              <Calendar size={16} />
              <span>
                Joined on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          {/* CỘT 2: INFO & SETTINGS (Giữ nguyên) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Personal Details Card */}
            <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-6">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Gender (Inline Edit) */}
                <InfoSelect
                  isEditing={isEditing}
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "Select Gender" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                >
                  <div className="flex items-center gap-3">
                    <VenusAndMars size={20} className="text-pink-500" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Gender</p>
                      <p className="font-medium">{user?.gender || "Not set"}</p>
                    </div>
                  </div>
                </InfoSelect>
                
                {/* Birthday (Inline Edit) */}
                <InfoInput
                  isEditing={isEditing}
                  label="Birthday"
                  name="birthday"
                  value={form.birthday}
                  onChange={handleChange}
                  type="date"
                >
                  <div className="flex items-center gap-3">
                    <Cake size={20} className="text-yellow-500" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Birthday</p>
                      <p className="font-medium">
                        {user?.birthday ? new Date(user.birthday).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                  </div>
                </InfoInput>
              </div>
            </div>

            {/* 2. App Preferences Card (Giữ nguyên) */}
            <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-6">App Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Currency */}
                <div className="flex items-center gap-3">
                  <Wallet size={20} className="text-purple-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Default Currency</p>
                    <p className="font-medium">
                      {user?.currency_code || "USD"} ({user?.currency_symbol || "$"})
                    </p>
                  </div>
                </div>

                {/* 2FA Status */}
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className={user?.is_2fa_enabled ? "text-green-500" : "text-gray-500"} />
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">2FA Security</p>
                    <p className={`font-medium ${user?.is_2fa_enabled ? "text-green-500" : "text-gray-500"}`}>
                      {user?.is_2fa_enabled ? "Active" : "Not Active"}
                    </p>
                  </div>
                  <button onClick={() => navigate('/settings/security')} className="ml-auto text-sm text-blue-500 hover:underline">
                    Manage
                  </button>
                </div>
              </div>
            </div>
            
            {/* 3. Danger Zone (Giữ nguyên) */}
            <div className={`p-6 rounded-2xl shadow-xl border-2 ${isDark ? "bg-red-900/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
                <h3 className="text-xl font-semibold text-red-500 mb-4">Danger Zone</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                           It's a good idea to use a strong, unique password.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/change-password")}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-all"
                    >
                        <Lock size={18} />
                        Change
                    </button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}