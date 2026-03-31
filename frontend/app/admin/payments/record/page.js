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
  
  const [formData, setFormData] = useState({
    orderId: "",
    amount: "",
    method: "cash",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0) {
      const order = orders.find(o => o._id === preselectedOrderId);
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
          // Filter orders with pending/partial payments
          const pendingPaymentOrders = (data.data.orders || []).filter(
            order => order.paymentStatus !== "paid" && order.status !== "cancelled"
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
    setFormData(prev => ({
      ...prev,
      orderId: order._id,
      amount: outstanding.toString()
    }));
  };

  const clearSelection = () => {
    setSelectedOrder(null);
    setFormData(prev => ({
      ...prev,
      orderId: "",
      amount: ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.orderId || !formData.amount) {
      alert("Please select an order and enter amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          amount: parseFloat(formData.amount),
          method: formData.method,
          notes: formData.notes,
          paymentDate: formData.paymentDate
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("Payment recorded successfully!");
        router.push("/admin/payments");
      } else {
        alert(data.message || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
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
      year: "numeric"
    });
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(search) ||
      order.customerSnapshot?.name?.toLowerCase().includes(search) ||
      order.customerSnapshot?.phone?.includes(search) ||
      order.customerSnapshot?.businessName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin/payments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
            <p className="text-gray-500 text-sm mt-1">Record a new payment for an order</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Selection */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedOrder ? "Selected Order" : "Select Order"}
          </h2>

          {selectedOrder ? (
            <div className="space-y-4">
              {/* Selected Order Card */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{selectedOrder.orderNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedOrder.customerSnapshot?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedOrder.customerSnapshot?.phone}
                    </p>
                    {selectedOrder.customerSnapshot?.businessName && (
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedOrder.customerSnapshot.businessName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={clearSelection}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-amber-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Amount</p>
                    <p className="font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Already Paid</p>
                    <p className="font-bold text-emerald-600">
                      {formatPrice(selectedOrder.payment?.amountPaid || 0)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Outstanding</p>
                    <p className="font-bold text-red-600 text-lg">
                      {formatPrice(selectedOrder.totalAmount - (selectedOrder.payment?.amountPaid || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by order number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                />
              </div>

              {/* Orders List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="py-8 text-center">
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">No orders with pending payments</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const outstanding = order.totalAmount - (order.payment?.amountPaid || 0);
                    return (
                      <button
                        key={order._id}
                        onClick={() => selectOrder(order)}
                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {order.customerSnapshot?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Outstanding</p>
                            <p className="font-bold text-red-600">{formatPrice(outstanding)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-lg font-semibold"
                  placeholder="0.00"
                  required
                  disabled={!selectedOrder}
                />
              </div>
              {selectedOrder && (
                <p className="text-xs text-gray-500 mt-1">
                  Max: {formatPrice(selectedOrder.totalAmount - (selectedOrder.payment?.amountPaid || 0))}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
                disabled={!selectedOrder}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="credit_note">Credit Note</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                disabled={!selectedOrder}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 resize-none"
                rows={3}
                placeholder="Any additional notes about this payment..."
                disabled={!selectedOrder}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedOrder || submitting || !formData.amount}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
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
        </div>
      </div>
    </div>
  );
}

export default function RecordPaymentPage() {
  return (
    <ProtectedPage permission="managePayments">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <RecordPaymentContent />
      </Suspense>
    </ProtectedPage>
  );
}