// frontend/app/admin/payments/page.js
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

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    amount: "",
    method: "cash",
    notes: ""
  });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, [filter, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/admin/payments?limit=50`;
      if (filter !== "all") url += `&method=${filter}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.data.payments || []);
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
          setStats({
            totalPayments: data.data.stats?.totalPayments || 0,
            totalAmount: data.data.stats?.totalAmount || 0,
            todayAmount: 0,
            thisMonthAmount: 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/orders?paymentStatus=pending&paymentStatus=partial&limit=100`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.orders || []);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.orderId || !paymentForm.amount) return;

    setRecordingPayment(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: paymentForm.orderId,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          notes: paymentForm.notes
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowRecordModal(false);
        setPaymentForm({ orderId: "", amount: "", method: "cash", notes: "" });
        setSelectedOrder(null);
        fetchPayments();
        fetchPaymentStats();
        alert("Payment recorded successfully!");
      } else {
        alert(data.message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const openRecordModal = () => {
    fetchPendingOrders();
    setShowRecordModal(true);
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setPaymentForm(prev => ({
      ...prev,
      orderId: order._id,
      amount: (order.totalAmount - (order.payment?.amountPaid || 0)).toString()
    }));
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
      other: "bg-gray-100 text-gray-600"
    };
    const labels = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      cheque: "Cheque",
      credit_note: "Credit Note",
      other: "Other"
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${styles[method] || styles.other}`}>
        {labels[method] || method}
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
            <button
              onClick={openRecordModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 
                       text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 mb-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-white text-black rounded-2xl mb-2 border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by payment ID, order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>

            {/* Method Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
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
                <button
                  onClick={openRecordModal}
                  className="mt-4 px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Record Payment
                </button>
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
                          <Link href={`/admin/orders/${payment.order?._id}`} className="text-blue-600 hover:text-blue-700 font-medium">
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/payments/${payment._id}`}
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
                      {getMethodBadge(payment.method)}
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
            </>
          )}
        </div>

        {/* Record Payment Modal */}
        {showRecordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRecordModal(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
                <button onClick={() => setShowRecordModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {!selectedOrder ? (
                  <>
                    <p className="text-sm text-gray-500 mb-4">Select an order with pending payment:</p>
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No pending orders found</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => selectOrder(order)}
                            className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">{order.customerSnapshot?.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                                <p className="text-xs text-red-600">
                                  Due: {formatPrice(order.totalAmount - (order.payment?.amountPaid || 0))}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    {/* Selected Order Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
                          <p className="text-sm text-gray-500">{selectedOrder.customerSnapshot?.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(null);
                            setPaymentForm(prev => ({ ...prev, orderId: "", amount: "" }));
                          }}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Change
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
                        <span className="text-gray-500">Outstanding:</span>
                        <span className="font-bold text-red-600">
                          {formatPrice(selectedOrder.totalAmount - (selectedOrder.payment?.amountPaid || 0))}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 resize-none"
                        rows={3}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={recordingPayment}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {recordingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Record Payment
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}