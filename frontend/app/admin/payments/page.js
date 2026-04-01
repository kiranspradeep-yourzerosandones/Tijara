// frontend/app/admin/payments/page.js - UPDATED
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import PermissionGate from "@/components/admin/PermissionGate";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    todayAmount: 0,
    thisMonthAmount: 0
  });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [filter, dateRange, pagination.current]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/admin/payments?page=${pagination.current}&limit=20`;
      if (filter !== "all") url += `&method=${filter}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.data.payments || []);
          if (data.data.pagination) {
            setPagination(prev => ({
              ...prev,
              pages: data.data.pagination.pages,
              total: data.data.pagination.total
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/payments/stats`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Calculate today and this month from dailyTrend
          const today = new Date().toISOString().split('T')[0];
          const thisMonth = today.substring(0, 7);
          
          const dailyTrend = data.data.dailyTrend || [];
          const todayData = dailyTrend.find(d => d._id === today);
          const monthData = dailyTrend.filter(d => d._id.startsWith(thisMonth));
          
          setStats({
            totalPayments: data.data.stats?.totalPayments || 0,
            totalAmount: data.data.stats?.totalAmount || 0,
            todayAmount: todayData?.totalAmount || 0,
            thisMonthAmount: monthData.reduce((sum, d) => sum + d.totalAmount, 0)
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchPayments();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getMethodBadge = (method) => {
    const styles = {
      cash: "bg-emerald-100 text-emerald-700",
      bank_transfer: "bg-blue-100 text-blue-700",
      upi: "bg-purple-100 text-purple-700",
      cheque: "bg-amber-100 text-amber-700",
      credit_note: "bg-gray-100 text-gray-700",
      credit: "bg-indigo-100 text-indigo-700",
      other: "bg-gray-100 text-gray-600"
    };
    const labels = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      cheque: "Cheque",
      credit_note: "Credit Note",
      credit: "Credit",
      other: "Other"
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${styles[method] || styles.other}`}>
        {labels[method] || method}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      cancelled: "bg-red-100 text-red-700",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-gray-100 text-gray-700"
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <ProtectedPage permission="managePayments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-500 mt-1">Track and manage all payment transactions</p>
          </div>
          <PermissionGate permission="managePayments">
            <Link
              href="/admin/payments/record"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 
                       text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </Link>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-xl font-bold text-amber-600">{formatPrice(stats.todayAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-xl font-bold text-purple-600">{formatPrice(stats.thisMonthAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-2">
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Search */}
    <div className="flex-1 relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search by payment ID, order number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="w-full pl-10 pr-4 py-2.5 border border-black rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-black placeholder:text-black/60"
      />
    </div>

    {/* Method Filter */}
    <select
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value);
        setPagination(prev => ({ ...prev, current: 1 }));
      }}
      className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white text-black"
    >
      <option value="all" className="text-black">All Methods</option>
      <option value="cash" className="text-black">Cash</option>
      <option value="bank_transfer" className="text-black">Bank Transfer</option>
      <option value="upi" className="text-black">UPI</option>
      <option value="cheque" className="text-black">Cheque</option>
      <option value="credit" className="text-black">Credit</option>
    </select>

    {/* Date Range */}
    <div className="flex gap-2">
      <input
        type="date"
        value={dateRange.start}
        onChange={(e) => {
          setDateRange(prev => ({ ...prev, start: e.target.value }));
          setPagination(prev => ({ ...prev, current: 1 }));
        }}
        className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-black [&::-webkit-calendar-picker-indicator]:opacity-100"
      />
      <input
        type="date"
        value={dateRange.end}
        onChange={(e) => {
          setDateRange(prev => ({ ...prev, end: e.target.value }));
          setPagination(prev => ({ ...prev, current: 1 }));
        }}
        className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-black [&::-webkit-calendar-picker-indicator]:opacity-100"
      />
    </div>

    {/* Search Button */}
    <button
      onClick={handleSearch}
      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
    >
      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  </div>
</div>

        {/* Payments List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No payments found</h3>
              <p className="text-gray-500 mt-1">Record your first payment to get started</p>
              <PermissionGate permission="managePayments">
                <Link
                  href="/admin/payments/record"
                  className="mt-4 inline-block px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Record Payment
                </Link>
              </PermissionGate>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Payment ID</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Method</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-900">{payment.paymentNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link 
                            href={`/admin/orders/${payment.order?._id}`} 
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {payment.orderNumber || payment.order?.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{payment.user?.name || "—"}</p>
                          <p className="text-sm text-gray-500">{payment.user?.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-emerald-600">{formatPrice(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getMethodBadge(payment.method)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/orders/${payment.order?._id}`}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {payments.map((payment) => (
                  <div key={payment._id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-600">{payment.paymentNumber}</span>
                      <div className="flex items-center gap-2">
                        {getMethodBadge(payment.method)}
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{payment.user?.name || "Customer"}</p>
                        <p className="text-sm text-gray-500">{payment.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatPrice(payment.amount)}</p>
                        <p className="text-xs text-gray-400">{formatDate(payment.paymentDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {payments.length} of {pagination.total} payments
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                      disabled={pagination.current === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-sm text-gray-600">
                      Page {pagination.current} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                      disabled={pagination.current === pagination.pages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    </ProtectedPage>
  );
}