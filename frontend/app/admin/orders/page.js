// frontend/app/admin/orders/page.js
"use client";

import { useState, useEffect } from "react";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Orders() {
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    allOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
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
        setStats(data.data?.stats || {
          allOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filterTabs = [
    { id: "all", label: "All Orders", count: stats.allOrders || 0 },
    { id: "pending", label: "Pending", count: stats.pendingOrders || 0 },
    { id: "processing", label: "Processing", count: stats.processingOrders || 0 },
    { id: "shipped", label: "Shipped", count: stats.shippedOrders || 0 },
    { id: "delivered", label: "Delivered", count: stats.deliveredOrders || 0 }
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
        </div>

        {/* Filter Tabs */}
        <div className="bg-white mb-3 rounded-2xl border border-gray-100 p-2 flex gap-2 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? "bg-amber-100 text-amber-900"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.id ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
            </button>
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
              <h3 className="text-2xl font-bold text-gray-900">No Orders Yet</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Orders from the mobile app will appear here. Once users start ordering products, you can manage them from this page.
              </p>

              <div className="mt-8 max-w-md mx-auto bg-amber-50 rounded-xl p-6 text-left">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How it works
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</span>
                    Users browse products on mobile app
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</span>
                    They place orders through the app
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</span>
                    Orders appear here for you to manage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">4</span>
                    Update order status & track deliveries
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Products</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.user?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{order.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                        order.status === "processing" ? "bg-amber-100 text-amber-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}