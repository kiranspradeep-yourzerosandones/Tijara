"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { userAPI } from "@/lib/api";

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creditFilter, setCreditFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;
      if (creditFilter !== "all") params.creditStatus = creditFilter;

      const response = await userAPI.getAll(params);
      setUsers(response.data.customers || []);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, creditFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(userId);
      await userAPI.toggleStatus(userId);

      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to deactivate "${userName}"?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await userAPI.delete(userId);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 max-w-[1600px] mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Customers
              </h1>
              <span className="inline-flex px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {pagination?.total || users.length}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage customer accounts and credit
            </p>
          </div>
          <Link
            href="/admin/users/add"
            className="group relative px-5 py-2.5 font-semibold text-sm transition-all duration-200 
                       flex items-center justify-center gap-2 rounded-xl overflow-hidden
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="mt-6 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <form onSubmit={handleSearch} className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, email, business..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 placeholder:text-gray-400 transition-all duration-200
                             hover:border-gray-300"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={creditFilter}
                  onChange={(e) => {
                    setCreditFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 transition-all duration-200 hover:border-gray-300 cursor-pointer"
                >
                  <option value="all">All Credit</option>
                  <option value="active">Credit Active</option>
                  <option value="blocked">Credit Blocked</option>
                  <option value="overdue">Overdue</option>
                </select>

                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 
                             transition-colors font-semibold text-sm"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || creditFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCreditFilter("all");
                  setCurrentPage(1);
                }}
                className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1.5"
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
                Clear Filters
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="mt-6 pb-6 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
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
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Customers Found</h3>
              {(searchQuery || statusFilter !== "all" || creditFilter !== "all") && (
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {users.map((user) => (
                  <div key={user._id} className="p-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-amber-700 font-bold text-lg flex-shrink-0 shadow-sm">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                        {user.businessName && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {user.businessName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                          {user.isCreditBlocked && (
                            <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-medium">
                              Credit Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs">Credit Limit</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(user.creditLimit)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-orange-600 text-xs">Pending</p>
                        <p className="font-semibold text-orange-700">
                          {formatCurrency(user.pendingAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="flex-1 text-center py-2.5 text-gray-600 bg-gray-100 rounded-xl 
                                   text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        disabled={actionLoading === user._id}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          user.isActive
                            ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                            : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {actionLoading === user._id ? "..." : user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center text-amber-700 font-bold flex-shrink-0 shadow-sm">
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
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-400 truncate">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900 truncate max-w-[150px]">
                            {user.businessName || "—"}
                          </p>
                          {user.businessType && (
                            <p className="text-sm text-gray-400">{user.businessType}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 font-semibold">
                              {formatCurrency(user.creditLimit)}
                            </p>
                            <p className="text-orange-600">
                              Pending: {formatCurrency(user.pendingAmount)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                                user.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                            {user.isCreditBlocked && (
                              <span className="inline-flex w-fit items-center px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-medium">
                                Credit Blocked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/users/${user._id}`}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                                         rounded-xl transition-all duration-200"
                              title="View Details"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                            <button
                              onClick={() =>
                                handleToggleStatus(user._id, user.isActive)
                              }
                              disabled={actionLoading === user._id}
                              className={`p-2.5 rounded-xl transition-all duration-200 ${
                                user.isActive
                                  ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                  : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={user.isActive ? "Deactivate" : "Activate"}
                            >
                              {actionLoading === user._id ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : user.isActive ? (
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(user._id, user.name)}
                              disabled={actionLoading === user._id}
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                  <p className="text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold">{pagination.current}</span> of{" "}
                    <span className="font-semibold">{pagination.pages}</span>
                    <span className="text-gray-400 ml-2">
                      ({pagination.total} customers)
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl disabled:opacity-50 
                                 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 
                                 transition-colors font-medium text-sm bg-white shadow-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(pagination.pages, currentPage + 1))
                      }
                      disabled={currentPage === pagination.pages}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl disabled:opacity-50 
                                 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 
                                 transition-colors font-medium text-sm bg-white shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}