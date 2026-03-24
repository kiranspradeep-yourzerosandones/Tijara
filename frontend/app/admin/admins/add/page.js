// frontend/app/admin/admins/add/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { adminAPI } from "@/lib/api";

export default function AddAdminPage() {
  const router = useRouter();
  const { getToken } = useAdminAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
    permissions: {
      manageProducts: true,
      manageOrders: true,
      manageCustomers: true,
      managePayments: true,
      manageAdmins: false,
      viewReports: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Valid email is required");
      setLoading(false);
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const data = await adminAPI.create(formData);

      if (data.success) {
        setSuccess("Admin created successfully!");
        setTimeout(() => router.push("/admin/admins"), 1500);
      } else {
        setError(data.message || "Failed to create admin");
      }
    } catch (err) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
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
                  Add Admin
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  New
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                Create a new admin account with custom permissions
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
              Discard
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`group relative px-6 sm:px-7 py-2.5 font-semibold text-sm transition-all duration-200 
                         flex items-center gap-2 rounded-xl overflow-hidden ${
                           loading
                             ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                             : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
                         }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Create Admin</span>
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
            <div
              className="p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 
                            flex items-center gap-3 text-sm rounded-2xl animate-in slide-in-from-top duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium">{success}</span>
            </div>
          )}
          {error && (
            <div
              className="p-4 bg-red-50 border border-red-200/60 text-red-800 
                            flex items-center gap-3 text-sm rounded-2xl animate-in slide-in-from-top duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="flex-1 font-medium">{error}</span>
              <button
                onClick={() => setError("")}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Basic Information
                    </h3>
                    <p className="text-xs text-gray-400">
                      Admin account credentials
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-400 text-xs">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-400 text-xs">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@example.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                      required
                    />
                  </div>
                </div>

                {/* Password & Phone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-400 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-400 pr-10 transition-all duration-200
                                   hover:border-gray-300"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                                   hover:text-gray-600 p-1 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone{" "}
                      <span className="text-gray-400 text-xs font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Role Selection Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Role</h3>
                    <p className="text-xs text-gray-400">Select admin access level</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "admin", label: "Admin", desc: "Standard access", color: "blue" },
                    { value: "manager", label: "Manager", desc: "Extended access", color: "indigo" },
                    { value: "superadmin", label: "Super Admin", desc: "Full control", color: "purple" }
                  ].map((role) => (
                    <label
                      key={role.value}
                      className={`relative flex flex-col p-4 border-2 cursor-pointer transition-all duration-200 rounded-xl ${
                        formData.role === role.value
                          ? `border-${role.color}-400 bg-${role.color}-50`
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${
                          formData.role === role.value ? `text-${role.color}-700` : "text-gray-900"
                        }`}>
                          {role.label}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.role === role.value
                            ? `border-${role.color}-500 bg-${role.color}-500`
                            : "border-gray-300"
                        }`}>
                          {formData.role === role.value && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{role.desc}</p>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
          <div className="xl:col-span-5 space-y-6">
            {/* ── Permissions Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden xl:sticky xl:top-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                    {Object.values(formData.permissions).filter(Boolean).length}/
                    {Object.keys(formData.permissions).length}
                  </span>
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
                  <>
                    <div className="grid grid-cols-1 gap-2.5 mb-4">
                      {permissionsList.map(({ key, label, icon, desc }) => (
                        <label
                          key={key}
                          className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all duration-200 ${
                            formData.permissions[key]
                              ? "border-amber-400 bg-amber-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name={`permission_${key}`}
                            checked={formData.permissions[key]}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="text-xl">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              formData.permissions[key] ? "text-amber-700" : "text-gray-700"
                            }`}>
                              {label}
                            </p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            formData.permissions[key]
                              ? "border-amber-500 bg-amber-500"
                              : "border-gray-300"
                          }`}>
                            {formData.permissions[key] && (
                              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          permissions: Object.keys(formData.permissions).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                        })}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          permissions: Object.keys(formData.permissions).reduce((acc, key) => ({ ...acc, [key]: false }), {})
                        })}
                        className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 
                                   rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ─── Mobile Bottom Bar ─── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-30">
        <div className="flex gap-3 ml-0 sm:ml-64 max-w-2xl mx-auto">
          <Link
            href="/admin/admins"
            className="flex-1 py-3.5 text-center text-gray-600 font-semibold border border-gray-200 
                       bg-white rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-[2] py-3.5 font-semibold flex items-center justify-center gap-2 rounded-xl 
                        text-sm transition-all duration-200 ${
                          loading
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 active:scale-[0.98]"
                        }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Admin"
            )}
          </button>
        </div>
      </div>
      <div className="xl:hidden h-24" />
    </div>
    </ProtectedPage>
  );
}