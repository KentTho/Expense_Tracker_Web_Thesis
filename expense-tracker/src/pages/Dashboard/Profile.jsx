// pages/Profile.jsx

import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import { 
  User, Mail, Edit3, X, Save, Upload, Lock, 
  VenusAndMars, Cake, Wallet, ShieldCheck, 
  AlertTriangle, CheckCircle, AlertCircle, Loader2
} from "lucide-react"; 
import toast, { Toaster } from "react-hot-toast";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/profileService";
import { requestEmailVerification, changeUserEmail } from "../../services/authService"; 

// Helper Component: Input Field
const InfoInput = ({ isEditing, label, name, value, onChange, type = "text", children }) => {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  
  if (!isEditing) return children; 
  
  return (
    <div>
      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${
          isDark 
            ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500" 
            : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-400"
        }`}
      />
    </div>
  );
};

// Helper Component: Select Field
const InfoSelect = ({ isEditing, label, name, value, onChange, options, children }) => {
  const { theme } = useOutletContext();
  const isDark = theme === "dark";
  
  if (!isEditing) return children;
  
  return (
    <div>
      <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">{label}</label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${
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
  const [verifyingEmail, setVerifyingEmail] = useState(false); 

  // --- DATA FETCHING (SILENT FAIL) ---
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Silent redirect, no toast needed for initial load
        return; 
      }

      try {
        // Cố gắng lấy từ DB Backend
        const data = await getUserProfile();
        
        if (data) {
            setUser(data);
            setForm(data);
            
            // Cache lại để dùng sau
            const userForStorage = { ...data };
            delete userForStorage.profile_image; // Tránh lưu ảnh base64 nặng vào localStorage
            localStorage.setItem("user", JSON.stringify(userForStorage));
        }
      } catch (err) {
        // 🔥 SILENT FAIL: Nếu lỗi (do chưa sync kịp), dùng dữ liệu từ Firebase Auth làm Fallback
        console.warn("Profile sync delay or error (using fallback):", err);
        
        const fallbackUser = {
            name: currentUser.displayName || "New User",
            email: currentUser.email,
            profile_image: currentUser.photoURL,
            is_email_verified: currentUser.emailVerified,
            is_admin: false,
            currency_code: "USD", // Default
            created_at: currentUser.metadata.creationTime
        };
        
        setUser(fallbackUser);
        setForm(fallbackUser);
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
    const toastId = toast.loading("Saving changes...");
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Session expired.", { id: toastId });
        return;
      }

      // 1. Check Email Change
      if (form.email !== user.email) {
          try {
              await changeUserEmail(form.email);
              toast.success(`Confirmation sent to ${form.email}. Check inbox!`, { id: toastId, duration: 5000 });
          } catch (emailErr) {
              toast.error(emailErr.message, { id: toastId });
              return; 
          }
      }

      // 2. Update DB
      const payload = {
        name: form.name,
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
      toast.success("Profile updated successfully!", { id: toastId });
      
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update profile.", { id: toastId });
    }
  };

  const handleCancel = () => {
    setForm(user);
    setIsEditing(false);
  };

  if (loading) {
      return (
        <div className={`min-h-screen flex justify-center items-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
            <div className="text-center">
                <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                <p className="text-gray-500 font-medium">Loading profile...</p>
            </div>
        </div>
      );
  }

  // Fallback nếu user null (trường hợp cực hiếm)
  if (!user) return null; 

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Toaster position="top-center" />
      
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <User className="text-blue-500" size={32} /> My Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                Manage your account settings and preferences.
            </p>
          </div>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <Edit3 size={18} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={handleCancel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-semibold transition-all"
              >
                <X size={18} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5"
              >
                <Save size={18} /> Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
           {/* CỘT 1: IDENTITY CARD */}
           <div className="lg:col-span-1">
            <div className={`p-6 rounded-3xl shadow-xl flex flex-col items-center text-center relative overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
              {/* Background gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
              
              <div className="relative mt-16 mb-4 group">
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 shadow-2xl">
                  <img 
                    src={form.profile_image || user.profile_image || "https://i.pravatar.cc/300"} 
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
              
              <h2 className="text-2xl font-bold truncate max-w-full px-2">{user.name || "User"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-full px-2">{user.email}</p>
              
              {/* STATUS BADGE */}
              <div className="mt-3">
                 {user.is_email_verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                        <CheckCircle size={12}/> Verified Account
                    </span>
                 ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                        <AlertCircle size={12}/> Unverified
                    </span>
                 )}
              </div>

              <div className="mt-6 w-full pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Role</p>
                    <p className={`font-semibold ${user.is_admin ? 'text-purple-500' : 'text-blue-500'}`}>
                        {user.is_admin ? "Admin" : "Member"}
                    </p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Joined</p>
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
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User size={20} className="text-blue-500"/> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <InfoInput isEditing={isEditing} label="Full Name" name="name" value={form.name} onChange={handleChange}>
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                         <User size={20} />
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Full Name</p>
                         <p className="font-semibold text-lg truncate">{user.name}</p>
                      </div>
                   </div>
                </InfoInput>

                {/* Email Address */}
                <InfoInput 
                    isEditing={isEditing} 
                    label="Email Address" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    type="email"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
                            <Mail size={20} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Email Address</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <p className="font-semibold text-lg truncate">{user.email}</p>
                                
                                {user.is_email_verified ? (
                                    <span className="hidden sm:inline-flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 dark:border-green-800/50">
                                        <CheckCircle size={10} /> Verified
                                    </span>
                                ) : (
                                    <button 
                                        onClick={handleVerifyEmail}
                                        disabled={verifyingEmail || isEditing}
                                        className="w-fit flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50 hover:bg-red-100 transition disabled:opacity-50"
                                    >
                                        {verifyingEmail ? "Sending..." : "Verify Now"}
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
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                            <VenusAndMars size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Gender</p>
                            <p className="font-semibold text-lg">{user.gender || "Not set"}</p>
                        </div>
                    </div>
                </InfoSelect>

                {/* Birthday */}
                <InfoInput isEditing={isEditing} label="Birthday" name="birthday" value={form.birthday} onChange={handleChange} type="date">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                            <Cake size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Birthday</p>
                            <p className="font-semibold text-lg">
                                {user.birthday ? new Date(user.birthday).toLocaleDateString() : "Not set"}
                            </p>
                        </div>
                    </div>
                </InfoInput>
              </div>
            </div>

            {/* Financial Settings */}
            <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
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
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"}`}>
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Currency</p>
                            <p className="font-bold text-xl">{user.currency_code || "USD"}</p>
                        </div>
                    </div>
                </InfoSelect>

                {/* Monthly Budget */}
                <InfoInput
                  isEditing={isEditing}
                  label="Monthly Budget"
                  name="monthly_budget"
                  value={form.monthly_budget}
                  onChange={handleChange}
                  type="number"
                >
                   <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-500 tracking-wide">Monthly Limit</p>
                      <p className="font-bold text-xl">
                        {user?.monthly_budget > 0
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency_code || 'USD' }).format(user.monthly_budget) 
                            : "No limit"}
                      </p>
                    </div>
                  </div>
                </InfoInput>

                {/* 2FA Status */}
                <div className="md:col-span-2 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? "bg-purple-900/20" : "bg-purple-50"}`}>
                         <ShieldCheck className="text-purple-500" size={24} />
                      </div>
                      <div>
                         <p className="text-sm font-bold">Two-Factor Authentication</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_2fa_enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                         {user.is_2fa_enabled ? "Active" : "Disabled"}
                      </span>
                      <button onClick={() => navigate('/security')} className="text-sm font-semibold text-blue-500 hover:underline">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Danger Zone */}
            <div className={`p-6 rounded-2xl shadow-xl border-2 border-dashed ${isDark ? "bg-red-900/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
                <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18}/> Danger Zone
                </h3>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">Change Password</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           Regularly updating your password improves security.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/change-password")}
                        className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md active:scale-95"
                    >
                        <Lock size={16} />
                        Change Password
                    </button>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}