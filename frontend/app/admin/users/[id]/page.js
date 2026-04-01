"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { userAPI } from "@/lib/api";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({});

  const businessTypes = [
    "Retailer",
    "Wholesaler",
    "Distributor",
    "Manufacturer",
    "Contractor",
    "Industrial",
    "Other",
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getById(userId);
        const data = response.data;

        setUser(data.customer);
        setFormData(data.customer);
        setOrderSummary(data.orderSummary);
        setPaymentSummary(data.paymentSummary);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userAPI.update(userId, {
        name: formData.name,
        email: formData.email,
        businessName: formData.businessName,
        businessType: formData.businessType,
        gstNumber: formData.gstNumber,
        creditLimit: parseInt(formData.creditLimit) || 0,
        paymentTerms: parseInt(formData.paymentTerms) || 30,
        adminNotes: formData.adminNotes,
      });
      setUser({ ...user, ...formData });
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);
      await userAPI.resetPassword(userId, newPassword);
      alert("Password reset successfully");
      setShowResetPassword(false);
      setNewPassword("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setSaving(true);
      await userAPI.toggleStatus(userId);
      setUser({ ...user, isActive: !user.isActive });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      packed: "bg-purple-50 text-purple-700 border-purple-200",
      shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return badges[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100/50">
          <svg
            className="w-10 h-10 text-red-500"
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
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Not Found</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 hover:bg-gray-800 
                     text-white font-semibold rounded-xl transition-all duration-200 
                     shadow-lg shadow-gray-900/20 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-amber-700 text-lg font-bold shadow-md shadow-amber-100/50">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    {user.name}
                  </h1>
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                  {user.isCreditBlocked && (
                    <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={saving}
              className={`hidden sm:flex items-center gap-1.5 px-4 py-2.5 font-medium rounded-xl 
                         transition-all duration-200 text-sm ${
                           user.isActive
                             ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                             : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                         }`}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="group relative px-5 py-2.5 font-semibold text-sm transition-all duration-200 
                           flex items-center gap-2 rounded-xl overflow-hidden
                           bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 
                           hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-gray-500 hover:text-gray-900 
                             font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-5 py-2.5 font-semibold text-sm transition-all duration-200 
                             flex items-center gap-2 rounded-xl ${
                               saving
                                 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                 : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20"
                             }`}
                >
                  {saving ? (
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="mt-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orderSummary?.totalOrders || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-600"
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
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(orderSummary?.totalSpent)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Delivered</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orderSummary?.deliveredOrders || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Last Payment</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(paymentSummary?.lastPaymentDate)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="mt-6 pb-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* ═══════════════════════════ LEFT COLUMN ═══════════════════════════ */}
          <div className="xl:col-span-7 space-y-6">
            {/* ── Customer Information Card ── */}
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
                      Customer Information
                    </h3>
                    <p className="text-xs text-gray-400">Personal and business details</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 transition-all duration-200 hover:border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Phone
                    </label>
                    <p className="text-gray-900 font-medium font-mono">{user.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="user@example.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                   hover:border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user.email || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Business Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName || ""}
                        onChange={handleChange}
                        placeholder="Company / Shop name"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                   hover:border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{user.businessName || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Business Type
                    </label>
                    {isEditing ? (
                      <select
                        name="businessType"
                        value={formData.businessType || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                      >
                        <option value="">Select</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">{user.businessType || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      GST Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber || ""}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-400 transition-all duration-200
                                   hover:border-gray-300 uppercase font-mono"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium font-mono">
                        {user.gstNumber || "—"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recent Orders Card ── */}
            <div className="bg-white mb-2 rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                    <p className="text-xs text-gray-400">Latest customer purchases</p>
                  </div>
                </div>
                <Link
                  href={`/admin/orders?userId=${userId}`}
                  className="text-amber-600 text-sm font-semibold hover:text-amber-700 
                             flex items-center gap-1 transition-colors"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No orders yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    This customer hasn't placed any orders
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <Link
                      key={order._id}
                      href={`/admin/orders/${order._id}`}
                      className="flex items-center justify-between p-5 hover:bg-gray-50 
                                 transition-colors group"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 mb-1">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Admin Notes Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
                    <h3 className="text-sm font-semibold text-gray-900">Admin Notes</h3>
                    <p className="text-xs text-gray-400">Internal notes about this customer</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <textarea
                    name="adminNotes"
                    value={formData.adminNotes || ""}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add internal notes about this customer..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                               text-gray-900 placeholder:text-gray-400 resize-none transition-all duration-200
                               hover:border-gray-300"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {user.adminNotes || (
                      <span className="text-gray-400 italic">No notes added</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
          <div className="xl:col-span-5 space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              {/* ── Credit Summary Card ── */}
              <div className="mb-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 text-gray-900 shadow-xl shadow-amber-500/20">
                <h3 className="text-xs font-bold opacity-80 uppercase tracking-wider mb-5">
                  Credit Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm opacity-80">Credit Limit</span>
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium">
                          ₹
                        </span>
                        <input
                          type="number"
                          name="creditLimit"
                          value={formData.creditLimit || ""}
                          onChange={handleChange}
                          className="w-36 text-right pl-6 pr-3 py-2 rounded-xl bg-white/30 backdrop-blur 
                                     border-0 focus:ring-2 focus:ring-white/50 text-gray-900 font-bold"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">
                        {formatCurrency(user.creditLimit)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm opacity-80">Pending Amount</span>
                    <span className="text-xl font-semibold">
                      {formatCurrency(user.pendingAmount)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-900/10" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm opacity-80">Available Credit</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(user.availableCredit)}
                    </span>
                  </div>
                  {isEditing && (
                    <div className="pt-2">
                      <label className="text-xs opacity-80 uppercase tracking-wider font-semibold">
                        Payment Terms (Days)
                      </label>
                      <input
                        type="number"
                        name="paymentTerms"
                        value={formData.paymentTerms || ""}
                        onChange={handleChange}
                        min="0"
                        max="365"
                        className="w-full mt-2 px-4 py-3 rounded-xl bg-white/30 backdrop-blur 
                                   border-0 focus:ring-2 focus:ring-white/50 text-gray-900 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Quick Actions Card ── */}
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {!showResetPassword ? (
                    <button
                      onClick={() => setShowResetPassword(true)}
                      className="w-full flex items-center justify-between p-3.5 bg-gray-50 
                                 rounded-xl hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
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
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm">
                          Reset Password
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-3">
                        Enter new password
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg 
                                     focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                        />
                        <button
                          onClick={handleResetPassword}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium 
                                     hover:bg-blue-700 transition-colors text-sm"
                        >
                          {saving ? "..." : "Reset"}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setShowResetPassword(false);
                          setNewPassword("");
                        }}
                        className="text-sm text-blue-600 mt-3 hover:text-blue-700 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <Link
                    href={`/admin/orders?userId=${userId}`}
                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 
                               rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
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
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        View All Orders
                      </span>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>

                  <Link
                    href={`/admin/payments?userId=${userId}`}
                    className="w-full flex items-center justify-between p-3.5 bg-gray-50 
                               rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
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
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        View Payments
                      </span>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* ── Account Info Card ── */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-600"
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
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Account Info</h3>
                  </div>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Customer ID</span>
                    <span className="text-gray-700 font-mono text-xs">{user._id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Joined</span>
                    <span className="text-gray-700 font-medium">
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-gray-700 font-medium">
                      {formatDate(user.lastLoginAt)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Phone Verified</span>
                    <span
                      className={`font-semibold ${
                        user.isPhoneVerified ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {user.isPhoneVerified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Total Payments</span>
                    <span className="text-gray-700 font-medium">
                      {paymentSummary?.totalPayments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-emerald-600 font-bold">
                      {formatCurrency(paymentSummary?.totalAmountPaid)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Credit Block Warning ── */}
              {user.isCreditBlocked && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-900 font-bold mb-1">Credit Blocked</p>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        {user.creditBlockedReason || "No reason provided"}
                      </p>
                      {user.creditBlockedAt && (
                        <p className="text-orange-600 text-xs mt-2">
                          Blocked on {formatDate(user.creditBlockedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}