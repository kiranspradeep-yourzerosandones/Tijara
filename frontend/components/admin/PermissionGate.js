// frontend/components/admin/PermissionGate.js
"use client";

import { usePermissions } from "@/context/PermissionContext";

/**
 * PermissionGate - Conditionally renders children based on permissions
 * 
 * @param {string} permission - Single permission to check
 * @param {string[]} permissions - Array of permissions (any match)
 * @param {boolean} requireAll - If true, all permissions must match
 * @param {React.ReactNode} fallback - What to show if no permission
 * @param {boolean} showAccessDenied - Show access denied message
 */
const PermissionGate = ({ 
  permission,
  permissions = [],
  requireAll = false,
  children, 
  fallback = null,
  showAccessDenied = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No permission required
  }

  if (hasAccess) {
    return children;
  }

  if (showAccessDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
        <p className="text-gray-500 text-center text-sm">
          You don&apos;t have permission to access this feature.
          <br />
          Contact your administrator for access.
        </p>
      </div>
    );
  }

  return fallback;
};

export default PermissionGate;