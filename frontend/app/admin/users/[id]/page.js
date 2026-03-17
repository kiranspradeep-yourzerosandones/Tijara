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
    "Other"
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-purple-100 text-purple-700",
      shipped: "bg-indigo-100 text-indigo-700",
      delivered: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700"
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Not Found</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link href="/admin/users" className="inline-block mt-6 bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-amber-500">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xl font-bold flex-shrink-0">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">{user.phone}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                {user.isCreditBlocked && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    Credit Blocked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              user.isActive
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-amber-400 text-gray-900 rounded-lg font-semibold hover:bg-amber-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-amber-400 text-gray-900 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orderSummary?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(orderSummary?.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Delivered Orders</p>
          <p className="text-2xl font-bold text-blue-600">{orderSummary?.deliveredOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Last Payment</p>
          <p className="text-xl font-bold text-gray-900">{formatDate(paymentSummary?.lastPaymentDate)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT - Scrollable Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Profile & Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{user.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                ) : (
                  <p className="text-gray-900">{user.email || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Business Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName || ""}
                    onChange={handleChange}
                    placeholder="Company / Shop name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                ) : (
                  <p className="text-gray-900">{user.businessName || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Business Type</label>
                {isEditing ? (
                  <select
                    name="businessType"
                    value={formData.businessType || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    <option value="">Select</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{user.businessType || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">GST Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber || ""}
                    onChange={handleChange}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 uppercase"
                  />
                ) : (
                  <p className="text-gray-900">{user.gstNumber || "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Orders</h3>
              <Link href={`/admin/orders?userId=${userId}`} className="text-amber-600 text-sm font-medium hover:text-amber-700">
                View All →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Admin Notes</h3>
            {isEditing ? (
              <textarea
                name="adminNotes"
                value={formData.adminNotes || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Internal notes about this customer..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{user.adminNotes || "No notes added"}</p>
            )}
          </div>

        </div>

        {/* RIGHT - STICKY SIDEBAR */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 space-y-6">

            {/* Credit Card */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl p-6 text-gray-900">
              <h3 className="text-sm font-semibold opacity-80 mb-4">CREDIT SUMMARY</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm opacity-80">Credit Limit</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit || ""}
                      onChange={handleChange}
                      className="w-28 text-right px-2 py-1 rounded bg-white/20 border-0 focus:ring-2 focus:ring-white"
                    />
                  ) : (
                    <span className="text-2xl font-bold">{formatCurrency(user.creditLimit)}</span>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm opacity-80">Pending Amount</span>
                  <span className="text-xl font-semibold">{formatCurrency(user.pendingAmount)}</span>
                </div>
                <div className="h-px bg-gray-900/10" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm opacity-80">Available Credit</span>
                  <span className="text-xl font-bold">{formatCurrency(user.availableCredit)}</span>
                </div>
                {isEditing && (
                  <div className="pt-2">
                    <label className="text-sm opacity-80">Payment Terms (Days)</label>
                    <input
                      type="number"
                      name="paymentTerms"
                      value={formData.paymentTerms || ""}
                      onChange={handleChange}
                      min="0"
                      max="365"
                      className="w-full mt-1 px-3 py-2 rounded bg-white/20 border-0 focus:ring-2 focus:ring-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {!showResetPassword ? (
                  <button
                    onClick={() => setShowResetPassword(true)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span className="text-gray-700 font-medium">Reset Password</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Enter new password</p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm"
                      />
                      <button
                        onClick={handleResetPassword}
                        disabled={saving}
                        className="px-3 py-2 bg-amber-400 text-gray-900 rounded-lg font-medium hover:bg-amber-500 transition-colors text-sm"
                      >
                        {saving ? "..." : "Reset"}
                      </button>
                    </div>
                    <button
                      onClick={() => { setShowResetPassword(false); setNewPassword(""); }}
                      className="text-sm text-gray-500 mt-2 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <Link
                  href={`/admin/orders?userId=${userId}`}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-gray-700 font-medium">View All Orders</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href={`/admin/payments?userId=${userId}`}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-gray-700 font-medium">View Payments</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Account Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer ID</span>
                  <span className="text-gray-700 font-mono text-xs">{user._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined</span>
                  <span className="text-gray-700">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login</span>
                  <span className="text-gray-700">{formatDate(user.lastLoginAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Verified</span>
                  <span className={user.isPhoneVerified ? "text-emerald-600" : "text-red-600"}>
                    {user.isPhoneVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Payments</span>
                  <span className="text-gray-700">{paymentSummary?.totalPayments || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount Paid</span>
                  <span className="text-emerald-600 font-medium">{formatCurrency(paymentSummary?.totalAmountPaid)}</span>
                </div>
              </div>
            </div>

            {/* Credit Block Status */}
            {user.isCreditBlocked && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-orange-800 font-semibold">Credit Blocked</p>
                    <p className="text-orange-700 text-sm mt-1">{user.creditBlockedReason || "No reason provided"}</p>
                    {user.creditBlockedAt && (
                      <p className="text-orange-600 text-xs mt-2">Blocked on {formatDate(user.creditBlockedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}