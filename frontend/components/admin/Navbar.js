// frontend/components/admin/Navbar.js
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Get page title from pathname
  const getPageTitle = () => {
    const routes = {
      "/admin": "Dashboard",
      "/admin/products": "Products",
      "/admin/products/add-product": "Add Product",
      "/admin/categories": "Categories",
      "/admin/orders": "Orders",
      "/admin/customers": "Customers",
      "/admin/pending-credits": "Pending Credits",
      "/admin/payments": "Payments",
      "/admin/payments/history": "Payment History",
      "/admin/inventory/low-stock": "Low Stock Alert",
      "/admin/inventory/stock": "Stock Management",
      "/admin/settings": "Settings"
    };

    // Check for dynamic routes
    if (pathname.startsWith("/admin/products/edit/")) return "Edit Product";
    if (pathname.startsWith("/admin/products/view/")) return "Product Details";
    if (pathname.startsWith("/admin/orders/")) return "Order Details";
    if (pathname.startsWith("/admin/customers/")) return "Customer Details";

    return routes[pathname] || "Admin";
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-30 pt-2 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side - Page title & breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Mobile menu spacer */}
          <div className="w-10 sm:hidden" />
          
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            {/* Breadcrumb for nested pages */}
            {pathname !== "/admin" && (
              <nav className="hidden sm:flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Link href="/admin" className="hover:text-gray-600 transition-colors">
                  Dashboard
                </Link>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">{getPageTitle()}</span>
              </nav>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search (desktop only) */}
          <div className="hidden lg:block">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm
                         placeholder:text-gray-400 focus:bg-white focus:ring-2 
                         focus:ring-amber-400/30 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:inline-flex
                            px-1.5 py-0.5 text-[10px] font-medium text-gray-400 
                            bg-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Quick actions */}
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/admin/products/add-product"
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 
                       rounded-xl transition-colors"
              title="Add Product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                       rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl 
                            border border-gray-200 overflow-hidden z-50 animate-in 
                            fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {/* Empty state */}
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No new notifications</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-100 
                       rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 
                            flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {admin?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {admin?.name || "Admin"}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">Administrator</p>
              </div>
              <svg 
                className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform duration-200
                          ${showProfile ? "rotate-180" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl 
                            border border-gray-200 overflow-hidden z-50 animate-in 
                            fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{admin?.name || "Admin"}</p>
                  <p className="text-xs text-gray-400 truncate">{admin?.email || "admin@tijara.com"}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 
                             hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setShowProfile(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 
                             hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setShowProfile(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 
                             hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}