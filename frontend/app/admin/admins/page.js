"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { admin, getToken } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (admin && admin.role !== "superadmin") {
      router.push("/admin/dashboard");
      return;
    }
    fetchAdmins();
  }, [admin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/admins`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data.admins);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (adminId) => {
    setActionLoading(adminId);
    try {
      const response = await fetch(`${API_URL}/admin/admins/${adminId}/toggle-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchAdmins();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setActionLoading(adminToDelete);
    try {
      const response = await fetch(`${API_URL}/admin/admins/${adminToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        setShowDeleteModal(false);
        setAdminToDelete(null);
        fetchAdmins();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to delete admin");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || a.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && a.isActive) ||
      (filterStatus === "inactive" && !a.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const styles = {
      superadmin: "bg-purple-50 text-purple-700 border-purple-200",
      admin: "bg-blue-50 text-blue-700 border-blue-200",
      manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    return styles[role] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Delete Admin</h3>
              <p className="text-gray-600 text-sm text-center mb-6">
                Are you sure you want to delete this admin? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAdminToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-semibold border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={actionLoading === adminToDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === adminToDelete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-h-screen">
        {/* ─── Sticky Header ─── */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex items-center justify-between py-4 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
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
                    Admin Management
                  </h1>
                  <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {filteredAdmins.length} {filteredAdmins.length === 1 ? "Admin" : "Admins"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                  Manage admin accounts and permissions
                </p>
              </div>
            </div>
            <Link
              href="/admin/admins/add"
              className="group relative px-5 sm:px-6 py-2.5 font-semibold text-sm transition-all duration-200 
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Admin</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>

        {/* ─── Error Alert ─── */}
        {error && (
          <div className="mt-6 max-w-[1600px] mx-auto">
            <div
              className="p-4 bg-red-50 border border-red-200/60 text-red-800 
                            flex items-center gap-3 text-sm rounded-2xl animate-in slide-in-from-top duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Filters ─── */}
        <div className="mt-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                               text-gray-900 placeholder:text-gray-400 transition-all duration-200
                               hover:border-gray-300"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Admins List ─── */}
        <div className="mt-6 pb-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {filteredAdmins.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-100/50">
                  <svg
                    className="w-10 h-10 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Admins Found</h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm || filterRole !== "all" || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Add admins to manage your system"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAdmins.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 font-bold flex items-center justify-center flex-shrink-0 text-lg rounded-xl shadow-sm">
                          {a.name?.charAt(0).toUpperCase() || "A"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">{a.name}</p>
                            {a.id === admin?.id && (
                              <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{a.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-xs font-semibold capitalize rounded-lg border ${getRoleBadge(
                                a.role
                              )}`}
                            >
                              {a.role === "superadmin" ? "Super Admin" : a.role}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  a.isActive ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                              <span className="text-xs text-gray-500">
                                {a.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/admin/admins/${a.id}`}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                                     rounded-xl transition-all duration-200"
                          title="Edit"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                        {a.id !== admin?.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(a.id)}
                              disabled={actionLoading === a.id}
                              className={`p-2.5 rounded-xl transition-all duration-200 ${
                                a.isActive
                                  ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={a.isActive ? "Deactivate" : "Activate"}
                            >
                              {actionLoading === a.id ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
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
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setAdminToDelete(a.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 
                                         rounded-xl transition-all duration-200"
                              title="Delete"
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}