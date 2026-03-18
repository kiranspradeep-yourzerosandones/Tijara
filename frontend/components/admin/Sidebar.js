"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const { admin } = useAdminAuth();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      subItems: [
        { name: "All Products", href: "/admin/products" },
        { name: "Add Product", href: "/admin/products/add-product" },
        { name: "Categories", href: "/admin/categories" }
      ]
    },
    {
      name: "Customers",
      href: "/admin/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      subItems: [
        { name: "All Customers", href: "/admin/users" },
        { name: "Add Customer", href: "/admin/users/add" }
      ]
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  // Add Admins menu only for superadmin
  if (admin?.role === "superadmin") {
    menuItems.push({
      name: "Admins",
      href: "/admin/admins",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: "Super Admin",
      subItems: [
        { name: "All Admins", href: "/admin/admins" },
        { name: "Add Admin", href: "/admin/admins/add" }
      ]
    });
  }

  const isActive = (href) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isParentActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(sub => isActive(sub.href));
    }
    return isActive(item.href);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ffe494] rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-black font-bold text-xl">T</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Tijara</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
          Menu
        </p>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className="relative"
              onMouseEnter={() => item.subItems && setHoveredMenu(item.name)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <Link
                href={item.subItems ? item.subItems[0].href : item.href}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isParentActive(item)
                    ? "bg-[#ffe494] text-black font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-[#ffe494]/20 hover:text-black"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                      SA
                    </span>
                  )}
                </div>
                {item.subItems && (
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      hoveredMenu === item.name ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Hover Submenu */}
              {item.subItems && hoveredMenu === item.name && (
                <div className="absolute left-full top-0 ml-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="absolute -left-2 top-4 w-2 h-4">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
                  </div>
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive(subItem.href)
                          ? "bg-[#ffe494]/30 text-black font-semibold"
                          : "text-gray-600 hover:bg-[#ffe494]/20 hover:text-black"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
        <div className="bg-[#ffe494]/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-black">Need Help?</p>
          <p className="text-xs text-gray-600 mt-1">Contact support for assistance</p>
          <button className="mt-3 w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Get Support
          </button>
        </div>
      </div>
    </aside>
  );
}