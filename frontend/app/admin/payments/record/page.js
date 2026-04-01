// frontend/app/admin/payments/record/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function RecordPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    method: "cash",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0) {
      const order = orders.find((o) => o._id === preselectedOrderId);
      if (order) {
        selectOrder(order);
      }
    }
  }, [preselectedOrderId, orders]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/admin/orders?status=pending&status=confirmed&status=packed&status=shipped&status=out_for_delivery&status=delivered&limit=200`,
        { headers: getAuthHeaders() }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const pendingPaymentOrders = (data.data.orders || []).filter(
            (order) =>
              order.paymentStatus !== "paid" && order.status !== "cancelled"
          );
          setOrders(pendingPaymentOrders);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    const outstanding = order.totalAmount - (order.payment?.amountPaid || 0);
    setFormData((prev) => ({
      ...prev,
      orderId: order._id,
      amount: outstanding.toString(),
    }));
  };

  const clearSelection = () => {
    setSelectedOrder(null);
    setFormData((prev) => ({
      ...prev,
      orderId: "",
      amount: "",
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.orderId || !formData.amount) {
      setError("Please select an order and enter amount");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          amount: parseFloat(formData.amount),
          method: formData.method,
          notes: formData.notes,
          paymentDate: formData.paymentDate,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Payment recorded successfully!");
        setTimeout(() => router.push("/admin/payments"), 1500);
      } else {
        setError(data.message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(search) ||
      order.customerSnapshot?.name?.toLowerCase().includes(search) ||
      order.customerSnapshot?.phone?.includes(search) ||
      order.customerSnapshot?.businessName?.toLowerCase().includes(search)
    );
  });

  const paymentMethods = [
    {
      value: "cash",
      label: "Cash",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      value: "bank_transfer",
      label: "Bank Transfer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
    },
    {
      value: "upi",
      label: "UPI",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      value: "cheque",
      label: "Cheque",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      value: "credit_note",
      label: "Credit Note",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      value: "other",
      label: "Other",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="flex items-center justify-between py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/payments"
              className="group p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
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
                  Record Payment
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  New
                </span>
              </div>
              <p className="text-xs text-gray-900 mt-0.5 hidden sm:block">
                Record a new payment for an existing order
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/payments"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-gray-700 hover:text-gray-900 
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
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedOrder || !formData.amount}
              className={`group relative px-6 sm:px-7 py-2.5 font-semibold text-sm transition-all duration-200 
                         flex items-center gap-2 rounded-xl overflow-hidden ${
                           submitting || !selectedOrder || !formData.amount
                             ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                             : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
                         }`}
            >
              {submitting ? (
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
                  <span>Recording...</span>
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
                  <span>Record Payment</span>
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
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
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
      <form onSubmit={handleSubmit} className="mt-8 pb-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* ═══════════════════════════ LEFT COLUMN - Order Selection ═══════════════════════════ */}
          <div className="xl:col-span-7 space-y-6">
            {/* ── Order Selection Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedOrder ? "Selected Order" : "Select Order"}
                      </h3>
                      <p className="text-xs text-gray-900">
                        {selectedOrder
                          ? "Order details and payment summary"
                          : "Choose an order with pending payment"}
                      </p>
                    </div>
                  </div>
                  {selectedOrder && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 
                                 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      Change Order
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {selectedOrder ? (
                  <div className="space-y-5">
                    {/* Selected Order Details */}
                    <div className=" pt-100 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-lg">
                              {selectedOrder.orderNumber}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                selectedOrder.status === "delivered"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : selectedOrder.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {selectedOrder.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mt-1">
                            {selectedOrder.customerSnapshot?.name}
                          </p>
                          <p className="text-xs text-gray-900">
                            {selectedOrder.customerSnapshot?.phone}
                          </p>
                          {selectedOrder.customerSnapshot?.businessName && (
                            <p className="text-xs text-gray-900 mt-1 flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
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
                              {selectedOrder.customerSnapshot.businessName}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-900">
                          {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>

                      {/* Payment Summary */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-amber-200/60">
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <p className="text-xs text-gray-900 mb-1">Total Amount</p>
                          <p className="font-bold text-gray-900">
                            {formatPrice(selectedOrder.totalAmount)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <p className="text-xs text-gray-900 mb-1">Already Paid</p>
                          <p className="font-bold text-emerald-600">
                            {formatPrice(selectedOrder.payment?.amountPaid || 0)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <p className="text-xs text-gray-900 mb-1">Outstanding</p>
                          <p className="font-bold text-red-600 text-lg">
                            {formatPrice(
                              selectedOrder.totalAmount -
                                (selectedOrder.payment?.amountPaid || 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div className="border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                          Order Items ({selectedOrder.items.length})
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedOrder.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-900 truncate flex-1">
                                {item.productSnapshot?.title || "Product"}
                              </span>
                              <span className="text-gray-900 mx-2">
                                x {item.quantity}
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatPrice(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                          {selectedOrder.items.length > 3 && (
                            <p className="text-xs text-gray-900 pt-1">
                              +{selectedOrder.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search */}
                    <div className="pb-2  relative">
                      <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
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
                        placeholder="Search by order number, customer name, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                   text-gray-900 placeholder:text-gray-500 transition-all duration-200
                                   hover:border-gray-300"
                      />
                    </div>

                    {/* Orders List */}
                    <div className="mb-2 max-h-[400px] overflow-y-auto space-y-3 pr-1">
                      {loading ? (
                        <div className="py-12 text-center">
                          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-gray-900 mt-3 text-sm">
                            Loading orders...
                          </p>
                        </div>
                      ) : filteredOrders.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <svg
                              className="w-7 h-7 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-900 font-medium">
                            No orders with pending payments
                          </p>
                          <p className="text-gray-900 text-sm mt-1">
                            All orders are fully paid
                          </p>
                        </div>
                      ) : (
                        filteredOrders.map((order) => {
                          const outstanding =
                            order.totalAmount - (order.payment?.amountPaid || 0);
                          return (
                            <button
                              key={order._id}
                              type="button"
                              onClick={() => selectOrder(order)}
                              className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-xl 
                                         hover:border-amber-400 hover:bg-amber-50/50 transition-all duration-200
                                         group"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                                      {order.orderNumber}
                                    </p>
                                    <span
                                      className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                                        order.paymentStatus === "partial"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {order.paymentStatus === "partial"
                                        ? "Partial"
                                        : "Unpaid"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-900 mt-0.5 truncate">
                                    {order.customerSnapshot?.name}
                                  </p>
                                  <p className="text-xs text-gray-900">
                                    {formatDate(order.createdAt)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="text-xs text-gray-900">
                                    Outstanding
                                  </p>
                                  <p className="font-bold text-red-600">
                                    {formatPrice(outstanding)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Orders Count */}
                    {!loading && filteredOrders.length > 0 && (
                      <p className="text-xs text-gray-900 text-center pt-2">
                        Showing {filteredOrders.length} order
                        {filteredOrders.length !== 1 ? "s" : ""} with pending
                        payments
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════ RIGHT COLUMN - Payment Details ═══════════════════════════ */}
          <div className="xl:col-span-5 space-y-6">
            {/* ── Payment Details Card ── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
                      Payment Details
                    </h3>
                    <p className="text-xs text-gray-900">
                      Enter payment information
                    </p>
                  </div>
                </div>
              </div>

              <div className="pb-2 p-6 space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Payment Amount{" "}
                    <span className="text-red-500 text-xs">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-semibold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                                 text-gray-900 text-xl font-bold placeholder:text-gray-500 
                                 placeholder:font-normal transition-all duration-200 hover:border-gray-300
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="0.00"
                      required
                      disabled={!selectedOrder}
                    />
                  </div>
                  {selectedOrder && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-900">
                        Max:{" "}
                        {formatPrice(
                          selectedOrder.totalAmount -
                            (selectedOrder.payment?.amountPaid || 0)
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: (
                              selectedOrder.totalAmount -
                              (selectedOrder.payment?.amountPaid || 0)
                            ).toString(),
                          }))
                        }
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                      >
                        Pay Full Amount
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Payment Method{" "}
                    <span className="text-red-500 text-xs">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            method: method.value,
                          }))
                        }
                        disabled={!selectedOrder}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 text-center
                                    disabled:opacity-50 disabled:cursor-not-allowed ${
                                      formData.method === method.value
                                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-400/20"
                                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                                    }`}
                      >
                        <div
                          className={`flex justify-center mb-1.5 ${
                            formData.method === method.value
                              ? "text-amber-600"
                              : "text-gray-700"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            formData.method === method.value
                              ? "text-amber-700"
                              : "text-gray-900"
                          }`}
                        >
                          {method.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                               text-gray-900 transition-all duration-200 hover:border-gray-300
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedOrder}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes{" "}
                    <span className="text-gray-700 text-xs font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                               text-gray-900 placeholder:text-gray-500 resize-none transition-all duration-200
                               hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={3}
                    placeholder="Any additional notes about this payment..."
                    disabled={!selectedOrder}
                  />
                </div>
              </div>
            </div>

            {/* ── Payment Summary Card ── */}
            {selectedOrder && formData.amount && (
              <div className="mt-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Order Total</span>
                    <span className="font-medium">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Previously Paid</span>
                    <span className="font-medium text-emerald-400">
                      {formatPrice(selectedOrder.payment?.amountPaid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">This Payment</span>
                    <span className="font-bold text-amber-400 text-lg">
                      {formatPrice(parseFloat(formData.amount) || 0)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-700 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Remaining After</span>
                    <span
                      className={`font-bold text-lg ${
                        selectedOrder.totalAmount -
                          (selectedOrder.payment?.amountPaid || 0) -
                          (parseFloat(formData.amount) || 0) <=
                        0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatPrice(
                        Math.max(
                          0,
                          selectedOrder.totalAmount -
                            (selectedOrder.payment?.amountPaid || 0) -
                            (parseFloat(formData.amount) || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
                {selectedOrder.totalAmount -
                  (selectedOrder.payment?.amountPaid || 0) -
                  (parseFloat(formData.amount) || 0) <=
                  0 && (
                  <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-emerald-400 font-medium">
                      This will mark the order as fully paid
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* ─── Mobile Bottom Bar ─── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-30">
        <div className="flex gap-3 ml-0 sm:ml-64 max-w-2xl mx-auto">
          <Link
            href="/admin/payments"
            className="flex-1 py-3.5 text-center text-gray-900 font-semibold border border-gray-200 
                       bg-white rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedOrder || !formData.amount}
            className={`flex-[2] py-3.5 font-semibold flex items-center justify-center gap-2 rounded-xl 
                        text-sm transition-all duration-200 ${
                          submitting || !selectedOrder || !formData.amount
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 active:scale-[0.98]"
                        }`}
          >
            {submitting ? (
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
                Recording...
              </>
            ) : (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Record Payment
              </>
            )}
          </button>
        </div>
      </div>
      <div className="xl:hidden h-24" />
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <ProtectedPage permission="managePayments">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <RecordPaymentContent />
      </Suspense>
    </ProtectedPage>
  );
}