// frontend/context/AdminAuthContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        // Only run on client side
        if (typeof window === "undefined") {
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log("Checking auth...");
        const storedToken = localStorage.getItem("token");
        const storedAdmin = localStorage.getItem("adminData");

        if (storedToken && storedAdmin) {
          try {
            const parsedAdmin = JSON.parse(storedAdmin);
            console.log("Found auth data:", parsedAdmin?.email);
            setToken(storedToken);
            setAdmin(parsedAdmin);
          } catch (parseError) {
            console.error("Failed to parse admin data:", parseError);
            localStorage.removeItem("token");
            localStorage.removeItem("adminData");
          }
        } else {
          console.log("No auth data found");
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login for:", email);
      console.log("API URL:", `${API_URL}/admin/login`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text());
        return {
          success: false,
          message: "Server error. Please try again later.",
        };
      }

      const data = await response.json();

      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (data.success && data.data) {
        const { token: newToken, admin: adminData } = data.data;

        if (!newToken || !adminData) {
          return {
            success: false,
            message: "Invalid response from server",
          };
        }

        console.log("Login successful for:", adminData.email);

        // Store in state
        setToken(newToken);
        setAdmin(adminData);

        // Store in localStorage
        localStorage.setItem("token", newToken);
        localStorage.setItem("adminData", JSON.stringify(adminData));

        return { success: true, admin: adminData };
      } else {
        return {
          success: false,
          message: data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific error types
      if (error.name === "AbortError") {
        return {
          success: false,
          message: "Request timeout. Please check your connection.",
        };
      }
      
      if (error.message === "Failed to fetch") {
        return {
          success: false,
          message: "Cannot connect to server. Please ensure the backend is running.",
        };
      }

      return {
        success: false,
        message: error.message || "Network error. Please try again.",
      };
    }
  };

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("adminData");
    }
  }, []);

  const getToken = useCallback(() => {
    if (token) return token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }, [token]);

  const refreshAdminData = async () => {
    const currentToken = getToken();
    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/admin/me`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.admin) {
        const updatedAdmin = data.data.admin;
        setAdmin(updatedAdmin);
        localStorage.setItem("adminData", JSON.stringify(updatedAdmin));
      }
    } catch (error) {
      console.error("Failed to refresh admin data:", error);
    }
  };

  const value = {
    admin,
    token,
    loading,
    initialized,
    isAuthenticated: !!admin && !!token,
    login,
    logout,
    getToken,
    refreshAdminData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export default AuthContext;