// components/common/ConfirmDialog.js
"use client";

import { AlertTriangle, CheckCircle, Mail, Trash2, X } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger | warning | success | info
  loading = false,
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "bg-red-100 text-red-600",
      button: "bg-red-500 hover:bg-red-600 text-white",
      IconComponent: Trash2,
    },
    warning: {
      icon: "bg-[#F5C518]/20 text-[#F5C518]",
      button: "bg-[#F5C518] hover:bg-[#d4a815] text-black",
      IconComponent: AlertTriangle,
    },
    success: {
      icon: "bg-emerald-100 text-emerald-600",
      button: "bg-emerald-500 hover:bg-emerald-600 text-white",
      IconComponent: CheckCircle,
    },
    info: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      IconComponent: Mail,
    },
  };

  const styles = typeStyles[type] || typeStyles.danger;
  const IconComponent = styles.IconComponent;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div
        className="relative bg-white w-full max-w-md p-6 animate-in zoom-in-95 duration-200"
        style={{
          borderRadius: 20,
          boxShadow: "0px 8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 
                     text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mx-auto mb-5`}
        >
          <IconComponent size={28} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <div className="text-gray-500 text-center text-sm leading-relaxed mb-6 px-2">
          {message}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-[50px] rounded-[25px] border border-gray-200 text-gray-700 
                       font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-[50px] rounded-[25px] font-semibold transition-all 
                       disabled:opacity-50 flex items-center justify-center gap-2 ${styles.button}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;