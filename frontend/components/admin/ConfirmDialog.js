// frontend/components/admin/ConfirmDialog.js
"use client";

import { useEffect, useRef } from "react";

/**
 * ConfirmDialog — reusable modal for destructive / important actions
 *
 * Props:
 *  isOpen      : boolean
 *  onClose     : () => void          — called on cancel / backdrop click
 *  onConfirm   : () => void          — called on confirm button click
 *  title       : string
 *  message     : string | ReactNode
 *  confirmText : string  (default "Confirm")
 *  cancelText  : string  (default "Cancel")
 *  variant     : "danger" | "warning" | "info"  (default "danger")
 *  isLoading   : boolean             — shows spinner on confirm button
 *  details     : string | null       — optional extra detail line
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  details = null,
}) {
  const confirmBtnRef = useRef(null);

  /* Auto-focus confirm button when dialog opens */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Close on Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, isLoading, onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  /* ── Variant config ─────────────────────────────────── */
  const variantConfig = {
    danger: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBg:
        "bg-red-600 hover:bg-red-700 focus:ring-red-500/30 shadow-red-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5
               4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmBg:
        "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400/30 shadow-amber-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
               1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77
               1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBg:
        "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30 shadow-blue-200",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const cfg = variantConfig[variant] ?? variantConfig.danger;

  return (
    /* ── Backdrop ──────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Blurred / dimmed backdrop */}
      <div
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* ── Panel ───────────────────────────────────────── */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl
                   border border-gray-200/80
                   animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close (×) button */}
        <button
          onClick={() => !isLoading && onClose()}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600
                     hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl ${cfg.iconBg} ${cfg.iconColor}
                        flex items-center justify-center mb-5 shadow-sm`}
          >
            {cfg.icon}
          </div>

          {/* Title */}
          <h3
            id="confirm-dialog-title"
            className="text-lg font-bold text-gray-900 mb-2"
          >
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          )}

          {/* Details pill */}
          {details && (
            <div className="mt-3 px-3 py-2 bg-gray-50 border border-gray-200
                            rounded-xl text-sm font-medium text-gray-700 truncate">
              {details}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {/* Cancel */}
          <button
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-700
                       font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300
                       transition-all duration-200 disabled:opacity-50
                       disabled:cursor-not-allowed text-sm"
          >
            {cancelText}
          </button>

          {/* Confirm */}
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 text-white font-semibold rounded-xl
                        transition-all duration-200 flex items-center justify-center gap-2
                        focus:outline-none focus:ring-4
                        disabled:opacity-60 disabled:cursor-not-allowed
                        shadow-lg active:scale-[0.98] text-sm
                        ${cfg.confirmBg}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                       5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824
                       3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}