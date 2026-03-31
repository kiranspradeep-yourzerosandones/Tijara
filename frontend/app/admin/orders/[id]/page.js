// frontend/app/admin/orders/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Status configuration
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: "🕐",
    description: "Order placed, waiting for confirmation"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: "✓",
    description: "Order confirmed by admin"
  },
  packed: {
    label: "Packed",
    color: "bg-indigo-100 text-indigo-800",
    icon: "📦",
    description: "Order packed and ready for shipping"
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
    icon: "🚚",
    description: "Order dispatched for delivery"
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-cyan-100 text-cyan-800",
    icon: "🛵",
    description: "Order is out for delivery"
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: "✅",
    description: "Order delivered successfully"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: "❌",
    description: "Order cancelled"
  }
};

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  partial: { label: "Partial", color: "bg-orange-100 text-orange-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" }
};

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Payment update modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: "",
    amountPaid: 0,
    method: "cash",
    notes: ""
  });

  // Expected dates modal
  const [showExpectedDatesModal, setShowExpectedDatesModal] = useState(false);
  const [expectedDatesData, setExpectedDatesData] = useState({
    expectedDeliveryDate: "",
    expectedConfirmDate: "",
    expectedPackDate: "",
    expectedShipDate: "",
    expectedOutForDeliveryDate: "",
    note: ""
  });

  // Delay modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayData, setDelayData] = useState({
    delayReason: "",
    newExpectedDeliveryDate: ""
  });

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error("Failed to fetch order");
      }

      const data = await res.json();
      setOrder(data.data?.order);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedStatus) return;

    try {
      setUpdating(true);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: selectedStatus,
          note: statusNote || `Status updated to ${selectedStatus}`
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      await fetchOrder();
      setShowStatusModal(false);
      setSelectedStatus("");
      setStatusNote("");

      alert("Order status updated successfully!");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async () => {
    try {
      setUpdating(true);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}/payment`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update payment");
      }

      await fetchOrder();
      setShowPaymentModal(false);
      setPaymentData({ paymentStatus: "", amountPaid: 0, method: "cash", notes: "" });

      alert("Payment status updated successfully!");
    } catch (err) {
      console.error("Error updating payment:", err);
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const updateExpectedDates = async () => {
    if (!expectedDatesData.expectedDeliveryDate) {
      alert("Please select expected delivery date");
      return;
    }

    try {
      setUpdating(true);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}/expected-dates`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(expectedDatesData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update expected dates");
      }

      await fetchOrder();
      setShowExpectedDatesModal(false);
      setExpectedDatesData({
        expectedDeliveryDate: "",
        expectedConfirmDate: "",
        expectedPackDate: "",
        expectedShipDate: "",
        expectedOutForDeliveryDate: "",
        note: ""
      });

      alert("Expected delivery dates updated successfully!");
    } catch (err) {
      console.error("Error updating expected dates:", err);
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const markAsDelayed = async () => {
    if (!delayData.delayReason) {
      alert("Please enter delay reason");
      return;
    }

    try {
      setUpdating(true);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}/delay`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isDelayed: true,
          delayReason: delayData.delayReason,
          newExpectedDeliveryDate: delayData.newExpectedDeliveryDate || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to mark as delayed");
      }

      await fetchOrder();
      setShowDelayModal(false);
      setDelayData({ delayReason: "", newExpectedDeliveryDate: "" });

      alert("Order marked as delayed!");
    } catch (err) {
      console.error("Error marking delayed:", err);
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const removeDelay = async () => {
    try {
      setUpdating(true);

      const res = await fetch(`${API_URL}/admin/orders/${orderId}/delay`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isDelayed: false
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove delay");
      }

      await fetchOrder();
      alert("Delay status removed!");
    } catch (err) {
      console.error("Error removing delay:", err);
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Build tracking timeline for display
  const buildTrackingTimeline = () => {
    const allSteps = [
      { key: "pending", label: "Order Placed", icon: "🕐" },
      { key: "confirmed", label: "Confirmed", icon: "✓" },
      { key: "packed", label: "Packed", icon: "📦" },
      { key: "shipped", label: "Shipped", icon: "🚚" },
      { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
      { key: "delivered", label: "Delivered", icon: "✅" }
    ];

    if (order?.status === "cancelled") {
      return [{
        key: "cancelled",
        label: "Cancelled",
        icon: "❌",
        isCompleted: true,
        isCurrent: true,
        date: order.cancelledAt,
        note: order.cancellation?.reason
      }];
    }

    const statusOrder = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
    const currentIndex = statusOrder.indexOf(order?.status || "pending");

    return allSteps.map((step, index) => {
      const isCompleted = index <= currentIndex;
      const isCurrent = index === currentIndex;
      const isPending = index > currentIndex;

      // Get expected date from expectedTimeline
      const expectedInfo = order?.expectedTimeline?.[step.key];
      
      // Get actual date from status history
      let actualDate = null;
      if (step.key === "pending") {
        actualDate = order?.createdAt;
      } else {
        const historyEntry = order?.statusHistory?.find(h => h.status === step.key);
        actualDate = historyEntry?.timestamp || expectedInfo?.actualDate;
      }

      // Check if delayed
      const now = new Date();
      const isDelayed = isPending && expectedInfo?.expectedDate && now > new Date(expectedInfo.expectedDate);

      return {
        ...step,
        isCompleted,
        isCurrent,
        isPending,
        isDelayed,
        expectedDate: expectedInfo?.expectedDate,
        actualDate,
        note: expectedInfo?.note
      };
    });
  };

  if (loading) {
    return (
      <ProtectedPage permission="manageOrders">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium">Loading order details...</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  if (error || !order) {
    return (
      <ProtectedPage permission="manageOrders">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The order you're looking for doesn't exist."}</p>
          <Link href="/admin/orders" className="text-amber-600 hover:text-amber-700 font-medium">
            ← Back to Orders
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const nextStatuses = order.nextStatuses || [];
  const trackingTimeline = buildTrackingTimeline();

  return (
    <ProtectedPage permission="manageOrders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Delay Badge */}
            {order.isDelayed && (
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                ⚠️ Delayed
              </span>
            )}
            {/* Current Status Badge */}
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${currentStatus.color}`}>
              {currentStatus.icon} {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Delay Banner */}
        {order.isDelayed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Order Delayed</h3>
              {order.delayReason && (
                <p className="text-yellow-700 text-sm mt-1">{order.delayReason}</p>
              )}
              {order.expectedDeliveryDate && (
                <p className="text-yellow-600 text-sm mt-1">
                  New expected delivery: {formatDateShort(order.expectedDeliveryDate)}
                </p>
              )}
            </div>
            <button
              onClick={removeDelay}
              disabled={updating}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              ✓ Mark On-Time
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.productSnapshot?.image ? (
                        <img
                          src={`${API_URL.replace('/api', '')}${item.productSnapshot.image}`}
                          alt={item.productSnapshot.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.productSnapshot?.title}</h3>
                      <p className="text-sm text-gray-500">
                        {item.productSnapshot?.brand} • {item.productSnapshot?.unit}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery</span>
                    <span className="text-gray-900">
                      {order.deliveryCharges > 0 ? formatCurrency(order.deliveryCharges) : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Tracking Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Tracking</h2>
                {order.expectedDeliveryDate && (
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    order.isDelayed 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {order.isDelayed ? "⚠️" : "📅"} Expected: {formatDateShort(order.expectedDeliveryDate)}
                  </div>
                )}
              </div>

              <div className="space-y-0">
                {trackingTimeline.map((step, index) => {
                  const isLast = index === trackingTimeline.length - 1;

                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Left - Line and Dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                          step.isCompleted 
                            ? "bg-amber-400 border-amber-400 text-white" 
                            : step.isDelayed
                            ? "bg-yellow-100 border-yellow-400"
                            : "bg-gray-100 border-gray-300"
                        }`}>
                          {step.isCompleted ? "✓" : step.icon}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-12 my-1 ${
                            step.isCompleted && !step.isCurrent
                              ? "bg-amber-400"
                              : "bg-gray-200"
                          }`}></div>
                        )}
                      </div>

                      {/* Right - Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold ${
                            step.isCompleted 
                              ? "text-gray-900" 
                              : step.isDelayed 
                              ? "text-yellow-700"
                              : "text-gray-400"
                          }`}>
                            {step.label}
                          </h3>
                          {step.isDelayed && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              Delayed
                            </span>
                          )}
                          {step.isCurrent && !step.isCompleted && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                        </div>

                        {/* Dates */}
                        {step.isCompleted && step.actualDate && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Completed: {formatDate(step.actualDate)}
                          </p>
                        )}
                        {step.isPending && step.expectedDate && (
                          <p className={`text-sm mt-1 ${
                            step.isDelayed ? "text-yellow-600" : "text-gray-500"
                          }`}>
                            {step.isDelayed ? "⚠️ Was expected by: " : "Expected by: "}
                            {formatDateShort(step.expectedDate)}
                          </p>
                        )}
                        {step.note && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            Note: {step.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
              <div className="space-y-4">
                {order.statusHistory?.map((history, index) => {
                  const statusConf = STATUS_CONFIG[history.status] || STATUS_CONFIG.pending;
                  const isLast = index === order.statusHistory.length - 1;

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          isLast ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          {statusConf.icon}
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-full min-h-[40px] bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="font-semibold text-gray-900">{statusConf.label}</h3>
                          <span className="text-sm text-gray-500">{formatDate(history.timestamp)}</span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              {/* Update Status */}
              {nextStatuses.length > 0 && order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-black mb-2">
                    Update Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((status) => {
                      const conf = STATUS_CONFIG[status];
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setShowStatusModal(true);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                            status === "cancelled"
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-amber-200 text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          {conf?.icon} {conf?.label || status}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status completed message */}
              {(order.status === "delivered" || order.status === "cancelled") && (
                <div className={`p-4 rounded-lg mb-4 ${
                  order.status === "delivered" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  <p className="text-sm font-medium">
                    {order.status === "delivered" 
                      ? "✅ This order has been delivered" 
                      : "❌ This order has been cancelled"}
                  </p>
                </div>
              )}

              {/* Payment Status */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-black">Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    PAYMENT_STATUS_CONFIG[order.paymentStatus]?.color || "bg-gray-100"
                  }`}>
                    {PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}
                  </span>
                </div>
                <div className="text-sm text-gray-900 mb-3">
                  <p>Paid: {formatCurrency(order.payment?.amountPaid || 0)}</p>
                  <p>Outstanding: {formatCurrency(order.outstandingAmount || 0)}</p>
                </div>
                {order.status !== "cancelled" && order.paymentStatus !== "paid" && (
                  <button
                    onClick={() => {
                      setPaymentData({
                        paymentStatus: "paid",
                        amountPaid: order.totalAmount,
                        method: "cash",
                        notes: ""
                      });
                      setShowPaymentModal(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    💰 Mark as Paid
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Schedule Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 Delivery Schedule</h2>
              
              {/* Current Expected Date */}
              {order.expectedDeliveryDate ? (
                <div className={`p-4 rounded-lg mb-4 ${
                  order.isDelayed 
                    ? "bg-yellow-50 border border-yellow-200" 
                    : "bg-green-50 border border-green-200"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {order.isDelayed ? (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className={`font-semibold ${order.isDelayed ? "text-yellow-700" : "text-green-700"}`}>
                      {order.isDelayed ? "Delayed" : "On Track"}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    Expected: {formatDateShort(order.expectedDeliveryDate)}
                  </p>
                  {order.isDelayed && order.delayReason && (
                    <p className="text-yellow-700 text-sm mt-2">
                      Reason: {order.delayReason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm text-center">
                    No expected delivery date set
                  </p>
                </div>
              )}

              {/* Actions for non-completed orders */}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="space-y-3">
                  {/* Set/Update Expected Date */}
                  <button
                    onClick={() => {
                      setExpectedDatesData({
                        ...expectedDatesData,
                        expectedDeliveryDate: order.expectedDeliveryDate 
                          ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0]
                          : ""
                      });
                      setShowExpectedDatesModal(true);
                    }}
                    className="w-full px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {order.expectedDeliveryDate ? "Update Delivery Date" : "Set Delivery Date"}
                  </button>

                  {/* Mark as Delayed */}
                  {order.expectedDeliveryDate && !order.isDelayed && (
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="w-full px-4 py-2.5 border-2 border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Mark as Delayed
                    </button>
                  )}

                  {/* Remove Delay */}
                  {order.isDelayed && (
                    <button
                      onClick={removeDelay}
                      disabled={updating}
                      className="w-full px-4 py-2.5 border-2 border-green-400 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark as On-Time
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{order.customerSnapshot?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${order.customerSnapshot?.phone}`} className="font-medium text-amber-600">
                    {order.customerSnapshot?.phone || "N/A"}
                  </a>
                </div>
                {order.customerSnapshot?.businessName && (
                  <div>
                    <p className="text-sm text-gray-500">Business</p>
                    <p className="font-medium text-gray-900">{order.customerSnapshot.businessName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
              {order.deliveryAddress && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{order.deliveryAddress.shopName}</p>
                  <p className="text-gray-600">{order.deliveryAddress.addressLine1}</p>
                  {order.deliveryAddress.addressLine2 && (
                    <p className="text-gray-600">{order.deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </p>
                  <p className="text-gray-500 pt-2">
                    📞 {order.deliveryAddress.contactPhone}
                  </p>
                  {order.deliveryAddress.deliveryInstructions && (
                    <p className="text-gray-500 italic pt-2">
                      📝 {order.deliveryAddress.deliveryInstructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {order.customerNotes && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Notes</h2>
                <p className="text-sm text-gray-600 italic">"{order.customerNotes}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Order Status
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-900 mb-2">
                Change status from <strong>{STATUS_CONFIG[order.status]?.label}</strong> to{" "}
                <strong className="text-amber-600">{STATUS_CONFIG[selectedStatus]?.label}</strong>
              </p>
              <div className={`p-3 rounded-lg ${STATUS_CONFIG[selectedStatus]?.color || "bg-gray-100"}`}>
                <p className="text-sm">
                  {STATUS_CONFIG[selectedStatus]?.icon} {STATUS_CONFIG[selectedStatus]?.description}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-black mb-2">
                Note (optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note about this status change..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-black placeholder:text-gray-600"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus("");
                  setStatusNote("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={updating}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === "cancelled"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Update Payment Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentData.paymentStatus}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black bg-white"
                >
                  <option value="" className="text-gray-600">Select Status</option>
                  <option value="pending" className="text-black">Pending</option>
                  <option value="partial" className="text-black">Partial</option>
                  <option value="paid" className="text-black">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={paymentData.amountPaid}
                  onChange={(e) => setPaymentData({ ...paymentData, amountPaid: Number(e.target.value) })}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black placeholder:text-gray-600"
                  max={order.totalAmount}
                />
                <p className="text-xs text-gray-900 mt-1">Order Total: {formatCurrency(order.totalAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black bg-white"
                >
                  <option value="cash" className="text-black">Cash</option>
                  <option value="bank_transfer" className="text-black">Bank Transfer</option>
                  <option value="upi" className="text-black">UPI</option>
                  <option value="cheque" className="text-black">Cheque</option>
                  <option value="credit" className="text-black">Credit</option>
                  <option value="other" className="text-black">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Payment notes..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black placeholder:text-gray-600"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ paymentStatus: "", amountPaid: 0, method: "cash", notes: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={updatePaymentStatus}
                disabled={updating || !paymentData.paymentStatus}
                className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium ${
                  (updating || !paymentData.paymentStatus) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {updating ? "Updating..." : "Update Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expected Dates Modal */}
      {showExpectedDatesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📅 Set Expected Delivery Dates
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the expected delivery date. The system will automatically calculate expected dates for each step.
            </p>
            
            <div className="space-y-4">
              {/* Main Delivery Date */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <label className="block text-sm font-semibold text-black mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  value={expectedDatesData.expectedDeliveryDate}
                  onChange={(e) => setExpectedDatesData({ ...expectedDatesData, expectedDeliveryDate: e.target.value })}
                  min={getMinDate()}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                />
              </div>

              {/* Optional: Individual Step Dates */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                  ⚙️ Advanced: Set individual step dates (optional)
                </summary>
                <div className="p-4 space-y-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Expected Confirm Date
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedDatesData.expectedConfirmDate}
                      onChange={(e) => setExpectedDatesData({ ...expectedDatesData, expectedConfirmDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Expected Pack Date
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedDatesData.expectedPackDate}
                      onChange={(e) => setExpectedDatesData({ ...expectedDatesData, expectedPackDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Expected Ship Date
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedDatesData.expectedShipDate}
                      onChange={(e) => setExpectedDatesData({ ...expectedDatesData, expectedShipDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Expected Out for Delivery Date
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedDatesData.expectedOutForDeliveryDate}
                      onChange={(e) => setExpectedDatesData({ ...expectedDatesData, expectedOutForDeliveryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                    />
                  </div>
                </div>
              </details>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={expectedDatesData.note}
                  onChange={(e) => setExpectedDatesData({ ...expectedDatesData, note: e.target.value })}
                  placeholder="Add a note about the delivery schedule..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black placeholder:text-gray-600"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExpectedDatesModal(false);
                  setExpectedDatesData({
                    expectedDeliveryDate: "",
                    expectedConfirmDate: "",
                    expectedPackDate: "",
                    expectedShipDate: "",
                    expectedOutForDeliveryDate: "",
                    note: ""
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={updateExpectedDates}
                disabled={updating || !expectedDatesData.expectedDeliveryDate}
                className={`flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium ${
                  (updating || !expectedDatesData.expectedDeliveryDate) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {updating ? "Saving..." : "Save Dates"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Mark Order as Delayed
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Delay Reason *
                </label>
                <textarea
                  value={delayData.delayReason}
                  onChange={(e) => setDelayData({ ...delayData, delayReason: e.target.value })}
                  placeholder="Enter the reason for delay..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black placeholder:text-gray-600"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  New Expected Delivery Date (optional)
                </label>
                <input
                  type="date"
                  value={delayData.newExpectedDeliveryDate}
                  onChange={(e) => setDelayData({ ...delayData, newExpectedDeliveryDate: e.target.value })}
                  min={getMinDate()}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-black"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Leave empty to keep current expected date: {order.expectedDeliveryDate ? formatDateShort(order.expectedDeliveryDate) : "Not set"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDelayModal(false);
                  setDelayData({ delayReason: "", newExpectedDeliveryDate: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={markAsDelayed}
                disabled={updating || !delayData.delayReason}
                className={`flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium ${
                  (updating || !delayData.delayReason) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {updating ? "Saving..." : "Mark as Delayed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}