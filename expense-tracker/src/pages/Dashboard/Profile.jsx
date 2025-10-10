import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom"; // ✅ thêm useNavigate
import { User, Mail, Calendar, Edit3, X, Save, Upload, Lock, VenusAndMars, Cake } from "lucide-react"; // ✅ thêm icon Lock
import toast, { Toaster } from "react-hot-toast";
import {
  getUserProfile,
  updateUserProfile,
} from "../../services/profileService"; // ✅ Gọi API thật

export default function Profile() {
  const { theme } = useOutletContext();
  const navigate = useNavigate(); // ✅ khởi tạo điều hướng

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch profile thật từ backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error("Bạn cần đăng nhập lại!");
          return;
        }
        const data = await getUserProfile();
        setUser(data);
        setForm(data);
      } catch (err) {
        console.error("❌ Lỗi lấy profile:", err);
        toast.error("Không thể tải thông tin người dùng!");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ✅ Thay đổi giá trị input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Upload ảnh mới
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setForm((prev) => ({ ...prev, profile_image: reader.result }));
    reader.readAsDataURL(file);
  };

  // ✅ Lưu cập nhật
  const handleSave = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập lại!");
        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        profile_image: form.profile_image,
        gender: form.gender,
        birthday: form.birthday,
      };

      const updated = await updateUserProfile(payload);
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công 🎉");
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      toast.error("Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Đang tải thông tin...
      </div>
    );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#111827] text-gray-100"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        {/* --- Profile Card --- */}
        <div
          className={`rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 transition-all ${
            theme === "dark" ? "bg-[#1e293b]" : "bg-white"
          }`}
        >
          <img
            src={user?.profile_image || "https://i.pravatar.cc/100"}
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-md object-cover"
          />
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <User size={20} className="text-blue-500" />
                {user?.name || "Chưa có tên"}
              </h2>
            </div>

            {/* 📧 Email */}
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-300">
              <Mail size={18} className="text-green-400" />
              <span>{user?.email || "No email"}</span>
            </div>

            {/* 🚻 Gender */}
            {user?.gender && (
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-300">
                <VenusAndMars size={18} className="text-pink-400" />
                <span>Gender:</span>
                <span className="font-medium text-gray-200">{user.gender}</span>
              </div>
            )}

            {/* 🎂 Birthday */}
            {user?.birthday && (
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-300">
                <Cake size={18} className="text-yellow-400" />
                <span>Birthday:</span>
                <span className="font-medium text-gray-200">
                  {new Date(user.birthday).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* 📅 Joined date */}
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-300">
              <Calendar size={18} className="text-purple-400" />
              <span>
                Joined on{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>


            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>

              {/* ✅ Nút mới: Change Password */}
              <button
                onClick={() => navigate("/change-password")}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all duration-300"
              >
                <Lock size={18} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        
      </div>

      {/* --- Edit Modal --- */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setIsEditing(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl p-6 w-full max-w-md shadow-xl transition-all ${
              theme === "dark" ? "bg-[#1f2937]" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <img
                  src={form.profile_image || "https://i.pravatar.cc/100"}
                  alt="preview"
                  className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover mb-3"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition"
                >
                  <Upload size={16} />
                  Upload Image
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100 border-gray-300 focus:ring-2 focus:ring-blue-400"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"    
                  value={form.email || ""}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100 border-gray-300 focus:ring-2 focus:ring-blue-400"
                  }`}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender || ""}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100 border-gray-300 focus:ring-2 focus:ring-blue-400"
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium mb-1">Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={form.birthday || ""}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100 border-gray-300 focus:ring-2 focus:ring-blue-400"
                  }`}
                />
              </div>


              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
