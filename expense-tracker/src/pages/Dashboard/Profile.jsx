// pages/Profile.jsx

import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  User, Mail, Calendar, Edit3, X, Save, Upload, Lock, 
  VenusAndMars, Cake, Wallet, ShieldCheck, 
  AlertTriangle, CheckCircle, AlertCircle 
} from "lucide-react"; // ✅ Thêm icon CheckCircle, AlertCircle
import toast, { Toaster } from "react-hot-toast";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/profileService";
// ✅ Import hàm gửi mail
import { requestEmailVerification, changeUserEmail } from "../../services/authService"; 

// Helper Component: Input Field (Giữ nguyên logic)
const InfoInput = ({ isEditing, label, name, value, onChange, type = "text", children }) => {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  
  // Nếu không phải chế độ sửa -> Hiển thị children (View Mode)
  if (!isEditing) return children; 
  
  // Nếu là chế độ sửa -> Hiển thị Input
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-gray-500">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none transition-all ${
          isDark 
            ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500" 
            : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-400"
        }`}
      />
    </div>
  );
};

// Helper Component: Select Field (Giữ nguyên)
const InfoSelect = ({ isEditing, label, name, value, onChange, options, children }) => {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  if (!isEditing) return children;
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-gray-500">{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none transition-all ${
          isDark 
            ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500" 
            : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-400"
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
  const { theme, refreshUserProfile } = useOutletContext(); 
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingEmail, setVerifyingEmail] = useState(false); // State loading cho nút Verify

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error("Session expired. Please login again.");
          return;
        }
        const data = await getUserProfile();
        setUser(data);
        setForm(data);
        
        // Lưu cache
        const userForStorage = { ...data };
        delete userForStorage.profile_image;
        localStorage.setItem("user", JSON.stringify(userForStorage));
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        toast.error("Image is too large (max 2MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, profile_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Xử lý gửi email xác thực
  const handleVerifyEmail = async () => {
      setVerifyingEmail(true);
      try {
          await requestEmailVerification();
          toast.success("Verification email sent! Check your inbox.");
      } catch (error) {
          toast.error(error.message || "Failed to send verification email.");
      } finally {
          setVerifyingEmail(false);
      }
  };

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Session expired.");
        return;
      }

      // 1. KIỂM TRA XEM EMAIL CÓ THAY ĐỔI KHÔNG?
      if (form.email !== user.email) {
          try {
              await changeUserEmail(form.email);
              toast.success(`Confirmation sent to ${form.email}. Please check inbox to verify update!`, { duration: 5000 });
              // Lưu ý: Email trên giao diện sẽ chưa đổi ngay lập tức cho đến khi user bấm link trong mail
          } catch (emailErr) {
              toast.error(emailErr.message);
              return; // Dừng lại nếu lỗi email
          }
      }

      // 2. Cập nhật các thông tin khác xuống DB
      const payload = {
        name: form.name,
        // Không gửi email xuống DB Backend cập nhật thủ công, 
        // hãy để cơ chế Sync của AuthRoute tự xử lý khi user đăng nhập lại bằng email mới.
        // Tuy nhiên gửi xuống cũng không sao, backend sẽ update.
        email: form.email, 
        profile_image: form.profile_image,
        gender: form.gender,
        birthday: form.birthday,
        currency_code: form.currency_code,
        monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : 0,
      };

      const updated = await updateUserProfile(payload);

      if (refreshUserProfile) await refreshUserProfile();

      const userForStorage = { ...updated };
      delete userForStorage.profile_image;
      localStorage.setItem("user", JSON.stringify(userForStorage));
      
      setUser(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update profile.");
    }
  };

  const handleCancel = () => {
    setForm(user);
    setIsEditing(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-6 sm:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <User className="text-blue-500" size={32} /> My Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences.</p>
          </div>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Edit3 size={18} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-semibold transition-all"
              >
                <X size={18} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5"
              >
                <Save size={18} /> Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
           {/* CỘT 1: IDENTITY CARD */}
           <div className="lg:col-span-1">
            <div className={`p-6 rounded-3xl shadow-xl flex flex-col items-center text-center relative overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <div className="relative mt-16 mb-4 group">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 shadow-2xl">
                  <img 
                    src={form.profile_image || "https://i.pravatar.cc/300"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                    <Upload size={24} className="mr-2"/> Change
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <h2 className="text-2xl font-bold">{user.name || "User"}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              
              {/* STATUS BADGE TRÊN CARD */}
              <div className="mt-2">
                 {user.is_email_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        <CheckCircle size={12}/> Verified Account
                    </span>
                 ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                        <AlertCircle size={12}/> Unverified
                    </span>
                 )}
              </div>

              <div className="mt-6 w-full pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Role</p>
                    <p className={`font-semibold ${user.is_admin ? 'text-purple-500' : 'text-blue-500'}`}>
                        {user.is_admin ? "Admin" : "Member"}
                    </p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Joined</p>
                    <p className="font-semibold">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* CỘT 2: CHI TIẾT & CÀI ĐẶT */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Details */}
            <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
               <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <User size={20} className="text-blue-500"/> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <InfoInput isEditing={isEditing} label="Full Name" name="name" value={form.name} onChange={handleChange}>
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                         <User size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-semibold uppercase text-gray-500">Full Name</p>
                         <p className="font-medium text-lg">{user.name}</p>
                      </div>
                   </div>
                </InfoInput>

                {/* ✅ EMAIL SECTION (Đã sửa lỗi cú pháp) */}
                <InfoInput 
                    isEditing={isEditing} 
                    label="Email Address" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    type="email"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
                            <Mail size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase text-gray-500">Email Address</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="font-medium text-lg">{user.email}</p>
                                
                                {/* Logic hiển thị Badges */}
                                {user.is_email_verified ? (
                                    <span className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-200 dark:border-green-800">
                                        <CheckCircle size={12} /> Verified
                                    </span>
                                ) : (
                                    <button 
                                        onClick={handleVerifyEmail}
                                        disabled={verifyingEmail || isEditing} // Disable khi đang sửa profile
                                        className="flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-3 py-1 rounded border border-red-200 dark:border-red-800 hover:bg-red-200 transition disabled:opacity-50"
                                    >
                                        {verifyingEmail ? "Sending..." : <>Unverified <span className="underline ml-1">Verify Now</span></>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </InfoInput>

                {/* Gender */}
                <InfoSelect 
                    isEditing={isEditing} 
                    label="Gender" 
                    name="gender" 
                    value={form.gender} 
                    onChange={handleChange}
                    options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" }
                    ]}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                            <VenusAndMars size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">Gender</p>
                            <p className="font-medium">{user.gender || "Not set"}</p>
                        </div>
                    </div>
                </InfoSelect>

                {/* Birthday */}
                <InfoInput isEditing={isEditing} label="Birthday" name="birthday" value={form.birthday} onChange={handleChange} type="date">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                            <Cake size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">Birthday</p>
                            <p className="font-medium">{user.birthday ? new Date(user.birthday).toLocaleDateString() : "Not set"}</p>
                        </div>
                    </div>
                </InfoInput>
              </div>
            </div>

            {/* Financial Settings */}
            <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-green-500"/> Financial Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Default Currency */}
                <InfoSelect 
                    isEditing={isEditing} 
                    label="Default Currency" 
                    name="currency_code" 
                    value={form.currency_code} 
                    onChange={handleChange}
                    options={[
                        { value: "USD", label: "USD ($)" },
                        { value: "VND", label: "VND (₫)" }
                    ]}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"}`}>
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">Default Currency</p>
                            <p className="font-bold text-lg">{user.currency_code || "USD"}</p>
                        </div>
                    </div>
                </InfoSelect>

                {/* Monthly Budget */}
                <InfoInput
                  isEditing={isEditing}
                  label="Monthly Budget Limit"
                  name="monthly_budget"
                  value={form.monthly_budget}
                  onChange={handleChange}
                  type="number"
                >
                   <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Monthly Budget</p>
                      <p className="font-medium">
                        {user?.monthly_budget > 0
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency_code || 'USD' }).format(user.monthly_budget) 
                            : "No limit set"}
                      </p>
                    </div>
                  </div>
                </InfoInput>

                {/* 2FA Status */}
                <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-purple-500" size={24} />
                      <div>
                         <p className="text-sm font-bold">2-Factor Authentication</p>
                         <p className="text-xs text-gray-500">Extra layer of security.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_2fa_enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                         {user.is_2fa_enabled ? "Active" : "Disabled"}
                      </span>
                      <button onClick={() => navigate('/settings/security')} className="text-sm text-blue-500 hover:underline">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Danger Zone */}
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
      </main>
    </div>
  );
}