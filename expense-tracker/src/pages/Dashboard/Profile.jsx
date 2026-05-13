import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Edit3,
  X,
  Save,
  Upload,
  Lock,
  VenusAndMars,
  Cake,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// UI Primitives
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";

// Services
import { getUserProfile, updateUserProfile } from "../../services/profileService";
import { requestEmailVerification, changeUserEmail } from "../../services/authService";

export default function Profile() {
  const { theme, refreshUserProfile } = useOutletContext();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      try {
        const data = await getUserProfile();

        if (mounted && data) {
          setUser(data);
          setForm(data);

          // Cache for storage
          const userForStorage = { ...data };
          delete userForStorage.profile_image;
          localStorage.setItem("user", JSON.stringify(userForStorage));
        }
      } catch (err) {
        console.warn("Profile sync delay or error (using fallback):", err);

        if (mounted) {
          const fallbackUser = {
            name: currentUser.displayName || "New User",
            email: currentUser.email,
            profile_image: currentUser.photoURL,
            is_email_verified: currentUser.emailVerified,
            is_admin: false,
            currency_code: "USD",
            created_at: currentUser.metadata.creationTime,
          };

          setUser(fallbackUser);
          setForm(fallbackUser);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
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
      <div className="flex min-h-[75vh] items-center justify-center">
        <div
          className={`rounded-[2rem] border px-8 py-10 text-center ${
            isDark ? "border-white/10 bg-slate-900/70" : "border-white/80 bg-white/75"
          }`}
        >
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Syncing profile</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const headerActions = !isEditing ? (
    <button
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5 active:translate-y-0"
    >
      <Edit3 size={18} />
      Edit profile
    </button>
  ) : (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCancel}
        className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition ${
          isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        <X size={18} />
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:-translate-y-0.5 active:translate-y-0"
      >
        <Save size={18} />
        Save changes
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />

      <PageHeader
        title="My profile"
        subtitle="Manage your identity, financial preferences, and account security settings."
        icon={User}
        actions={headerActions}
        isDark={isDark}
        eyebrow="Account control"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        {/* IDENTITY CARD */}
        <div className="space-y-6">
          <SectionCard title="Identity" icon={Sparkles} isDark={isDark}>
            <div className="flex flex-col items-center text-center">
              <div className="group relative mb-6">
                <div className="h-36 w-36 overflow-hidden rounded-[2.5rem] border-4 border-white bg-slate-200 shadow-2xl dark:border-slate-800">
                  <img
                    src={form.profile_image || user.profile_image || "https://i.pravatar.cc/300"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-[2.5rem] bg-slate-950/60 font-bold text-white opacity-0 transition-opacity backdrop-blur-sm group-hover:opacity-100">
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} />
                      <span className="text-xs uppercase tracking-widest">Change</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <h2 className="text-2xl font-black tracking-tight">{user.name || "User"}</h2>
              <p className="mt-1 text-sm text-slate-400">{user.email}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {user.is_email_verified ? (
                  <StatusBadge tone="success" icon={CheckCircle} isDark={isDark}>
                    Verified
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="warning" icon={AlertCircle} isDark={isDark}>
                    Unverified
                  </StatusBadge>
                )}
                {user.is_admin && (
                  <StatusBadge tone="info" icon={ShieldCheck} isDark={isDark}>
                    Admin
                  </StatusBadge>
                )}
              </div>

              <div className="mt-8 grid w-full grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-white/5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Member since</p>
                  <p className="mt-1 font-bold">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account type</p>
                  <p className={`mt-1 font-bold ${user.is_admin ? "text-cyan-400" : "text-emerald-400"}`}>
                    {user.is_admin ? "Administrator" : "Personal"}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Quick actions" icon={Lock} isDark={isDark}>
             <div className="space-y-3">
                <button
                  onClick={() => navigate("/security")}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
                    isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <ShieldCheck size={18} className="text-cyan-400" />
                    <div>
                      <p className="text-sm font-bold">Security center</p>
                      <p className="text-xs text-slate-400">Manage 2FA and sessions</p>
                    </div>
                  </div>
                  <Edit3 size={14} className="text-slate-400" />
                </button>

                <button
                  onClick={() => navigate("/change-password")}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
                    isDark ? "border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10" : "border-rose-200 bg-rose-50 hover:bg-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <Lock size={18} className="text-rose-400" />
                    <div>
                      <p className="text-sm font-bold text-rose-300">Change password</p>
                      <p className="text-xs text-slate-400">Keep your account safe</p>
                    </div>
                  </div>
                  <Edit3 size={14} className="text-slate-400" />
                </button>
             </div>
          </SectionCard>
        </div>

        {/* DETAILS COLUMN */}
        <div className="space-y-8">
          <SectionCard title="Personal details" icon={User} isDark={isDark}>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Full name" isDark={isDark} required>
                {!isEditing ? (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-400">
                       <User size={20} />
                    </div>
                    <p className="text-lg font-bold">{user.name}</p>
                  </div>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={form.name || ""}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                )}
              </FormField>

              <FormField label="Email address" isDark={isDark} required>
                {!isEditing ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 px-1 py-1">
                      <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400">
                         <Mail size={20} />
                      </div>
                      <p className="text-lg font-bold">{user.email}</p>
                    </div>
                    {!user.is_email_verified && (
                      <button
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail}
                        className="text-xs font-black uppercase tracking-widest text-orange-400 hover:underline disabled:opacity-50"
                      >
                        {verifyingEmail ? "Sending..." : "Verify now"}
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    type="email"
                    name="email"
                    value={form.email || ""}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                )}
              </FormField>

              <FormField label="Gender" isDark={isDark}>
                {!isEditing ? (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="rounded-xl bg-violet-400/10 p-2 text-violet-400">
                       <VenusAndMars size={20} />
                    </div>
                    <p className="text-lg font-bold">{user.gender || "Not set"}</p>
                  </div>
                ) : (
                  <select name="gender" value={form.gender || ""} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                )}
              </FormField>

              <FormField label="Birthday" isDark={isDark}>
                {!isEditing ? (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="rounded-xl bg-orange-400/10 p-2 text-orange-400">
                       <Cake size={20} />
                    </div>
                    <p className="text-lg font-bold">
                      {user.birthday ? new Date(user.birthday).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                ) : (
                  <input
                    type="date"
                    name="birthday"
                    value={form.birthday || ""}
                    onChange={handleChange}
                  />
                )}
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Financial preferences" icon={Wallet} isDark={isDark}>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Default currency" isDark={isDark}>
                {!isEditing ? (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400">
                       <Wallet size={20} />
                    </div>
                    <p className="text-lg font-bold">{user.currency_code || "USD"}</p>
                  </div>
                ) : (
                  <select name="currency_code" value={form.currency_code || "USD"} onChange={handleChange}>
                    <option value="USD">USD ($)</option>
                    <option value="VND">VND (₫)</option>
                  </select>
                )}
              </FormField>

              <FormField label="Monthly budget limit" isDark={isDark}>
                {!isEditing ? (
                  <div className="flex items-center gap-3 px-1 py-1">
                    <div className="rounded-xl bg-rose-400/10 p-2 text-rose-400">
                       <AlertTriangle size={20} />
                    </div>
                    <p className="text-lg font-bold">
                      {user?.monthly_budget > 0
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: user?.currency_code || "USD",
                          }).format(user.monthly_budget)
                        : "No limit set"}
                    </p>
                  </div>
                ) : (
                  <input
                    type="number"
                    name="monthly_budget"
                    value={form.monthly_budget || ""}
                    onChange={handleChange}
                    placeholder="Enter monthly limit"
                  />
                )}
              </FormField>
            </div>
          </SectionCard>

          {!isEditing && (
             <div className={`rounded-[2rem] border border-dashed p-6 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                   <Calendar size={20} />
                </div>
                <h4 className="text-sm font-bold">Need a data backup?</h4>
                <p className="mt-1 text-xs text-slate-400">You can export your transactions to .xlsx in the data export center.</p>
                <button
                   onClick={() => navigate('/dataexport')}
                   className="mt-4 text-xs font-black uppercase tracking-widest text-cyan-400 hover:underline"
                >
                   Go to exports
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}