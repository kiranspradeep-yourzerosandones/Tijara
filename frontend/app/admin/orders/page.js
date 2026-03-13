"use client";

import { useState } from "react";

export default function Orders() {
  const [filter, setFilter] = useState("all");

  // Placeholder orders - will come from mobile app later
  const orders = [];

  const filterTabs = [
    { id: "all", label: "All Orders", count: 0 },
    { id: "pending", label: "Pending", count: 0 },
    { id: "processing", label: "Processing", count: 0 },
    { id: "shipped", label: "Shipped", count: 0 },
    { id: "delivered", label: "Delivered", count: 0 }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500">Manage orders from mobile app</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-2 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? "bg-[#ffe494] text-black"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === tab.id ? "bg-black text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-[#ffe494]/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-[#d4b85a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black">No Orders Yet</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Orders from the mobile app will appear here. Once users start ordering products, you can manage them from this page.
            </p>

            {/* Info Card */}
            <div className="mt-8 max-w-md mx-auto bg-[#ffe494]/20 rounded-xl p-6 text-left">
              <h4 className="font-semibold text-black flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#ffe494] rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">1</span>
                  Users browse products on mobile app
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#ffe494] rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">2</span>
                  They place orders through the app
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#ffe494] rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">3</span>
                  Orders appear here for you to manage
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-[#ffe494] rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">4</span>
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
              {/* Orders will be mapped here */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}