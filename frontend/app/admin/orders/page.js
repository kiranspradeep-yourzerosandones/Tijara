"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";
import { useAdminSse } from "@/context/AdminSseContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── All existing constants stay exactly the same ───────────
const STATUS_COLORS = {
  pending:          "bg-yellow-100 text-yellow-800",
  confirmed:        "bg-blue-100 text-blue-800",
  packed:           "bg-indigo-100 text-indigo-800",
  shipped:          "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered:        "bg-green-100 text-green-800",
  cancelled:        "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  packed:           "Packed",
  shipped:          "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

const DEFAULT_STATS = {
  totalOrders:     0,
  pendingOrders:   0,
  confirmedOrders: 0,
  packedOrders:    0,
  shippedOrders:   0,
  deliveredOrders: 0,
  cancelledOrders: 0,
};

const ITEMS_PER_PAGE = 20;

export default function Orders() {
  const router           = useRouter();
  const searchTimeoutRef = useRef(null);

  // ── All existing state stays exactly the same ──────────
  const [filter,      setFilter]      = useState("all");
  const [searchTerm,  setSearchTerm]  = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders,      setOrders]      = useState([]);
  const [stats,       setStats]       = useState(DEFAULT_STATS);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [pagination,  setPagination]  = useState({ current: 1, pages: 1, total: 0 });

  // ✅ NEW: SSE state
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const filterRef       = useRef("all");
  const currentPageRef  = useRef(1);

  // ── Keep refs in sync with state ───────────────────────
  // (SSE callback is a closure — it can't see updated state directly)
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // ── All existing fetch functions stay exactly the same ──

  const fetchOrders = useCallback(async (search, status, page) => {
    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (search?.trim()) params.set("search", search.trim());
      params.set("page",  String(page));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(
        `${API_URL}/admin/orders?${params.toString()}`,
        { headers }
      );

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (res.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.success) {
        setOrders(data.data?.orders || []);
        const p = data.data?.pagination;
        if (p) setPagination({ current: p.current, pages: p.pages, total: p.total });
      } else {
        throw new Error(data.message || "Failed to load orders");
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the server. Make sure the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;

      const res = await fetch(`${API_URL}/admin/orders/stats`, { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) setStats(data.data?.stats || DEFAULT_STATS);
     } catch (err) {
      console.warn("fetchStats failed (non-critical):", err.message);
    }
  }, []);

  // ── Existing effects stay exactly the same ──────────────
    useEffect(() => {
    fetchOrders(searchTerm, filter, currentPage);
  }, [filter, currentPage, fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  
    // ✅ SSE — shared connection from AdminSseProvider in layout
  useAdminSse("new_order", (orderData) => {
    console.log("🛒 Orders page: New order via SSE:", orderData);

    setNewOrderAlert(orderData);

    if (currentPageRef.current === 1 && filterRef.current === "all") {
      fetchOrders("", "all", 1);
      fetchStats();
    } else {
      fetchStats();
    }

    setTimeout(() => setNewOrderAlert(null), 8000);
  });

  // ── All existing handlers stay exactly the same ────────

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(value, filter, 1);
    }, 500);
  };

  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.pages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearSearch = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchTerm("");
    setCurrentPage(1);
    fetchOrders("", filter, 1);
  };

  const handleClearAll = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setSearchTerm("");
    setFilter("all");
    setCurrentPage(1);
    fetchOrders("", "all", 1);
    fetchStats();
  };

  const handleRefresh = () => {
    fetchOrders(searchTerm, filter, currentPage);
    fetchStats();
  };

  const handleViewOrder = (orderId) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const getPageNumbers = () => {
    const { pages } = pagination;
    const current   = currentPage;
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const nums = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) nums.push(i);
      nums.push("...");
      nums.push(pages);
    } else if (current >= pages - 3) {
      nums.push(1);
      nums.push("...");
      for (let i = pages - 4; i <= pages; i++) nums.push(i);
    } else {
      nums.push(1);
      nums.push("...");
      nums.push(current - 1);
      nums.push(current);
      nums.push(current + 1);
      nums.push("...");
      nums.push(pages);
    }
    return nums;
  };

  const filterTabs = [
    { id: "all",              label: "All",       count: stats.totalOrders     },
    { id: "pending",          label: "Pending",   count: stats.pendingOrders   },
    { id: "confirmed",        label: "Confirmed", count: stats.confirmedOrders },
    { id: "packed",           label: "Packed",    count: stats.packedOrders    },
    { id: "shipped",          label: "Shipped",   count: stats.shippedOrders   },
    { id: "delivered",        label: "Delivered", count: stats.deliveredOrders },
    { id: "cancelled",        label: "Cancelled", count: stats.cancelledOrders },
  ];

  const rangeStart = pagination.total === 0
    ? 0
    : Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, pagination.total);
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, pagination.total);

  return (
    <ProtectedPage permission="manageOrders">
      <div className="space-y-6">

        {/* ✅ NEW: New Order Alert Banner */}
        {newOrderAlert && (
          <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in">
            <div className="bg-white border-l-4 border-amber-500 rounded-2xl shadow-2xl p-4
                            flex items-start gap-3">
              {/* Animated dot */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full
                                   rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">New Order Received!</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  #{newOrderAlert.orderNumber} —{" "}
                  {newOrderAlert.customer?.businessName ||
                   newOrderAlert.customer?.name ||
                   "Customer"}
                </p>
                <p className="text-xs font-semibold text-amber-700 mt-1">
                  ₹{(newOrderAlert.totalAmount || 0).toLocaleString("en-IN")}
                  {" · "}
                  {newOrderAlert.totalItems || 0} item(s)
                </p>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    setNewOrderAlert(null);
                    handleViewOrder(newOrderAlert.orderId);
                  }}
                  className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold
                             rounded-lg hover:bg-amber-600 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => setNewOrderAlert(null)}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium
                             rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header — exactly as before ─────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500">Manage orders from mobile app</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg
                       hover:bg-amber-600 transition-colors flex items-center gap-2
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
                   11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Error Banner — exactly as before ───────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Failed to load orders</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold
                         rounded-lg hover:bg-red-600 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stats Cards — exactly as before ────────────── */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {filterTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all ${
                filter === tab.id
                  ? "bg-amber-500 text-white shadow-lg scale-105"
                  : "bg-white border border-gray-100 hover:border-amber-200"
              }`}
            >
              <p className={`text-xl font-bold ${
                filter === tab.id ? "text-white" : "text-gray-900"
              }`}>
                {tab.count}
              </p>
              <p className={`text-xs mt-0.5 ${
                filter === tab.id ? "text-amber-100" : "text-gray-500"
              }`}>
                {tab.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search + Filter — exactly as before ────────── */}
        <div className="bg-white mt-3 mb-3 rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-3">
            <div className="flex-[7] relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    setCurrentPage(1);
                    fetchOrders(searchTerm, filter, 1);
                  }
                }}
                placeholder="Search by order ID, customer name, or phone number..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                           text-gray-900 placeholder:text-gray-400 transition-all duration-200
                           hover:border-gray-300 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-[3] relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0
                       00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                           text-gray-900 transition-all duration-200 hover:border-gray-300
                           text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {(searchTerm || filter !== "all") && !loading && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {pagination.total > 0 ? (
                  <>
                    Found{" "}
                    <span className="font-semibold text-gray-900">{pagination.total}</span>{" "}
                    result{pagination.total !== 1 ? "s" : ""}
                    {searchTerm && (
                      <> for "
                        <span className="font-semibold text-amber-600">{searchTerm}</span>"
                      </>
                    )}
                    {filter !== "all" && (
                      <> in <span className="font-semibold">
                        {STATUS_LABELS[filter] || filter}
                      </span></>
                    )}
                  </>
                ) : "No results found"}
              </p>
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-600 font-medium
                           flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Orders Table — exactly as before ───────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-400
                                border-t-transparent animate-spin" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm ? `Searching for "${searchTerm}"...` : "Loading orders..."}
              </p>
            </div>

          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center
                              justify-center mx-auto mb-6">
                {searchTerm ? (
                  <svg className="w-12 h-12 text-amber-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-amber-400" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0
                         002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0
                         002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {searchTerm ? "No Results Found" : "No Orders Found"}
              </h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                {searchTerm
                  ? `No orders match "${searchTerm}"${
                      filter !== "all"
                        ? ` with status "${STATUS_LABELS[filter] || filter}"`
                        : ""
                    }. Try a different search.`
                  : filter !== "all"
                  ? `No ${STATUS_LABELS[filter] || filter} orders at the moment`
                  : "Orders from the mobile app will appear here"}
              </p>
              {(searchTerm || filter !== "all") && (
                <button
                  onClick={handleClearAll}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg
                             hover:bg-amber-600 transition-colors font-medium text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>

          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        "Order ID", "Customer", "Items",
                        "Total", "Status", "Payment", "Date", ""
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-4 text-sm font-semibold text-gray-600
                                      ${i === 7 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewOrder(order._id)}
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            #{order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {order.customerSnapshot?.name || order.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customerSnapshot?.phone || ""}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.totalItems || order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                          }`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus === "partial"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order._id);
                            }}
                            className="px-4 py-2 bg-amber-100 text-amber-700
                                       rounded-lg hover:bg-amber-200 transition-colors
                                       font-medium text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination — exactly as before ─────────── */}
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row
                              items-center justify-between gap-4 bg-gray-50/50">
                <p className="text-sm text-gray-500 order-2 sm:order-1">
                  {pagination.total > 0 ? (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-gray-900">{rangeStart}</span>
                      {" – "}
                      <span className="font-semibold text-gray-900">{rangeEnd}</span>
                      {" of "}
                      <span className="font-semibold text-gray-900">{pagination.total}</span>
                      {" orders"}
                    </>
                  ) : (
                    <span className="font-semibold text-gray-900">{orders.length} orders</span>
                  )}
                </p>

                {pagination.pages > 1 && (
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex items-center px-2 py-2 text-sm border border-gray-200
                                 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="First page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium
                                 border border-gray-200 rounded-lg bg-white
                                 hover:bg-gray-50 hover:border-gray-300
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <span key={`dots-${idx}`} className="px-2 py-2 text-sm text-gray-400 select-none">
                            ···
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg
                                        transition-all duration-200 ${
                              currentPage === page
                                ? "bg-amber-500 text-white shadow-sm shadow-amber-200 scale-105"
                                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium
                                 border border-gray-200 rounded-lg bg-white
                                 hover:bg-gray-50 hover:border-gray-300
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.pages)}
                      disabled={currentPage === pagination.pages}
                      className="hidden sm:flex items-center px-2 py-2 text-sm border border-gray-200
                                 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300
                                 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      title="Last page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}