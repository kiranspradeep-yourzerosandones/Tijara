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
        body: JSON.stringify({ name: newCategory })
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
        method: "DELETE"
      });

      if (res.ok) {
        setCategories(categories.filter(c => c._id !== id));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 px-5 py-3 rounded-xl font-semibold transition-all shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Categories Yet</h3>
            <p className="text-gray-500 mt-2">Add categories to organize your products</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-amber-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Category
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.slug && (
                        <p className="text-xs text-gray-500">{category.slug}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(category._id)}
                    disabled={deleteLoading === category._id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deleteLoading === category._id ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Category</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewCategory("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category Name"
              className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddCategory}
                disabled={saving || !newCategory.trim()}
                className="flex-1 bg-amber-400 text-gray-900 py-3 rounded-xl font-semibold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Add Category"
                )}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewCategory("");
                }}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}