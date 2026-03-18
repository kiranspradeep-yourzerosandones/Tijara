// frontend/app/admin/categories/page.js
"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      const cats = data.categories || data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });

      if (res.ok) {
        const data = await res.json();
        setCategories([data.category || data, ...categories]);
        setNewCategory("");
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;

    setDeleteLoading(id);

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEditing = (category) => {
    setEditingCategory(category._id);
    setEditName(category.name);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditName("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });

      if (res.ok) {
        setCategories(
          categories.map((c) =>
            c._id === id ? { ...c, name: editName } : c
          )
        );
        cancelEditing();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 max-w-[1600px] mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Categories
              </h1>
              <span className="inline-flex px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {categories.length}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Organize your products into categories
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group relative px-5 py-2.5 font-semibold text-sm transition-all duration-200 
                       flex items-center justify-center gap-2 rounded-xl overflow-hidden
                       bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 
                       hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* ─── Categories Grid ─── */}
      <div className="mt-6 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-16 sm:p-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-100/50">
                <svg
                  className="w-10 h-10 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Categories Yet</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                Create your first category to start organizing products
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 
                           text-white font-semibold rounded-xl transition-all duration-200 
                           shadow-lg shadow-gray-900/20 hover:shadow-xl active:scale-[0.98]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add First Category
              </button>
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      editingCategory === category._id
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50/80 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          editingCategory === category._id
                            ? "bg-amber-200"
                            : "bg-amber-100 group-hover:bg-amber-200"
                        }`}
                      >
                        <svg
                          className="w-5 h-5 text-amber-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingCategory === category._id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(category._id);
                              if (e.key === "Escape") cancelEditing();
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg 
                                       focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 
                                       text-gray-900 text-sm font-medium"
                            autoFocus
                          />
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 truncate">
                              {category.name}
                            </h3>
                            {category.slug && (
                              <p className="text-xs text-gray-400 font-mono truncate">
                                /{category.slug}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {editingCategory === category._id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(category._id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(category)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                                       rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            disabled={deleteLoading === category._id}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 
                                       rounded-lg transition-all opacity-0 group-hover:opacity-100 
                                       disabled:opacity-50"
                          >
                            {deleteLoading === category._id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Category Modal ─── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowModal(false);
            setNewCategory("");
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Category</h2>
                  <p className="text-xs text-gray-400">Create a new product category</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewCategory("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-400 text-xs">*</span>
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Electronics, Clothing, Furniture..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                           text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewCategory("");
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold 
                           rounded-xl hover:bg-gray-100 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={saving || !newCategory.trim()}
                className={`flex-[2] px-4 py-2.5 font-semibold rounded-xl transition-all duration-200 
                           text-sm flex items-center justify-center gap-2 ${
                             saving || !newCategory.trim()
                               ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                               : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20"
                           }`}
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Create Category</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}