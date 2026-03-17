"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AdminAuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if admin is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const storedAdmin = localStorage.getItem("adminUser");

      console.log("🔍 Checking auth:", { hasToken: !!token, hasAdmin: !!storedAdmin });

      if (token && storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        
        // ✅ Verify token is still valid
        const response = await fetch(`${API_URL}/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdmin(data.data.admin);
          console.log("✅ Auth verified:", data.data.admin);
        } else {
          console.log("❌ Token invalid, clearing auth");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setAdmin(null);
        }
      } else {
        console.log("❌ No auth data found");
        setAdmin(null);
      }
    } catch (err) {
      console.error("❌ Auth check error:", err);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    setError(null);
    setLoading(true);

    try {
      console.log("🚀 Attempting login for:", phone);
      console.log("📡 API URL:", `${API_URL}/admin/login`);
      
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, password }),
      });

      console.log("📡 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ Verify response structure
      if (!data.data || !data.data.token || !data.data.admin) {
        throw new Error("Invalid response format");
      }

      // Store token and admin data
      localStorage.setItem("adminToken", data.data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.data.admin));
      setAdmin(data.data.admin);

      console.log("✅ Login successful, admin:", data.data.admin);

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 100);

      return { success: true };

    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("👋 Logging out...");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
    router.push("/admin/login");
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminToken");
    }
    return null;
  };

  const value = {
    admin,
    loading,
    error,
    login,
    logout,
    getToken,
    isAuthenticated: !!admin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

export default AdminAuthContext;