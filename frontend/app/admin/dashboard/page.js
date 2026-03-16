// frontend/app/admin/dashboard/page.js
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
      
      const products = Array.isArray(data?.products) 
        ? data.products 
        : Array.isArray(data) 
        ? data 
        : [];
      
      const categories = products
        .map(p => p?.category)
        .filter(cat => cat && cat.trim() !== "");
      
      const uniqueCategories = [...new Set(categories)];
      
      setStats({
        totalProducts: products.length,
        totalCategories: uniqueCategories.length,
        pendingOrders: 0,
        completedOrders: 0
      });
      
      setRecentProducts(products.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bgColor: "bg-[#ffe494]",
      iconBg: "bg-amber-300/50",
      link: "/admin/products"
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      bgColor: "bg-[#ffe494]",
      iconBg: "bg-blue-300/50",
      link: "/admin/categories"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-[#ffe494]",
      iconBg: "bg-orange-300/50",
      link: "/admin/orders"
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-[#ffe494]",
      iconBg: "bg-emerald-300/50",
      link: "/admin/orders"
    }
  ];

  const quickActions = [
    {
      title: "Add New Product",
      description: "Create a new product listing",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      link: "/admin/products/add-product",
      color: "bg-amber-50 hover:bg-amber-100 border-amber-200",
      iconColor: "bg-amber-400 text-white"
    },
    {
      title: "Manage Categories",
      description: "Add or edit categories",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      link: "/admin/categories",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "bg-blue-400 text-white"
    },
    {
      title: "View Orders",
      description: "Check all orders",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      link: "/admin/orders",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconColor: "bg-purple-400 text-white"
    },
    {
      title: "Manage Users",
      description: "View all customers",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      link: "/admin/users",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "bg-green-400 text-white"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8 ">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-[#ffe494] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-14 h-14 bg-amber-400 rounded-2xl items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">T</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Welcome back, Admin! 👋
              </h2>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">
                Manage your products and track orders from here.
              </p>
            </div>
          </div>
          
          <Link
            href="/admin/products/add-product"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 px-5 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-amber-400/25 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link key={index} href={card.link} className="group">
            <div className={`${card.bgColor} rounded-2xl p-5 sm:p-6 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm font-medium">{card.title}</p>
                  <p className="text-2xl sm:text-4xl font-bold mt-2">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-white/20 animate-pulse rounded"></span>
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`${card.iconBg} p-2.5 sm:p-3 rounded-xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Quick Actions */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              <p className="text-gray-500 text-sm mt-1">Common tasks at a glance</p>
            </div>
            
            <div className="p-4 sm:p-5 space-y-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.link}>
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${action.color} transition-all duration-200 group cursor-pointer`}>
                    <div className={`${action.iconColor} p-2.5 rounded-xl transition-transform group-hover:scale-110`}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{action.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{action.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Products</h3>
                <p className="text-gray-500 text-sm mt-1">Latest added products</p>
              </div>
              <Link 
                href="/admin/products" 
                className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-gray-100 rounded mb-2"></div>
                        <div className="w-20 h-3 bg-gray-100 rounded"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : recentProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-1">No products yet</h4>
                  <p className="text-gray-500 text-sm mb-6">Start by adding your first product</p>
                  <Link
                    href="/admin/products/add-product"
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProducts.map((product, index) => (
                    <Link
                      key={product._id}
                      href={`/admin/products/view/${product.slug || product._id}`}
                      className="flex items-center gap-4 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-all group"
                    >
                      {/* Product Image */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images && product.images[0] ? (
                          <img
                            src={`http://localhost:5000${product.images[0]}`}
                            alt={product.title || "Product"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base group-hover:text-amber-600 transition-colors">
                          {product.title || "Untitled Product"}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {product.category || "Uncategorized"}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        product.isActive 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      
                      {/* Mobile Status Dot */}
                      <span className={`sm:hidden w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        product.isActive ? "bg-emerald-500" : "bg-red-500"
                      }`}></span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 bg-[#ffe494] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute right-0 top-0 h-full" viewBox="0 0 400 400" fill="none">
            <circle cx="300" cy="200" r="200" fill="white"/>
          </svg>
        </div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg sm:text-xl">Mobile App Coming Soon! 📱</h3>
            <p className="text-blue-300 mt-1 text-sm sm:text-base">
              Your customers will be able to browse and order products directly from their phones.
            </p>
          </div>
          <button className="bg-white hover:bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Learn More
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Orders Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹0</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Revenue Today</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">New Customers</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">100%</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">System Health</p>
        </div>
      </div>
    </div>
  );
}