// frontend\app\admin\dashboard\page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products");
      const data = await res.json();
      
      const products = data.products || data || [];
      
      setStats({
        totalProducts: products.length,
        totalCategories: [...new Set(products.map(p => p.category).filter(Boolean))].length,
        pendingOrders: 0,
        completedOrders: 0
      });
      
      setRecentProducts(products.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "bg-[#ffe494]",
      link: "/admin/products"
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: "bg-gray-100",
      link: "/admin/categories"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-orange-100",
      link: "/admin/orders"
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-green-100",
      link: "/admin/orders"
    }
  ];

  return (
    <div className="space-y-6">

      {/* Welcome Section */}
      <div className="bg-[#ffe494] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Welcome back, Admin!</h2>
          <p className="text-black/70 mt-1">Here's what's happening with your store today.</p>
        </div>
        <Link
          href="/admin/products/add-product"
          className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Link key={index} href={card.link}>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#ffe494] hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-black mt-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.color} text-black`}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-black mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link
              href="/admin/products/add-product"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#ffe494]/20 hover:bg-[#ffe494]/40 transition-colors"
            >
              <div className="p-2 bg-[#ffe494] rounded-lg">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-black">Add New Product</p>
                <p className="text-sm text-gray-500">Create a new product</p>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-black">Manage Categories</p>
                <p className="text-sm text-gray-500">Add or edit categories</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-black">View Orders</p>
                <p className="text-sm text-gray-500">Check mobile app orders</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-black">Recent Products</h3>
            <Link href="/admin/products" className="text-sm text-gray-500 hover:text-black">
              View All
            </Link>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-3 border-[#ffe494] border-t-transparent rounded-full"></div>
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500">No products yet</p>
                <Link
                  href="/admin/products/add-product"
                  className="inline-block mt-4 text-black font-medium hover:underline"
                >
                  Add your first product
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div key={product._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <img
                          src={`http://localhost:5000${product.images[0]}`}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-black truncate">{product.title}</h4>
                      <p className="text-sm text-gray-500">{product.category || "Uncategorized"}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-black rounded-2xl p-6 flex items-center gap-6">
        <div className="p-4 bg-[#ffe494] rounded-xl">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">Mobile App Coming Soon</h3>
          <p className="text-gray-400 mt-1">Users will be able to order products through the mobile app. Orders will appear here.</p>
        </div>
      </div>
    </div>
  );
}