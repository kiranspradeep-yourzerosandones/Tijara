// frontend/components/admin/Sidebar.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { usePermissions } from "@/context/PermissionContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Sidebar({ isCollapsed: externalCollapsed, setIsCollapsed: setExternalCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setIsCollapsed = setExternalCollapsed || setInternalCollapsed;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(["main", "financial", "inventory", "reports", "system"]);
  const [badges, setBadges] = useState({
    pendingOrders: 0,
    pendingCredits: 0,
    lowStock: 0
  });

  useEffect(() => {
    if (hasPermission("manageOrders") || hasPermission("viewReports")) {
      fetchBadgeCounts();
      const interval = setInterval(fetchBadgeCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [admin]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const fetchBadgeCounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      
      const responses = await Promise.allSettled([
        hasPermission("manageOrders") ? fetch(`${API_URL}/admin/orders/stats`, { headers }) : Promise.resolve(null),
        hasPermission("manageProducts") ? fetch(`${API_URL}/products?stockStatus=low_stock`, { headers }) : Promise.resolve(null)
      ]);
      
      // Orders stats
      if (responses[0].status === "fulfilled" && responses[0].value?.ok) {
        const data = await responses[0].value.json();
        if (data.success) {
          setBadges(prev => ({
            ...prev,
            pendingOrders: data.data.stats?.pendingOrders || 0,
            pendingCredits: data.data.stats?.pendingPaymentAmount > 0 ? "!" : 0
          }));
        }
      }
      
      // Low stock
      if (responses[1].status === "fulfilled" && responses[1].value?.ok) {
        const data = await responses[1].value.json();
        if (data.success) {
          setBadges(prev => ({
            ...prev,
            lowStock: data.data?.products?.length || 0
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch badge counts:", error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const isActive = (href) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    if (logout) logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/admin/login");
  };

  // ════════════════════════════════════════
  // NAVIGATION STRUCTURE WITH PERMISSIONS
  // ════════════════════════════════════════
  const allNavigation = {
    main: {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
          permission: null, // Everyone can see dashboard
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          )
        },
        {
          title: "Orders",
          href: "/admin/orders",
          permission: "manageOrders",
          badge: badges.pendingOrders,
          badgeColor: "bg-blue-500",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )
        },
        {
          title: "Products",
          href: "/admin/products",
          permission: "manageProducts",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        },
        {
          title: "Categories",
          href: "/admin/categories",
          permission: "manageProducts",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )
        },
        {
          title: "Customers",
          href: "/admin/users",
          permission: "manageCustomers",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        }
      ]
    },
    financial: {
      title: "Financial",
      sectionPermission: "managePayments",
      items: [
        {
          title: "Pending Credits",
          href: "/admin/pending-credits",
          permission: "managePayments",
          badge: badges.pendingCredits,
          badgeColor: "bg-red-500",
          highlight: true,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          title: "Payments",
          href: "/admin/payments",
          permission: "managePayments",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        }
      ]
    },
    system: {
      title: "System",
      sectionPermission: "manageAdmins",
      items: [
        {
          title: "Admin Users",
          href: "/admin/admins",
          permission: "manageAdmins",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )
        },
        {
          title: "Settings",
          href: "/admin/settings",
          permission: "manageAdmins", // Only super admins effectively
          superAdminOnly: true,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        }
      ]
    }
  };

  // Filter navigation by permissions
  const getFilteredNav = () => {
    const filtered = {};
    
    Object.entries(allNavigation).forEach(([key, section]) => {
      // Check section-level permission
      if (section.sectionPermission && !hasPermission(section.sectionPermission)) {
        return;
      }
      
      // Filter items by permission
      const items = section.items.filter(item => {
        // Super admin only items
        if (item.superAdminOnly && !isSuperAdmin()) {
          return false;
        }
        // Check item permission
        return hasPermission(item.permission);
      });
      
      if (items.length > 0) {
        filtered[key] = { ...section, items };
      }
    });
    
    return filtered;
  };

  const filteredNav = getFilteredNav();

  // ════════════════════════════════════════
  // NAV ITEM COMPONENT
  // ════════════════════════════════════════
  const NavItem = ({ item }) => {
    const active = isActive(item.href);
    const isComingSoon = item.comingSoon;

    const content = (
      <div
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 
          ${active ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900" : ""}
          ${!active && !isComingSoon ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900" : ""}
          ${isComingSoon && !active ? "text-gray-400 cursor-default" : ""}
          ${item.highlight && !active ? "ring-1 ring-red-100 bg-red-50/30" : ""}
        `}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-r-full" />
        )}

        <span className={`flex-shrink-0 transition-colors ${
          active ? "text-amber-600" : isComingSoon ? "text-gray-300" : "text-gray-400 group-hover:text-gray-600"
        }`}>
          {item.icon}
        </span>

        {!isCollapsed && (
          <>
            <span className="flex-1 font-medium text-sm truncate">{item.title}</span>

            {/* Coming Soon badge */}
            {isComingSoon && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 rounded">
                Soon
              </span>
            )}

            {/* Count badge */}
            {!isComingSoon && item.badge > 0 && (
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor || "bg-gray-500"}`}>
                {typeof item.badge === "string" ? item.badge : item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </>
        )}

        {/* Collapsed tooltip */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
            {item.title}
            {isComingSoon && <span className="ml-1 text-gray-400">(Coming Soon)</span>}
          </div>
        )}
      </div>
    );

    if (isComingSoon) {
      return <div key={item.href}>{content}</div>;
    }

    return <Link href={item.href} key={item.href}>{content}</Link>;
  };

  // ════════════════════════════════════════
  // NAV SECTION COMPONENT
  // ════════════════════════════════════════
  const NavSection = ({ sectionKey, section }) => {
    const isExpanded = expandedSections.includes(sectionKey);

    return (
      <div className="mb-4">
        {!isCollapsed && (
          <button
            onClick={() => toggleSection(sectionKey)}
            className="w-full flex items-center justify-between px-3 mb-2"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {section.title}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        
        {isCollapsed && <div className="w-8 h-px bg-gray-200 mx-auto mb-2" />}
        
        <div className={`space-y-1 overflow-hidden transition-all duration-300 ${
          !isCollapsed && !isExpanded ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
        }`}>
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════
  // ROLE BADGE
  // ════════════════════════════════════════
  const getRoleBadge = () => {
    if (!admin) return null;
    const styles = {
      superadmin: "bg-purple-100 text-purple-700",
      admin: "bg-blue-100 text-blue-700",
      manager: "bg-emerald-100 text-emerald-700"
    };
    const labels = {
      superadmin: "Super Admin",
      admin: "Admin",
      manager: "Manager"
    };
    return (
      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${styles[admin.role] || styles.admin}`}>
        {labels[admin.role] || admin.role}
      </span>
    );
  };

  // ════════════════════════════════════════
  // PERMISSION BADGES
  // ════════════════════════════════════════
  const getPermissionBadges = () => {
    if (!admin || admin.role === "superadmin") return null;
    
    const permissionLabels = {
      manageProducts: { label: "Products", color: "bg-blue-100 text-blue-700" },
      manageOrders: { label: "Orders", color: "bg-green-100 text-green-700" },
      manageCustomers: { label: "Customers", color: "bg-purple-100 text-purple-700" },
      managePayments: { label: "Payments", color: "bg-orange-100 text-orange-700" },
      viewReports: { label: "Reports", color: "bg-cyan-100 text-cyan-700" }
    };

    const activePermissions = Object.entries(admin.permissions || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => permissionLabels[key])
      .filter(Boolean);

    if (activePermissions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {activePermissions.slice(0, 3).map((perm, idx) => (
          <span key={idx} className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${perm.color}`}>
            {perm.label}
          </span>
        ))}
        {activePermissions.length > 3 && (
          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 text-gray-600">
            +{activePermissions.length - 3}
          </span>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════
  // SIDEBAR CONTENT
  // ════════════════════════════════════════
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-100 ${isCollapsed ? "px-3 py-4 justify-center" : "px-5 py-5 gap-3"}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 ${isCollapsed ? "w-10 h-10" : "w-11 h-11"}`}>
            <span className="text-white font-bold text-lg">T</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-gray-900 text-lg tracking-tight">Tijara</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      {/* Admin Info */}
      {!isCollapsed && admin && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">
                  {admin.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{admin.name || "Admin"}</p>
                <p className="text-[10px] text-gray-400 truncate">{admin.email}</p>
              </div>
            </div>
            {getRoleBadge()}
          </div>
          
          {/* Permission badges for non-superadmins */}
          {admin.role !== "superadmin" && getPermissionBadges()}
          
          {/* All access badge for superadmin */}
          {admin.role === "superadmin" && (
            <div className="mt-2">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700">
                ✓ Full Access
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
        {Object.entries(filteredNav).map(([key, section]) => (
          <NavSection key={key} sectionKey={key} section={section} />
        ))}

        {/* Limited access message */}
        {Object.keys(filteredNav).length <= 1 && !isCollapsed && (
          <div className="px-3 py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 font-medium">Limited Access</p>
            <p className="text-[10px] text-gray-400 mt-1">Contact super admin for more permissions</p>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden sm:block px-3 py-2 border-t border-gray-100">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>

      {/* Bottom section - Logout */}
      <div className={`border-t border-gray-100 ${isCollapsed ? "px-2 py-3" : "px-4 py-4"}`}>
        {!isCollapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        ) : (
          <div className="space-y-2">
            {/* Collapsed profile avatar */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto cursor-pointer">
                <span className="text-white font-bold text-sm">
                  {admin?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="absolute left-full ml-2 bottom-0 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                <p className="font-semibold">{admin?.name || "Admin"}</p>
                <p className="text-gray-400 text-[10px]">{admin?.role}</p>
              </div>
            </div>
            
            {/* Collapsed logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Logout
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 sm:hidden p-2.5 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out sm:hidden ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 hidden sm:block transition-all duration-300 ease-out ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}>
        <SidebarContent />
      </aside>
    </>
  );
}