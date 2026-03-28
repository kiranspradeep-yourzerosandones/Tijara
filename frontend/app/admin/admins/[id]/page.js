// frontend/app/admin/admins/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { adminAPI } from "@/lib/api";

export default function EditAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { admin: currentAdmin } = useAdminAuth();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      const data = await adminAPI.getById(params.id);
      if (data.success) {
        setFormData(data.data.admin);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch admin");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("permission_")) {
      const permission = name.replace("permission_", "");
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [permission]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await adminAPI.update(params.id, formData);

      if (data.success) {
        setSuccess("Admin updated successfully!");
        setTimeout(() => router.push("/admin/admins"), 1500);
      } else {
        setError(data.message || "Failed to update admin");
      }
    } catch (err) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const permissionsList = [
    { key: "manageProducts", label: "Products", icon: "📦", desc: "Add, edit & delete products" },
    { key: "manageOrders", label: "Orders", icon: "📋", desc: "View & manage orders" },
    { key: "manageCustomers", label: "Customers", icon: "👥", desc: "Manage customer accounts" },
    { key: "managePayments", label: "Payments", icon: "💳", desc: "Handle payment records" },
    { key: "manageAdmins", label: "Admins", icon: "🔐", desc: "Create & manage admins" },
    { key: "viewReports", label: "Reports", icon: "📊", desc: "Access analytics & reports" },
  ];

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100/50">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Not Found</h2>
        <p className="text-gray-500 mt-2">{error || "The admin you're looking for doesn't exist"}</p>
        <Link
          href="/admin/admins"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 hover:bg-gray-800 
                     text-white font-semibold rounded-xl transition-all duration-200 
                     shadow-lg shadow-gray-900/20 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admins
        </Link>
      </div>
    );
  }

  return (
    <ProtectedPage permission="manageAdmins">
      <div className="w-full min-h-screen">
        {/* ─── Sticky Header ─── */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex items-center justify-between py-4 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/admins"
                className="group p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 
                           rounded-xl transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Edit Admin
                  </h1>
                  <span
                    className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      formData.role === "superadmin"
                        ? "bg-purple-100 text-purple-700"
                        : formData.role === "manager"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {formData.role}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                  {formData.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/admin/admins"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-gray-500 hover:text-gray-900 
                           font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`group relative px-6 sm:px-7 py-2.5 font-semibold text-sm transition-all duration-200 
                           flex items-center gap-2 rounded-xl overflow-hidden ${
                             saving
                               ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                               : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
                           }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Alerts ─── */}
        {(success || error) && (
          <div className="mt-6 max-w-[1600px] mx-auto">
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-3 text-sm rounded-2xl animate-in slide-in-from-top duration-300">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{success}</span>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200/60 text-red-800 flex items-center gap-3 text-sm rounded-2xl animate-in slide-in-from-top duration-300">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="flex-1 font-medium">{error}</span>
                <button onClick={() => setError("")} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── Form ─── */}
        <form onSubmit={handleSubmit} className="mt-6 pb-6 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* ═══════════════════════════ LEFT COLUMN ═══════════════════════════ */}
            <div className="xl:col-span-7 space-y-6">
              {/* ── Basic Information Card ── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                      <p className="text-xs text-gray-400">Admin account details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-400 text-xs">*</span>
                    </label>
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-400 text-xs">*</span>
                      </label>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="admin@example.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel" name="phone" value={formData.phone || ""} onChange={handleChange}
                        placeholder="9876543210"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Account Status Card ── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Account Status</h3>
                      <p className="text-xs text-gray-400">Control admin access</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <label className={`flex items-center justify-between py-4 px-5 rounded-xl cursor-pointer transition-all duration-200 border ${
                    formData.isActive ? "bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50" : "bg-red-50/50 border-red-200/60 hover:bg-red-50"
                  } ${formData._id === currentAdmin?._id ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ring-4 transition-all duration-200 ${formData.isActive ? "bg-emerald-500 ring-emerald-100" : "bg-red-500 ring-red-100"}`} />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{formData.isActive ? "Active" : "Inactive"}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{formData.isActive ? "Admin can login and access dashboard" : "Admin cannot login to the system"}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} disabled={formData._id === currentAdmin?._id} className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-6 peer-disabled:opacity-50" />
                    </div>
                  </label>
                  {formData._id === currentAdmin?._id && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      You cannot deactivate your own account
                    </div>
                  )}
                </div>
              </div>

              {/* ── Role Selection Card ── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Role</h3>
                      <p className="text-xs text-gray-400">Select admin access level</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${formData._id === currentAdmin?._id ? "opacity-60 pointer-events-none" : ""}`}>
                    {[
                      { value: "admin", label: "Admin", desc: "Standard access", bgColor: "bg-blue-50", borderColor: "border-blue-400", textColor: "text-blue-700" },
                      { value: "manager", label: "Manager", desc: "Extended access", bgColor: "bg-indigo-50", borderColor: "border-indigo-400", textColor: "text-indigo-700" },
                      { value: "superadmin", label: "Super Admin", desc: "Full control", bgColor: "bg-purple-50", borderColor: "border-purple-400", textColor: "text-purple-700" },
                    ].map((role) => (
                      <label key={role.value} className={`relative flex flex-col p-4 border-2 cursor-pointer transition-all duration-200 rounded-xl ${
                        formData.role === role.value ? `${role.borderColor} ${role.bgColor}` : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                        <input type="radio" name="role" value={role.value} checked={formData.role === role.value} onChange={handleChange} disabled={formData._id === currentAdmin?._id} className="sr-only" />
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${formData.role === role.value ? role.textColor : "text-gray-900"}`}>{role.label}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            formData.role === role.value ? `${role.borderColor.replace("border", "bg")} border-transparent` : "border-gray-300"
                          }`}>
                            {formData.role === role.value && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{role.desc}</p>
                      </label>
                    ))}
                  </div>
                  {formData._id === currentAdmin?._id && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      You cannot change your own role
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
            <div className="xl:col-span-5 space-y-6">
              <div className="xl:sticky xl:top-24 space-y-6">
                {/* ── Permissions Card ── */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                      </div>
                      {formData.role !== "superadmin" && (
                        <span className="text-xs font-mono px-2 py-1 rounded-md bg-amber-50 text-amber-600">
                          {Object.values(formData.permissions || {}).filter(Boolean).length}/{Object.keys(formData.permissions || {}).length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {formData.role === "superadmin" ? (
                      <div className="bg-purple-50 border border-purple-200/60 rounded-xl p-5 flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-purple-800">Full Access Granted</p>
                          <p className="text-xs text-purple-600 mt-1">Super Admins automatically have all permissions enabled</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {permissionsList.map(({ key, label, icon, desc }) => (
                          <label key={key} className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                            formData.permissions?.[key] ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}>
                            <input type="checkbox" name={`permission_${key}`} checked={formData.permissions?.[key] || false} onChange={handleChange} className="sr-only" />
                            <span className="text-xl">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${formData.permissions?.[key] ? "text-amber-700" : "text-gray-700"}`}>{label}</p>
                              <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              formData.permissions?.[key] ? "border-amber-500 bg-amber-500" : "border-gray-300"
                            }`}>
                              {formData.permissions?.[key] && (
                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Account Activity Card ── */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Account Activity</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created
                      </span>
                      <span className="text-gray-700 font-medium">{formatDate(formData.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Last Login
                      </span>
                      <span className="text-gray-700 font-medium">{formatDate(formData.lastLoginAt)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Current User Notice ── */}
                {formData._id === currentAdmin?._id && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-blue-900 font-bold mb-1">This is your account</p>
                        <p className="text-blue-700 text-sm leading-relaxed">
                          You can update your name, email, and phone. Role and status changes require another admin.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* ─── Mobile Bottom Bar ─── */}
        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-30">
          <div className="flex gap-3 ml-0 sm:ml-64 max-w-2xl mx-auto">
            <Link href="/admin/admins" className="flex-1 py-3.5 text-center text-gray-600 font-semibold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </Link>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className={`flex-[2] py-3.5 font-semibold flex items-center justify-center gap-2 rounded-xl text-sm transition-all duration-200 ${
                saving ? "bg-gray-100 text-gray-400" : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 active:scale-[0.98]"
              }`}>
              {saving ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : ("Save Changes")}
            </button>
          </div>
        </div>
        <div className="xl:hidden h-24" />
      </div>
    </ProtectedPage>
  );
}
