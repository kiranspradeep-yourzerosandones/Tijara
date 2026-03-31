// frontend/app/admin/pending-credits/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PendingCredits() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalOverdue: 0,
    ordersCount: 0,
    customersCount: 0
  });

  useEffect(() => {
    fetchPendingCredits();
  }, []);

  // Apply filters, search, sort whenever dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [allOrders, filter, searchTerm, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, sortBy, sortOrder]);

  const fetchPendingCredits = async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`${API_URL}/admin/orders?limit=500`, {
        headers: getAuthHeaders()
      });
      
      const data = await res.json();

      if (data.success) {
        // Filter: only orders with pending/partial payment AND not cancelled
        const pendingOrders = (data.data.orders || []).filter(
          order => 
            (order.paymentStatus === "pending" || order.paymentStatus === "partial") && 
            order.status !== "cancelled"
        );

        setAllOrders(pendingOrders);
        calculateStats(pendingOrders);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pendingOrders) => {
    const totalPending = pendingOrders.reduce(
      (sum, o) => sum + (o.totalAmount - (o.payment?.amountPaid || 0)), 
      0
    );
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const overdueOrders = pendingOrders.filter(o => new Date(o.createdAt) < thirtyDaysAgo);
    const totalOverdue = overdueOrders.reduce(
      (sum, o) => sum + (o.totalAmount - (o.payment?.amountPaid || 0)), 
      0
    );

    setStats({
      totalPending,
      totalOverdue,
      ordersCount: pendingOrders.length,
      customersCount: [...new Set(pendingOrders.map(o => o.user?._id).filter(Boolean))].length
    });
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...allOrders];

    // Apply tab filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    if (filter === "overdue") {
      filtered = filtered.filter(o => new Date(o.createdAt) < thirtyDaysAgo);
    } else if (filter === "thisWeek") {
      filtered = filtered.filter(o => new Date(o.createdAt) >= oneWeekAgo);
    }

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(search) ||
        order.customerSnapshot?.name?.toLowerCase().includes(search) ||
        order.customerSnapshot?.phone?.includes(search) ||
        order.customerSnapshot?.businessName?.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search) ||
        order.user?.phone?.includes(search) ||
        order.deliveryAddress?.shopName?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "amount":
          aVal = (a.totalAmount - (a.payment?.amountPaid || 0));
          bVal = (b.totalAmount - (b.payment?.amountPaid || 0));
          break;
        case "customerName":
          aVal = (a.customerSnapshot?.name || a.user?.name || "").toLowerCase();
          bVal = (b.customerSnapshot?.name || b.user?.name || "").toLowerCase();
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (sortBy === "customerName") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    setOrders(filtered);
  }, [allOrders, filter, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  };

  const isOverdue = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return days > 30;
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <ProtectedPage permission="managePayments">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Pending Credits</h1>
              {stats.totalPending > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  {formatPrice(stats.totalPending)}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/admin/payments/record"
            className="px-4 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-500 
                       text-gray-900 rounded-lg transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Payment
          </Link>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Pending", value: formatPrice(stats.totalPending), color: "red" },
            { label: "Overdue", value: formatPrice(stats.totalOverdue), color: "amber" },
            { label: "Orders", value: stats.ordersCount, color: "blue" },
            { label: "Customers", value: stats.customersCount, color: "purple" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-lg font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters - Compact */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search customer, order, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: "all", label: "All" },
                { id: "overdue", label: "Overdue" },
                { id: "thisWeek", label: "This Week" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    filter === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="customerName-asc">Name A-Z</option>
              <option value="customerName-desc">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 text-sm mt-3">Loading...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">
                {searchTerm ? "No results found" : "All Caught Up!"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? "Try a different search term" : "No pending credits"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort("createdAt")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Order
                          {sortBy === "createdAt" && (
                            <svg className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      </th>
                      <th 
                        className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort("customerName")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Customer
                          {sortBy === "customerName" && (
                            <svg className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th 
                        className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900"
                        onClick={() => toggleSort("amount")}
                      >
                        <span className="inline-flex items-center gap-1 justify-end">
                          Outstanding
                          {sortBy === "amount" && (
                            <svg className={`w-3 h-3 ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order) => {
                      const outstanding = order.totalAmount - (order.payment?.amountPaid || 0);
                      const overdue = isOverdue(order.createdAt);

                      return (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link href={`/admin/orders/${order._id}`} className="font-medium text-gray-900 hover:text-amber-600">
                              {order.orderNumber}
                            </Link>
                            <p className="text-xs text-gray-400">{getDaysAgo(order.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{order.customerSnapshot?.name || order.user?.name}</p>
                            <p className="text-xs text-gray-500">{order.customerSnapshot?.phone || order.user?.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                overdue ? "bg-red-100 text-red-700" : 
                                order.paymentStatus === "partial" ? "bg-blue-100 text-blue-700" : 
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {overdue ? "Overdue" : order.paymentStatus === "partial" ? "Partial" : "Pending"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-bold text-red-600">{formatPrice(outstanding)}</p>
                            {order.payment?.amountPaid > 0 && (
                              <p className="text-xs text-emerald-600">Paid: {formatPrice(order.payment.amountPaid)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={`/admin/orders/${order._id}`}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="View Order"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <Link
                                href={`/admin/payments/record?orderId=${order._id}`}
                                className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Record Payment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </Link>
                              {(order.customerSnapshot?.phone || order.user?.phone) && (
                                <a
                                  href={`tel:${order.customerSnapshot?.phone || order.user?.phone}`}
                                  className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Call Customer"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedOrders.map((order) => {
                  const outstanding = order.totalAmount - (order.payment?.amountPaid || 0);
                  const overdue = isOverdue(order.createdAt);

                  return (
                    <div key={order._id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/orders/${order._id}`} className="font-medium text-gray-900 hover:text-amber-600 text-sm">
                              {order.orderNumber}
                            </Link>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                              overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {overdue ? "Overdue" : "Pending"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {order.customerSnapshot?.name || order.user?.name} • {getDaysAgo(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 text-sm">{formatPrice(outstanding)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={`/admin/payments/record?orderId=${order._id}`}
                          className="flex-1 py-1.5 text-xs font-medium text-center text-amber-700 bg-amber-100 rounded-lg"
                        >
                          Record Payment
                        </Link>
                        <a
                          href={`tel:${order.customerSnapshot?.phone || order.user?.phone}`}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg"
                        >
                          Call
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 text-xs rounded ${
                              currentPage === pageNum
                                ? "bg-amber-500 text-white font-bold"
                                : "hover:bg-gray-100 text-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary Footer */}
        {orders.length > 0 && !loading && (
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">
                {orders.length} pending order{orders.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xl font-bold text-amber-900">
                {formatPrice(orders.reduce((sum, o) => sum + (o.totalAmount - (o.payment?.amountPaid || 0)), 0))}
              </p>
            </div>
            <Link
              href="/admin/payments/record"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold 
                         rounded-lg transition-colors shadow-lg shadow-amber-200 text-sm"
            >
              Record Payment
            </Link>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}