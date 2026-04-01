"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userAPI } from "@/lib/api";

export default function AddUserPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    businessName: "",
    businessType: "",
    gstNumber: "",
    creditLimit: "",
    paymentTerms: "30",
    adminNotes: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const businessTypes = [
    "Retailer",
    "Wholesaler",
    "Distributor",
    "Manufacturer",
    "Contractor",
    "Industrial",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      if (profileImage) {
        data.append("profileImage", profileImage);
      }

      await userAPI.create({
        ...formData,
        creditLimit: parseInt(formData.creditLimit) || 0,
        paymentTerms: parseInt(formData.paymentTerms) || 30,
      });

      setSuccess("Customer created successfully!");
      setTimeout(() => router.push("/admin/users"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full min-h-screen ">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="flex items-center justify-between py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
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
              <div className="flex items-center gap-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Add Customer
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  New
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                Create a new customer account with business details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/users"
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
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                  <span>Create Customer</span>
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
          <div className="xl:col-span-7 space-y-6 ">
            {/* ── Profile Photo Card ── */}
            <div className="bg-white rounded-2xl border mb-2 border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Profile Photo
                    </h3>
                    <p className="text-xs text-gray-400">Optional customer avatar</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profilePreview ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-gray-100">
                        <img
                          src={profilePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center text-amber-700 text-xl font-bold ring-4 ring-amber-50">
                        {getInitials(formData.name)}
                      </div>
                    )}
                    {profilePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full 
                                   flex items-center justify-center hover:bg-red-600 transition-colors 
                                   shadow-lg shadow-red-500/30"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 
                                    rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 
                                    cursor-pointer transition-all duration-200"
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
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm font-medium">Upload Photo</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      JPG, PNG up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Basic Information Card ── */}
            <div className="bg-white mb-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
                      Customer contact details
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-400 text-xs">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-400 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                        placeholder="9876543210"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                   hover:border-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email{" "}
                      <span className="text-gray-400 text-xs font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-400 text-xs">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      minLength={6}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Business Information Card ── */}
            <div className="bg-white mb-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Business Information
                    </h3>
                    <p className="text-xs text-gray-400">
                      Company and tax details
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="Company / Shop name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                    >
                      <option value="">Select type</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                 hover:border-gray-300 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
          <div className="xl:col-span-5 space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              {/* ── Credit Settings Card ── */}
              <div className="bg-white mb-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Credit Settings
                      </h3>
                      <p className="text-xs text-gray-400">
                        Payment terms and limits
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Limit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 font-semibold placeholder:text-gray-300 
                                   placeholder:font-normal transition-all duration-200 hover:border-gray-300"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Maximum outstanding amount allowed
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms (Days)
                    </label>
                    <input
                      type="number"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      placeholder="30"
                      min="0"
                      max="365"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 transition-all duration-200 hover:border-gray-300"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Days allowed for payment after order
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Admin Notes Card ── */}
              <div className="bg-white mb-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Admin Notes
                      </h3>
                      <p className="text-xs text-gray-400">Internal use only</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <textarea
                    name="adminNotes"
                    value={formData.adminNotes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Internal notes about this customer..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                               text-gray-900 placeholder:text-gray-400 transition-all duration-200 
                               hover:border-gray-300 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Only visible to admin users
                  </p>
                </div>
              </div>

              {/* ── Quick Info Card ── */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/60 p-5">
                <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Quick Info
                </h3>
                <ul className="text-sm text-amber-700 space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3"
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
                    <span>Account will be pre-verified (no OTP needed)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3"
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
                    <span>Customer can login immediately</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3"
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
                    <span>Credit settings can be adjusted later</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ─── Mobile Bottom Bar ─── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-30">
        <div className="flex gap-3 ml-0 sm:ml-64 max-w-2xl mx-auto">
          <Link
            href="/admin/users"
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
                Creating...
              </>
            ) : (
              "Create Customer"
            )}
          </button>
        </div>
      </div>
      <div className="xl:hidden h-24" />
    </div>
  );
}