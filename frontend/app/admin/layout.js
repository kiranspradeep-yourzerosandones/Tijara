// frontend/app/admin/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import { PermissionProvider } from "@/context/PermissionContext";
import Sidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/admin/Navbar";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password"
];

function AdminLayoutContent({ children }) {
  const { isAuthenticated, loading, initialized } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if current path is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Don't redirect if still loading or not initialized
    if (loading || !initialized) return;

    // If it's a public route, don't redirect
    if (isPublicRoute) return;

    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, loading, initialized, pathname, router, isPublicRoute]);

  // Show loading spinner while checking auth
  if (loading || !initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800"></div>
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // For public routes (login, forgot-password, reset-password), render without sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If not authenticated and trying to access protected route, show loading (redirect will happen)
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-gray-800"></div>
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // Authenticated users see the full admin layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`transition-all duration-300 ${isCollapsed ? "sm:ml-[72px]" : "sm:ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} />
        <main className="p-4 sm:p-6 pt-20 sm:pt-5">
          {children}
        </main>
      </div>
    </div>
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