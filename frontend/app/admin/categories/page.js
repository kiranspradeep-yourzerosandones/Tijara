// frontend/app/admin/categories/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProtectedPage from "@/components/admin/ProtectedPage";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace("/api", "");

// ─── Sort options config ──────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: "Custom Order",   field: "sortOrder", order: "asc"  },
  { label: "Newest First",   field: "createdAt", order: "desc" },
  { label: "Oldest First",   field: "createdAt", order: "asc"  },
  { label: "Name A → Z",     field: "name",      order: "asc"  },
  { label: "Name Z → A",     field: "name",      order: "desc" },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5
                  rounded-2xl shadow-2xl text-white text-sm font-semibold
                  animate-in slide-in-from-bottom-4 duration-300
                  ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
    >
      {type === "success" ? (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-80 hover:opacity-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Image Uploader ───────────────────────────────────────────────────────────
function ImageUploader({ currentImage, onImageChange, onRemove }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImage || null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    onImageChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Category Image{" "}
        <span className="text-gray-400 text-xs font-normal">(optional)</span>
      </label>

      {preview ? (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                          transition-opacity duration-200 flex items-center justify-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-gray-800 text-xs font-semibold
                         rounded-lg hover:bg-gray-100 transition-colors shadow-md">
              Change Image
            </button>
            <button type="button" onClick={handleRemove}
              className="px-4 py-2 bg-red-500 text-white text-xs font-semibold
                         rounded-lg hover:bg-red-600 transition-colors shadow-md">
              Remove
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs
                          font-semibold px-2 py-0.5 rounded-full shadow">
            ✓ Image set
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl
                     flex flex-col items-center justify-center gap-2 text-gray-400
                     hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50
                     transition-all duration-200 group cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-amber-100
                          flex items-center justify-center transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0
                   012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                   00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs mt-0.5">JPEG, PNG, WebP — max 10MB</p>
          </div>
        </button>
      )}

      <input ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange} className="hidden" />
    </div>
  );
}

