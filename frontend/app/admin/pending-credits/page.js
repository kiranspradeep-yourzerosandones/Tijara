// frontend/app/admin/pending-credits/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PendingCredits() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    totalPending: 0,
    totalOverdue: 0,
    ordersCount: 0,
    customersCount: 0
  });

  useEffect(() => {
    fetchPendingCredits();
  }, [filter]);

  const fetchPendingCredits = async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`${API_URL}/admin/orders?paymentStatus=pending&paymentStatus=partial`, {
        headers: getAuthHeaders()
      });
      
      const data = await res.json();

      if (data.success) {
        setOrders(data.data.orders || []);
        
        const pendingOrders = data.data.orders || [];
        const totalPending = pendingOrders.reduce((sum, o) => sum + (o.totalAmount - (o.payment?.amountPaid || 0)), 0);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const overdueOrders = pendingOrders.filter(o => new Date(o.createdAt) < thirtyDaysAgo);
        const totalOverdue = overdueOrders.reduce((sum, o) => sum + (o.totalAmount - (o.payment?.amountPaid || 0)), 0);

        setStats({
          totalPending,
          totalOverdue,
          ordersCount: pendingOrders.length,
          customersCount: [...new Set(pendingOrders.map(o => o.user?._id))].length
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

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
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const isOverdue = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return days > 30;
  };

  return (
    <ProtectedPage permission="managePayments">
      <div className="w-full min-h-screen">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 max-w-[1600px] mx-auto">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Pending Credits
                </h1>
                {stats.totalPending > 0 && (
                  <span className="inline-flex px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    {formatPrice(stats.totalPending)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Track and manage customer credit balances
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="px-5 py-2.5 font-semibold text-sm bg-amber-400 hover:bg-amber-500 
                         text-gray-900 rounded-xl shadow-sm transition-all"
            >
              Record Payment
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Pending</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(stats.totalPending)}</p>
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
                <p className="text-xs text-gray-500 font-medium">Overdue (30+ days)</p>
                <p className="text-xl font-bold text-amber-600">{formatPrice(stats.totalOverdue)}</p>
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
                <p className="text-xs text-gray-500 font-medium">Pending Orders</p>
                <p className="text-xl font-bold text-gray-900">{stats.ordersCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Customers</p>
                <p className="text-xl font-bold text-gray-900">{stats.customersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 flex gap-2 overflow-x-auto">
            {[
              { id: "all", label: "All Pending" },
              { id: "overdue", label: "Overdue" },
              { id: "thisWeek", label: "This Week" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="mt-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
                <p className="text-gray-500 mt-2">No pending credits at the moment</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const outstanding = order.totalAmount - (order.payment?.amountPaid || 0);
                  const overdue = isOverdue(order.createdAt);

                  return (
                    <div key={order._id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                              href={`/admin/orders/${order._id}`}
                              className="font-semibold text-gray-900 hover:text-amber-600"
                            >
                              {order.orderNumber}
                            </Link>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              overdue 
                                ? "bg-red-100 text-red-700" 
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {overdue ? "Overdue" : "Pending"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                            <span>{order.customerSnapshot?.name || order.user?.name}</span>
                            <span>•</span>
                            <span>{order.customerSnapshot?.phone || order.user?.phone}</span>
                            <span>•</span>
                            <span>{getDaysAgo(order.createdAt)}</span>
                          </div>
                          {order.customerSnapshot?.businessName && (
                            <p className="text-xs text-gray-400 mt-1">
                              {order.customerSnapshot.businessName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{formatPrice(outstanding)}</p>
                          <p className="text-xs text-gray-400">
                            of {formatPrice(order.totalAmount)}
                          </p>
                          {order.payment?.amountPaid > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                              Paid: {formatPrice(order.payment.amountPaid)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 
                                     hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          View Order
                        </Link>
                        <Link
                          href={`/admin/payments/record?orderId=${order._id}`}
                          className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 
                                     hover:bg-amber-200 rounded-lg transition-colors"
                        >
                          Record Payment
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}