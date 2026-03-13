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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({});

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getById(userId);
        setUser(response.data.customer);
        setFormData(response.data.customer);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffe494]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500">{user.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {user.isActive ? "Active" : "Inactive"}
          </span>
          <button
            onClick={handleToggleStatus}
            disabled={saving}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              user.isActive
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            ) : (
              <p className="text-gray-900">{user.name}</p>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            ) : (
              <p className="text-gray-900">{user.email || "-"}</p>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            ) : (
              <p className="text-gray-900">{user.businessName || "-"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Business Type</label>
            {isEditing ? (
              <select
                name="businessType"
                value={formData.businessType || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              >
                <option value="">Select</option>
                <option value="Retailer">Retailer</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Distributor">Distributor</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900">{user.businessType || "-"}</p>
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            ) : (
              <p className="text-gray-900">{user.gstNumber || "-"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Credit Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Credit Limit</label>
            {isEditing ? (
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit || 0}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              />
            ) : (
              <p className="text-2xl font-bold text-gray-900">₹{(user.creditLimit || 0).toLocaleString()}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Pending Amount</label>
            <p className="text-2xl font-bold text-orange-600">₹{(user.pendingAmount || 0).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Available Credit</label>
            <p className="text-2xl font-bold text-green-600">₹{(user.availableCredit || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Reset Password */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        {!showResetPassword ? (
          <button
            onClick={() => setShowResetPassword(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Reset Password
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl"
            />
            <button
              onClick={handleResetPassword}
              disabled={saving}
              className="px-4 py-2 bg-[#ffe494] text-black rounded-xl font-medium hover:bg-[#ffd84d] transition-colors"
            >
              {saving ? "..." : "Reset"}
            </button>
            <button
              onClick={() => {
                setShowResetPassword(false);
                setNewPassword("");
              }}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h2>
        {isEditing ? (
          <textarea
            name="adminNotes"
            value={formData.adminNotes || ""}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          />
        ) : (
          <p className="text-gray-600 whitespace-pre-wrap">{user.adminNotes || "No notes"}</p>
        )}
      </div>
    </div>
  );
}