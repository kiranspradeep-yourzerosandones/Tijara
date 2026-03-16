// frontend/app/admin/products/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      
      let productList = [];
      if (data.success && data.data?.products) {
        productList = data.data.products;
      } else if (data.products) {
        productList = data.products;
      } else if (Array.isArray(data)) {
        productList = data;
      }

      if (!Array.isArray(productList)) {
        productList = [];
      }

      setProducts(productList);
      setFilteredProducts(productList);

      const uniqueCategories = [...new Set(
        productList
          .map(p => p?.category)
          .filter(cat => cat && typeof cat === 'string')
      )];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.shortDescription?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(result);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleteLoading(id);

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setProducts(products.filter(p => p._id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const formData = new FormData();
      formData.append("isActive", (!currentStatus).toString());

      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        body: formData
      });

      if (res.ok) {
        setProducts(products.map(p =>
          p._id === id ? { ...p, isActive: !currentStatus } : p
        ));
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "—";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <Link
          href="/admin/products/add-product"
          className="inline-flex items-center justify-center gap-2 bg-[#ffe494] hover:bg-amber-300 text-gray-900 px-5 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all text-gray-900"
            />
          </div>

          {/* Category Filter + View Toggle */}
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 lg:flex-none px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 min-w-[160px] text-gray-900 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="hidden sm:flex border-2 border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-3 transition-colors ${
                  viewMode === "table"
                    ? "bg-amber-400 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-3 transition-colors ${
                  viewMode === "grid"
                    ? "bg-amber-400 text-gray-900"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 text-center shadow-sm">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4 text-lg">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mt-6">
            {searchTerm || selectedCategory ? "No Products Found" : "No Products Yet"}
          </h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filter"
              : "Start by adding your first product"
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <Link
              href="/admin/products/add-product"
              className="inline-flex items-center gap-2 mt-6 bg-[#ffe494] text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Product
            </Link>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <div key={product._id} className="p-4">
                <div className="flex gap-4">
                  <ProductImage
                    src={product.images?.[0]}
                    alt={product.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                    <p className="text-sm text-gray-500">{product.category || "Uncategorized"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-amber-600 font-bold">{formatPrice(product.price)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/admin/products/view/${product.slug || product._id}`}
                    className="flex-1 text-center py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/products/edit/${product._id}`}
                    className="flex-1 text-center py-2 text-amber-700 bg-amber-100 rounded-lg text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id, product.title)}
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <ProductImage
                          src={product.images?.[0]}
                          alt={product.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">{product.title}</h3>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {product.shortDescription || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {product.category || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-gray-900">{formatPrice(product.price)}</span>
                        {product.compareAtPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through ml-2">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      {product.unit && (
                        <span className="text-xs text-gray-500">per {product.unit}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        product.inStock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(product._id, product.isActive)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          product.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/view/${product.slug || product._id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.title)}
                          disabled={deleteLoading === product._id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === product._id ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-100">
                <ProductImage
                  src={product.images?.[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    product.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">
                      -{product.discountPercentage}%
                    </span>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                  <Link
                    href={`/admin/products/view/${product.slug || product._id}`}
                    className="p-3 bg-white rounded-xl text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <Link
                    href={`/admin/products/edit/${product._id}`}
                    className="p-3 bg-white rounded-xl text-gray-700 hover:text-amber-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id, product.title)}
                    className="p-3 bg-white rounded-xl text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  {product.category || "Uncategorized"}
                </span>
                <h3 className="font-bold text-gray-900 mt-1 line-clamp-1">{product.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
                  {product.shortDescription || "No description"}
                </p>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-amber-600">{formatPrice(product.price)}</span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                  {product.unit && (
                    <span className="text-xs text-gray-500">/{product.unit}</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className={`text-xs font-medium ${
                    product.inStock ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {product.inStock ? "✓ In Stock" : "✗ Out of Stock"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}