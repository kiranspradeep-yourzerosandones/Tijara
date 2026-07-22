// frontend/app/admin/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import { PermissionProvider } from "@/context/PermissionContext";
// ✅ NEW
import { AdminSseProvider } from "@/context/AdminSseContext";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

const PUBLIC_ROUTES = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password"
];

function AdminLayoutContent({ children }) {
  const { isAuthenticated, loading, initialized } = useAdminAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (loading || !initialized) return;
    if (isPublicRoute) return;
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, loading, initialized, pathname, router, isPublicRoute]);

  if (loading || !initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // ✅ Wrap the authenticated layout with AdminSseProvider
  // so the SSE connection lives at layout level and persists across page changes
  return (
    <AdminSseProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`transition-all duration-300 ${
            isCollapsed ? "sm:ml-[72px]" : "sm:ml-64"
          }`}
        >
          <Navbar isCollapsed={isCollapsed} />
          <main className="p-4 sm:p-6 pt-20 sm:pt-5">{children}</main>
        </div>
      </div>
    </AdminSseProvider>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <PermissionProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </PermissionProvider>
    </AdminAuthProvider>
  );
}