// ─── Category Modal ───────────────────────────────────────────────────────────
function CategoryModal({
  title, subtitle, name, onNameChange,
  currentImageUrl, onImageChange, onImageRemove,
  onSubmit, onClose, submitting, submitLabel, submitLoadingLabel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl
                      animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010
                     2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Electronics, Clothing, Furniture..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                         focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                         focus:bg-white text-gray-900 placeholder:text-gray-400
                         transition-all duration-200 outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting && name.trim()) onSubmit();
              }}
            />
          </div>
          <ImageUploader
            currentImage={currentImageUrl}
            onImageChange={onImageChange}
            onRemove={onImageRemove}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600
                       font-semibold rounded-xl hover:bg-gray-100 transition-colors
                       text-sm disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={submitting || !name.trim()}
            className={`flex-[2] px-4 py-2.5 font-semibold rounded-xl transition-all
                       duration-200 text-sm flex items-center justify-center gap-2
                       ${submitting || !name.trim()
                         ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                         : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20"}`}>
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{submitLoadingLabel}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7" />
                </svg>
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Drag handle icon ─────────────────────────────────────────────────────────
function DragHandle({ listeners, attributes }) {
  return (
    <div
      {...listeners}
      {...attributes}
      className="p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing
                 rounded-lg hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100
                 touch-none select-none"
      title="Drag to reorder"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="9"  cy="5"  r="1.5" />
        <circle cx="15" cy="5"  r="1.5" />
        <circle cx="9"  cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9"  cy="19" r="1.5" />
        <circle cx="15" cy="19" r="1.5" />
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Categories() {
  const { dialogProps, confirm } = useConfirmDialog();

  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);

  // ── Sort state ──
  // activeSortIndex maps to SORT_OPTIONS array index
  const [activeSortIndex, setActiveSortIndex] = useState(0); // default: Custom Order
  const [sortMenuOpen, setSortMenuOpen]       = useState(false);
  const sortMenuRef                           = useRef(null);

  // Reorder saving indicator
  const [reorderSaving, setReorderSaving] = useState(false);

  // Drag state (pure JS, no library needed)
  const dragItem    = useRef(null); // index being dragged
  const dragOverItem = useRef(null); // index being hovered

  // ── Add modal ──
  const [showModal, setShowModal]             = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [saving, setSaving]                   = useState(false);

  // ── Edit modal ──
  const [showEditModal, setShowEditModal]         = useState(false);
  const [editingCategory, setEditingCategory]     = useState(null);
  const [editName, setEditName]                   = useState("");
  const [editImage, setEditImage]                 = useState(null);
  const [editCurrentImageUrl, setEditCurrentImageUrl] = useState(null);
  const [removeEditImage, setRemoveEditImage]     = useState(false);
  const [editSaving, setEditSaving]               = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Close sort menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch with sort params ──
  const fetchCategories = useCallback(async (sortIndex = 0) => {
    setLoading(true);
    try {
      const { field, order } = SORT_OPTIONS[sortIndex];
      const res = await fetch(
        `${API_URL}/categories?sortBy=${field}&sortOrder=${order}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      const cats = data.categories || data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(activeSortIndex);
  }, [activeSortIndex, fetchCategories]);

  // ── Sort selection ──
  const handleSortSelect = (index) => {
    setActiveSortIndex(index);
    setSortMenuOpen(false);
  };

  // ── Sorted display list ──
  // When "Custom Order" is selected, we use the categories array as-is (server sorted).
  // For other sorts, we sort client-side so drag-reorder isn't needed.
  const isCustomOrder = activeSortIndex === 0;

  // ── Drag-to-reorder (only active in Custom Order mode) ──
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverItem.current = index;
    if (dragItem.current === null || dragItem.current === index) return;

    // Reorder in local state for live preview
    setCategories((prev) => {
      const next = [...prev];
      const dragged = next.splice(dragItem.current, 1)[0];
      next.splice(index, 0, dragged);
      dragItem.current = index;
      return next;
    });
  };

  // In handleDragEnd, temporarily replace the fetch block:
const handleDragEnd = async () => {
  dragItem.current = null;
  dragOverItem.current = null;

  setReorderSaving(true);
  try {
    const orderedIds = categories.map((c) => c._id);
    console.log("Sending reorder:", orderedIds); // ← check this

    const res = await fetch(`${API_URL}/categories/reorder`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });

    const data = await res.json();
    console.log("Reorder response:", res.status, data); // ← check this

    if (!res.ok) throw new Error("Reorder failed");
    showToast("Order saved!");
  } catch (err) {
    console.error(err);
    showToast("Failed to save order", "error");
    fetchCategories(activeSortIndex);
  } finally {
    setReorderSaving(false);
  }
};

  // ── Add ──
  const resetAddModal = () => {
    setNewCategoryName("");
    setNewCategoryImage(null);
    setShowModal(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", newCategoryName.trim());
      if (newCategoryImage) formData.append("image", newCategoryImage);

      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        // Append to end for custom order; refetch otherwise
        if (isCustomOrder) {
          setCategories((prev) => [...prev, data.category]);
        } else {
          fetchCategories(activeSortIndex);
        }
        resetAddModal();
        showToast("Category created successfully!");
      } else {
        showToast(data.message || "Failed to create category", "error");
      }
    } catch (error) {
      console.error("Add error:", error);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──
  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditImage(null);
    setRemoveEditImage(false);
    setEditCurrentImageUrl(category.image ? `${BASE_URL}${category.image}` : null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditName("");
    setEditImage(null);
    setEditCurrentImageUrl(null);
    setRemoveEditImage(false);
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editingCategory) return;
    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      if (editImage) {
        formData.append("image", editImage);
      } else if (removeEditImage) {
        formData.append("removeImage", "true");
      }

      const res = await fetch(`${API_URL}/categories/${editingCategory._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? data.category : c))
        );
        closeEditModal();
        showToast("Category updated successfully!");
      } else {
        showToast(data.message || "Failed to update category", "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Delete Category",
      message: "This will permanently delete the category. Products assigned to this category will become uncategorized.",
      details: `"${name}"`,
      confirmText: "Delete Category",
      cancelText: "Keep Category",
      variant: "danger",
    });
    if (!ok) return;

    setDeleteLoading(id);
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c._id !== id));
        showToast("Category deleted successfully!");
      } else {
        showToast("Could not delete this category.", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Something went wrong.", "error");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ProtectedPage permission="manageProducts">
      <ConfirmDialog {...dialogProps} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="w-full min-h-screen">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl
                        border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
                          gap-4 py-4 max-w-[1600px] mx-auto">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Categories
                </h1>
                <span className="inline-flex px-2.5 py-0.5 bg-amber-100 text-amber-700
                                 text-xs font-bold rounded-full">
                  {categories.length}
                </span>
                {/* Saving indicator */}
                {reorderSaving && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving order…
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Organize your products into categories
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* ── Sort dropdown ── */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setSortMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                             text-gray-700 bg-white border border-gray-200 rounded-xl
                             hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
                             shadow-sm"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="hidden sm:inline">{SORT_OPTIONS[activeSortIndex].label}</span>
                  <span className="sm:hidden">Sort</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200
                                   ${sortMenuOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {sortMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border
                                  border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden
                                  animate-in zoom-in-95 fade-in duration-150">
                    <div className="p-1.5">
                      {SORT_OPTIONS.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSortSelect(idx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm
                                     font-medium rounded-xl transition-colors text-left
                                     ${activeSortIndex === idx
                                       ? "bg-amber-50 text-amber-700"
                                       : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          {/* Checkmark for active */}
                          <span className={`w-4 h-4 flex-shrink-0 ${activeSortIndex === idx ? "text-amber-500" : "text-transparent"}`}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {opt.label}
                          {/* Drag hint badge */}
                          {idx === 0 && (
                            <span className="ml-auto text-[10px] bg-amber-100 text-amber-600
                                            font-semibold px-1.5 py-0.5 rounded-full">
                              drag
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Add button ── */}
              <button
                onClick={() => setShowModal(true)}
                className="group px-5 py-2.5 font-semibold text-sm transition-all duration-200
                           flex items-center justify-center gap-2 rounded-xl bg-gray-900
                           hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20
                           hover:shadow-xl active:scale-[0.98]"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* ── Custom-order hint banner ── */}
        {isCustomOrder && !loading && categories.length > 1 && (
          <div className="mt-4 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border
                            border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Drag the <strong className="mx-0.5">⠿</strong> handle on any card to reorder categories
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        <div className="mt-4 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">

            {loading ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400
                                  border-t-transparent animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">Loading categories...</p>
              </div>

            ) : categories.length === 0 ? (
              <div className="p-16 sm:p-20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50
                                rounded-2xl flex items-center justify-center mx-auto mb-6
                                shadow-lg shadow-amber-100/50">
                  <svg className="w-10 h-10 text-amber-500" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010
                         2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Categories Yet</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                  Create your first category to start organizing products
                </p>
                <button onClick={() => setShowModal(true)}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900
                             hover:bg-gray-800 text-white font-semibold rounded-xl
                             transition-all duration-200 shadow-lg shadow-gray-900/20
                             hover:shadow-xl active:scale-[0.98]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add First Category
                </button>
              </div>

            ) : (
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category, index) => (
                    <div
                      key={category._id}
                      draggable={isCustomOrder}
                      onDragStart={() => isCustomOrder && handleDragStart(index)}
                      onDragEnter={() => isCustomOrder && handleDragEnter(index)}
                      onDragEnd={() => isCustomOrder && handleDragEnd()}
                      onDragOver={(e) => e.preventDefault()}
                      className={`group relative flex items-center justify-between p-4
                                 rounded-xl border bg-gray-50/80 border-gray-100
                                 hover:bg-white hover:border-gray-200 hover:shadow-md
                                 transition-all duration-200
                                 ${isCustomOrder ? "cursor-default" : ""}`}
                    >
                      {/* Drag handle — only shown in custom order mode */}
                      {isCustomOrder && (
                        <div
                          className="p-1.5 mr-1 text-gray-300 hover:text-gray-500
                                     cursor-grab active:cursor-grabbing rounded-lg
                                     hover:bg-gray-100 transition-all opacity-0
                                     group-hover:opacity-100 flex-shrink-0 touch-none select-none"
                          title="Drag to reorder"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9"  cy="5"  r="1.5" />
                            <circle cx="15" cy="5"  r="1.5" />
                            <circle cx="9"  cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9"  cy="19" r="1.5" />
                            <circle cx="15" cy="19" r="1.5" />
                          </svg>
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden
                                        bg-amber-100 transition-colors">
                          {category.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${BASE_URL}${category.image}`} alt={category.name}
                              className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-amber-700" fill="none"
                                stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0
                                     010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0
                                     013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name & slug */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {category.name}
                          </h3>
                          {category.slug && (
                            <p className="text-xs text-gray-400 font-mono truncate">
                              /{category.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button onClick={() => openEditModal(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50
                                     rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0
                                 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button onClick={() => handleDelete(category._id, category.name)}
                          disabled={deleteLoading === category._id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50
                                     rounded-lg transition-all opacity-0 group-hover:opacity-100
                                     disabled:opacity-50"
                          title="Delete">
                          {deleteLoading === category._id ? (
                            <div className="w-4 h-4 border-2 border-red-500
                                            border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                                   01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                                   00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Add Modal ── */}
        {showModal && (
          <CategoryModal
            title="Add Category"
            subtitle="Create a new product category"
            name={newCategoryName}
            onNameChange={setNewCategoryName}
            currentImageUrl={null}
            onImageChange={(file) => setNewCategoryImage(file)}
            onImageRemove={() => setNewCategoryImage(null)}
            onSubmit={handleAddCategory}
            onClose={resetAddModal}
            submitting={saving}
            submitLabel="Create Category"
            submitLoadingLabel="Creating..."
          />
        )}

        {/* ── Edit Modal ── */}
        {showEditModal && editingCategory && (
          <CategoryModal
            title="Edit Category"
            subtitle="Update category details"
            name={editName}
            onNameChange={setEditName}
            currentImageUrl={editCurrentImageUrl}
            onImageChange={(file) => {
              setEditImage(file);
              setRemoveEditImage(false);
              setEditCurrentImageUrl(null);
            }}
            onImageRemove={() => {
              setEditImage(null);
              setRemoveEditImage(true);
              setEditCurrentImageUrl(null);
            }}
            onSubmit={handleUpdate}
            onClose={closeEditModal}
            submitting={editSaving}
            submitLabel="Save Changes"
            submitLoadingLabel="Saving..."
          />
        )}
      </div>
    </ProtectedPage>
  );
}