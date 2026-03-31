// frontend/app/admin/orders/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  on_the_way: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  on_the_way: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export default function Orders() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    packedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`${API_URL}/admin/orders${query}`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data?.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/orders/stats`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data.data?.stats || {});
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleViewOrder = (orderId) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const filterTabs = [
    { id: "all", label: "All Orders", count: stats.totalOrders || 0 },
    { id: "pending", label: "Pending", count: stats.pendingOrders || 0 },
    { id: "confirmed", label: "Confirmed", count: stats.confirmedOrders || 0 },
    { id: "packed", label: "Packed", count: stats.packedOrders || 0 },
    { id: "shipped", label: "Shipped", count: stats.shippedOrders || 0 },
    { id: "delivered", label: "Delivered", count: stats.deliveredOrders || 0 },
    { id: "cancelled", label: "Cancelled", count: stats.cancelledOrders || 0 }
  ];

  return (
    <ProtectedPage permission="manageOrders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500">Manage orders from mobile app</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid mb-5 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {filterTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                filter === tab.id
                  ? "bg-amber-500 text-white shadow-lg scale-105"
                  : "bg-white border border-gray-100 hover:border-amber-200"
              }`}
            >
              <p className={`text-2xl font-bold ${filter === tab.id ? "text-white" : "text-gray-900"}`}>
                {tab.count}
              </p>
              <p className={`text-xs ${filter === tab.id ? "text-amber-100" : "text-gray-500"}`}>
                {tab.label}
              </p>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">No Orders Found</h3>
              <p className="text-gray-500 mt-2">
                {filter !== "all" 
                  ? `No ${filter} orders at the moment` 
                  : "Orders from the mobile app will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Items</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Payment</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewOrder(order._id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customerSnapshot?.name || order.user?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{order.customerSnapshot?.phone || ""}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.totalItems || order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{order.totalAmount?.toLocaleString()}
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
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order._id);
                          }}
                          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}