"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AdminAuthContext = createContext();

// ✅ Fix: Ensure /api is included
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Check if admin is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const storedAdmin = localStorage.getItem("adminUser");

      if (token && storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
    } catch (err) {
      console.error("Auth check error:", err);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
  setError(null);
  setLoading(true);

  try {
    console.log("🚀 Attempting login for:", phone);
    
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

    // Store token and user
    localStorage.setItem("adminToken", data.data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.data.user));
    setAdmin(data.data.user);

    console.log("✅ Login successful");

    // Redirect to dashboard
    router.push("/admin/dashboard");

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