// frontend/hooks/useConfirmDialog.js
"use client";

import { useState, useCallback } from "react";

/**
 * useConfirmDialog
 *
 * Returns { dialogProps, confirm }
 *
 * Usage:
 *   const { dialogProps, confirm } = useConfirmDialog();
 *
 *   // Trigger anywhere:
 *   const ok = await confirm({
 *     title: "Delete product?",
 *     message: "This cannot be undone.",
 *     details: product.title,
 *     confirmText: "Delete",
 *     variant: "danger",
 *   });
 *   if (ok) doDelete();
 *
 *   // In JSX:
 *   <ConfirmDialog {...dialogProps} />
 */
export function useConfirmDialog() {
  const [state, setState] = useState({
    isOpen: false,
    isLoading: false,
    title: "",
    message: "",
    details: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger",
    resolve: null,
  });

  /** Open the dialog; returns a Promise<boolean> */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        isLoading: false,
        title: options.title ?? "Are you sure?",
        message: options.message ?? "",
        details: options.details ?? null,
        confirmText: options.confirmText ?? "Confirm",
        cancelText: options.cancelText ?? "Cancel",
        variant: options.variant ?? "danger",
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(true);
      return { ...prev, isOpen: false };
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => {
      prev.resolve?.(false);
      return { ...prev, isOpen: false };
    });
  }, []);

  /** Pass these directly to <ConfirmDialog {...dialogProps} /> */
  const dialogProps = {
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    title: state.title,
    message: state.message,
    details: state.details,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    onConfirm: handleConfirm,
    onClose: handleClose,
  };

  return { dialogProps, confirm };
}