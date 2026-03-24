// frontend/context/PermissionContext.js
"use client";

import { createContext, useContext, useMemo } from "react";
import { useAdminAuth } from "./AdminAuthContext";

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { admin } = useAdminAuth();

  const permissions = useMemo(() => {
    if (!admin) {
      return {
        manageProducts: false,
        manageOrders: false,
        manageCustomers: false,
        managePayments: false,
        manageAdmins: false,
        viewReports: false
      };
    }

    // Superadmin has all permissions
    if (admin.role === "superadmin") {
      return {
        manageProducts: true,
        manageOrders: true,
        manageCustomers: true,
        managePayments: true,
        manageAdmins: true,
        viewReports: true
      };
    }

    // Return admin's actual permissions
    return admin.permissions || {
      manageProducts: false,
      manageOrders: false,
      manageCustomers: false,
      managePayments: false,
      manageAdmins: false,
      viewReports: false
    };
  }, [admin]);

  const hasPermission = (permission) => {
    if (!admin) return false;
    if (!permission) return true; // null = everyone
    if (admin.role === "superadmin") return true;
    return permissions[permission] === true;
  };

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissionList) => {
    return permissionList.every(p => hasPermission(p));
  };

  const isSuperAdmin = () => {
    return admin?.role === "superadmin";
  };

  const value = {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    role: admin?.role || null
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

export default PermissionContext;