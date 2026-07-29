// frontend/app/admin/dashboard/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { productAPI, categoryAPI, userAPI, getAuthHeaders } from "@/lib/api";
import { getImageUrl, ImagePlaceholder } from "@/lib/imageHelper";
import { useAdminSse } from "@/context/AdminSseContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ---- Palette (kept consistent with the existing amber brand) ----
const COLORS = {
  amber: "#f5b544",
  amberSoft: "#ffe494",
  emerald: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  red: "#ef4444",
  gray: "#9ca3af",
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#6366f1",
  out_for_delivery: "#06b6d4",
  "out-for-delivery": "#06b6d4",
  delivered: "#10b981",
  completed: "#10b981",
  cancelled: "#ef4444",
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    todayOrders: 0,
    newCustomers: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);
  useAdminSse("new_order", () => {
    console.log("🛒 Dashboard: New order received — refreshing...");
    fetchDashboardData();
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsRes, categoriesRes, ordersRes, customersRes] = await Promise.allSettled([
        productAPI.getAll({ limit: 5, sort: "-createdAt" }),
        categoryAPI.getAll(),
        fetch(`${API_URL}/admin/orders?limit=500`, { headers: getAuthHeaders() }).then((r) => r.json()),
        userAPI.getAll({ limit: 1000 }),
      ]);

      // ========== PROCESS PRODUCTS ==========
      let products = [];
      let totalProducts = 0;
      if (productsRes.status === "fulfilled" && productsRes.value?.success) {
        const data = productsRes.value;
        products = data.data?.products || data.products || [];
        totalProducts = data.data?.total || data.total || products.length;
      }

      // ========== PROCESS CATEGORIES ==========
      let totalCategories = 0;
      if (categoriesRes.status === "fulfilled" && categoriesRes.value?.success) {
        const data = categoriesRes.value;
        const categories = data.categories || data.data?.categories || [];
        totalCategories = Array.isArray(categories) ? categories.length : 0;
      }

      // ========== PROCESS ORDERS ==========
      let pendingOrders = 0;
      let completedOrders = 0;
      let totalOrders = 0;
      let totalRevenue = 0;
      let pendingAmount = 0;
      let todayOrders = 0;
      let recentOrdersList = [];
      const statusCounts = {};
      const categoryTotals = {};
      const dayBuckets = {}; // "YYYY-MM-DD" -> { revenue, orders }

      if (ordersRes.status === "fulfilled" && ordersRes.value?.success) {
        const ordersData = ordersRes.value;
        const orders = ordersData.data?.orders || ordersData.orders || [];

        if (Array.isArray(orders)) {
          const activeOrders = orders.filter((o) => o.status !== "cancelled");
          totalOrders = activeOrders.length;
          recentOrdersList = orders.slice(0, 5);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // seed last 14 days so the trend chart has a continuous x-axis
          for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            dayBuckets[key] = {
              date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              revenue: 0,
              orders: 0,
              _key: key,
            };
          }

          orders.forEach((order) => {
            const status = (order.status || "").toLowerCase().trim();
            if (status === "cancelled") return;

            statusCounts[status] = (statusCounts[status] || 0) + 1;

            const orderDate = new Date(order.createdAt);
            const dayKey = orderDate.toISOString().slice(0, 10);
            const orderDateOnly = new Date(orderDate);
            orderDateOnly.setHours(0, 0, 0, 0);

            if (orderDateOnly.getTime() === today.getTime()) {
              todayOrders++;
            }

            if (status === "pending") {
              pendingOrders++;
            }

            if (status === "delivered" || status === "completed" || status === "complete") {
              completedOrders++;
            }

            const orderTotal = order.totalAmount || order.total || order.grandTotal || 0;
            const amountPaid = order.payment?.amountPaid || 0;
            const isRevenueCounted =
              order.paymentStatus === "paid" || status === "delivered" || status === "completed";

            if (isRevenueCounted) {
              totalRevenue += orderTotal;
            }

            if ((order.paymentStatus === "pending" || order.paymentStatus === "partial") && status !== "cancelled") {
              pendingAmount += orderTotal - amountPaid;
            }

            // trend bucket (only within the 14-day window we seeded)
            if (dayBuckets[dayKey]) {
              dayBuckets[dayKey].orders += 1;
              if (isRevenueCounted) dayBuckets[dayKey].revenue += orderTotal;
            }

            // category revenue breakdown
            const items = order.items || order.products || [];
            if (Array.isArray(items)) {
              items.forEach((item) => {
                const catName =
                  item.category?.name || item.product?.category?.name || item.categoryName || "Other";
                const lineTotal = (item.price || 0) * (item.quantity || 1);
                categoryTotals[catName] = (categoryTotals[catName] || 0) + lineTotal;
              });
            }
          });
        }
      }

      // ========== PROCESS CUSTOMERS ==========
      let totalCustomers = 0;
      let newCustomers = 0;

      if (customersRes.status === "fulfilled" && customersRes.value?.success) {
        const data = customersRes.value;
        const customers = data.data?.customers || data.customers || [];

        if (Array.isArray(customers)) {
          totalCustomers = customers.length;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          newCustomers = customers.filter((c) => {
            const joinDate = new Date(c.createdAt);
            joinDate.setHours(0, 0, 0, 0);
            return joinDate.getTime() === today.getTime();
          }).length;
        }
      }

      setStats({
        totalProducts,
        totalCategories,
        pendingOrders,
        completedOrders,
        totalOrders,
        totalCustomers,
        totalRevenue,
        pendingAmount,
        todayOrders,
        newCustomers,
      });

      setRecentProducts(Array.isArray(products) ? products.slice(0, 5) : []);
      setRecentOrders(recentOrdersList);

      setTrendData(
        Object.values(dayBuckets)
          .sort((a, b) => (a._key > b._key ? 1 : -1))
          .map(({ date, revenue, orders }) => ({ date, revenue, orders }))
      );

      setStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value,
          color: STATUS_COLORS[name] || COLORS.gray,
        }))
      );

      setCategoryRevenue(
        Object.entries(categoryTotals)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 6)
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatCompact = (price) => {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(price || 0);
  };

  const revenueTrendGrowth = useMemo(() => {
    if (trendData.length < 2) return 0;
    const half = Math.floor(trendData.length / 2);
    const first = trendData.slice(0, half).reduce((s, d) => s + d.revenue, 0);
    const second = trendData.slice(half).reduce((s, d) => s + d.revenue, 0);
    if (first === 0) return second > 0 ? 100 : 0;
    return Math.round(((second - first) / first) * 100);
  }, [trendData]);

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
      link: "/admin/products",
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
      link: "/admin/categories",
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
      link: "/admin/orders?status=pending",
    },
    {
      title: "Delivered",
      value: stats.completedOrders,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-[#ffe494]",
      iconBg: "bg-emerald-300/50",
      link: "/admin/orders?status=delivered",
    },
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
      iconColor: "bg-amber-400 text-white",
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
      iconColor: "bg-blue-400 text-white",
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
      iconColor: "bg-purple-400 text-white",
    },
    {
      title: "Pending Credits",
      description: "View outstanding payments",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: "/admin/pending-credits",
      color: "bg-red-50 hover:bg-red-100 border-red-200",
      iconColor: "bg-red-400 text-white",
    },
  ];

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const config = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      processing: "bg-purple-50 text-purple-700 border-purple-200",
      shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
      out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
      "out-for-delivery": "bg-cyan-50 text-cyan-700 border-cyan-200",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return config[s] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name === "revenue" ? `Revenue: ${formatPrice(p.value)}` : `Orders: ${p.value}`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/60 text-red-800 flex items-center gap-3 text-sm rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError("")} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          title="Refresh Data"
        >
          <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-[#ffe494] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-8">
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
              <h2 className="text-xl sm:text-2xl font-bold text-black">Welcome back, Admin! 👋</h2>
              <p className="text-gray-700 mt-1 text-sm sm:text-base">
                {stats.todayOrders > 0
                  ? `You have ${stats.todayOrders} new order${stats.todayOrders > 1 ? "s" : ""} today!`
                  : "Manage your products and track orders from here."}
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

      {/* Main Stats Grid - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {statCards.map((card, index) => (
          <Link key={index} href={card.link} className="group">
            <div className={`${card.bgColor} rounded-2xl p-5 sm:p-6 text-black transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-black text-xs sm:text-sm font-medium">{card.title}</p>
                  <p className="text-2xl sm:text-4xl font-bold mt-2">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-white/20 animate-pulse rounded"></span>
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`${card.iconBg} p-2.5 sm:p-3 rounded-xl`}>{card.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/orders" className="group">
          <div className="bg-white border border-purple-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-purple-300">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Total Orders</p>
                <p className="text-xl font-bold text-purple-700">
                  {loading ? <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded"></span> : stats.totalOrders}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/users" className="group">
          <div className="bg-white border border-green-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-green-300">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Total Customers</p>
                <p className="text-xl font-bold text-green-700">
                  {loading ? <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded"></span> : stats.totalCustomers}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/orders" className="group">
          <div className="bg-white border border-blue-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-blue-300">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">Today's Orders</p>
                <p className="text-xl font-bold text-blue-700">
                  {loading ? <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded"></span> : stats.todayOrders}
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/users" className="group">
          <div className="bg-white border border-indigo-200 rounded-xl p-4 transition-all hover:shadow-md hover:border-indigo-300">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium">New Customers</p>
                <p className="text-xl font-bold text-indigo-700">
                  {loading ? <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded"></span> : stats.newCustomers}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ================= ANALYTICS ROW ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Revenue & Orders Trend */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
              <p className="text-gray-500 text-sm mt-0.5">Last 14 days</p>
            </div>
            {!loading && trendData.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  revenueTrendGrowth >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}
              >
                <svg
                  className={`w-3 h-3 ${revenueTrendGrowth < 0 ? "rotate-180" : ""}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                {revenueTrendGrowth >= 0 ? "+" : ""}
                {revenueTrendGrowth}%
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-64 bg-gray-50 rounded-xl animate-pulse"></div>
          ) : trendData.length === 0 || trendData.every((d) => d.revenue === 0 && d.orders === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No revenue data in the last 14 days yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.amber} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.amber}
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900">Order Status</h3>
          <p className="text-gray-500 text-sm mt-0.5 mb-4">Distribution across all orders</p>

          {loading ? (
            <div className="h-56 bg-gray-50 rounded-xl animate-pulse"></div>
          ) : statusData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-sm">No orders yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} orders`, name.replace(/_/g, " ")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span className="text-xs text-gray-600 capitalize">{s.name.replace(/_/g, " ")}</span>
                    <span className="text-xs font-semibold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Revenue Bar Chart */}
      {/* {!loading && categoryRevenue.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900">Revenue by Category</h3>
          <p className="text-gray-500 text-sm mt-0.5 mb-4">Top performing categories</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryRevenue} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCompact(v)}
              />
              <Tooltip
                formatter={(value) => formatPrice(value)}
                contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill={COLORS.amber} radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )} */}

      {/* Finance Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/admin/payments" className="group">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {loading ? <span className="inline-block w-28 h-8 bg-emerald-100 animate-pulse rounded"></span> : formatPrice(stats.totalRevenue)}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/admin/pending-credits" className="group">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 text-red-600 p-3 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pending Amount</p>
                  <p className="text-2xl font-bold text-red-700">
                    {loading ? <span className="inline-block w-28 h-8 bg-red-100 animate-pulse rounded"></span> : formatPrice(stats.pendingAmount)}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
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
                  <div className={`flex items-center mb-2 gap-4 p-4 rounded-xl border ${action.color} transition-all duration-200 group cursor-pointer`}>
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

        {/* Recent Products & Orders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Products</h3>
                <p className="text-gray-500 text-sm mt-1">Latest added products</p>
              </div>
              <Link href="/admin/products" className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1">
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
                  {recentProducts.map((product) => (
                    <Link
                      key={product._id}
                      href={`/admin/products/view/${product.slug || product._id}`}
                      className="flex items-center gap-4 p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-all group"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {product.images && product.images[0] ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.title || "Product"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImagePlaceholder className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base group-hover:text-amber-600 transition-colors">
                          {product.title || "Untitled Product"}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {product.category?.name || product.category || "Uncategorized"}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.price || product.sellingPrice)}
                      </span>

                      <span
                        className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          product.isActive !== false
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {product.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                <p className="text-gray-500 text-sm mt-1">Latest customer orders</p>
              </div>
              <Link href="/admin/orders" className="text-sm text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-gray-100 rounded mb-2"></div>
                        <div className="w-32 h-3 bg-gray-100 rounded"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-100 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-gray-900 font-semibold">No orders yet</h4>
                  <p className="text-gray-500 text-sm mt-1">Orders will appear here</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.customerSnapshot?.name || order.user?.name || "Customer"} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{formatPrice(order.totalAmount)}</p>
                      <p className={`text-xs ${order.paymentStatus === "paid" ? "text-emerald-600" : order.paymentStatus === "partial" ? "text-blue-600" : "text-orange-600"}`}>
                        {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "partial" ? "Partial" : "Pending"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats Summary */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? <span className="inline-block w-10 h-7 bg-gray-100 animate-pulse rounded"></span> : stats.totalProducts}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Products</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? <span className="inline-block w-10 h-7 bg-gray-100 animate-pulse rounded"></span> : stats.totalOrders}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Orders</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {loading ? <span className="inline-block w-10 h-7 bg-gray-100 animate-pulse rounded"></span> : stats.totalCustomers}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Customers</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
            {loading ? <span className="inline-block w-16 h-7 bg-gray-100 animate-pulse rounded"></span> : formatPrice(stats.totalRevenue)}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Revenue</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">100%</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">System Health</p>
        </div>
      </div>
    </div>
  );
}