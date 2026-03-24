// frontend/app/admin/products/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import ProtectedPage from "@/components/admin/ProtectedPage";
import PermissionGate from "@/components/admin/PermissionGate";
import { usePermissions } from "@/context/PermissionContext";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AllProducts() {
  const { hasPermission } = usePermissions();
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
      const res = await fetch(`${API_URL}/products`, {
        headers: getAuthHeaders()
      });
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

      const uniqueCategories = [
        ...new Set(
          productList
            .map((p) => p?.category)
            .filter((cat) => cat && typeof cat === "string")
        ),
      ];
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
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.shortDescription?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    setFilteredProducts(result);
  };

  const handleDelete = async (id, title) => {
    if (!hasPermission("manageProducts")) {
      alert("You don't have permission to delete products");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleteLoading(id);

    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (res.ok) {
        setProducts(products.filter((p) => p._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (!hasPermission("manageProducts")) {
      alert("You don't have permission to update products");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("isActive", (!currentStatus).toString());

      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        setProducts(
          products.map((p) =>
            p._id === id ? { ...p, isActive: !currentStatus } : p
          )
        );
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPage permission="manageProducts">
      <div className="w-full min-h-screen">
        {/* ─── Sticky Header ─── */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 max-w-[1600px] mx-auto">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Products
                </h1>
                <span className="inline-flex px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  {filteredProducts.length} / {products.length}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage your product catalog
              </p>
            </div>
            
            {/* Only show Add button if user has permission */}
            <PermissionGate permission="manageProducts">
              <Link
                href="/admin/products/add-product"
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
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </PermissionGate>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="mt-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 placeholder:text-gray-400 transition-all duration-200
                             hover:border-gray-300"
                  />
                </div>

                {/* Category Filter + View Toggle */}
                <div className="flex gap-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 lg:flex-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white
                             text-gray-900 transition-all duration-200 hover:border-gray-300 
                             cursor-pointer min-w-[160px]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "table"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
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
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "grid"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Clear Filters */}
                  {(searchTerm || selectedCategory) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                      }}
                      className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors 
                               font-medium text-sm flex items-center gap-1.5"
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
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="mt-6 pb-6 max-w-[1600px] mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {searchTerm || selectedCategory ? "No Products Found" : "No Products Yet"}
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {searchTerm || selectedCategory
                  ? "Try adjusting your search or filter"
                  : "Start by adding your first product"}
              </p>
              {!searchTerm && !selectedCategory && (
                <PermissionGate permission="manageProducts">
                  <Link
                    href="/admin/products/add-product"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 hover:bg-gray-800 
                             text-white font-semibold rounded-xl transition-all duration-200 
                             shadow-lg shadow-gray-900/20 active:scale-[0.98]"
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
                    Add First Product
                  </Link>
                </PermissionGate>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
                        <h3 className="font-semibold text-gray-900 truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.category || "Uncategorized"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-amber-600 font-bold">
                            {formatPrice(product.price)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                              product.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/admin/products/view/${product.slug || product._id}`}
                        className="flex-1 text-center py-2.5 text-gray-600 bg-gray-100 rounded-xl 
                                 text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        View
                      </Link>
                      <PermissionGate permission="manageProducts">
                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="flex-1 text-center py-2.5 text-amber-700 bg-amber-100 rounded-xl 
                                   text-sm font-medium hover:bg-amber-200 transition-colors"
                        >
                          Edit
                        </Link>
                      </PermissionGate>
                      <PermissionGate permission="manageProducts">
                        <button
                          onClick={() => handleDelete(product._id, product.title)}
                          className="px-4 py-2.5 text-red-600 bg-red-50 rounded-xl text-sm font-medium 
                                   hover:bg-red-100 transition-colors"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <ProductImage
                              src={product.images?.[0]}
                              alt={product.title}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-100"
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">
                                {product.title}
                              </h3>
                              <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                {product.shortDescription || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                            {product.category || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.compareAtPrice > product.price && (
                              <span className="text-sm text-gray-400 line-through ml-2">
                                {formatPrice(product.compareAtPrice)}
                              </span>
                            )}
                          </div>
                          {product.unit && (
                            <span className="text-xs text-gray-500">
                              per {product.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border ${
                              product.inStock
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <PermissionGate 
                            permission="manageProducts"
                            fallback={
                              <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border ${
                                product.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}>
                                {product.isActive ? "Active" : "Inactive"}
                              </span>
                            }
                          >
                            <button
                              onClick={() => toggleStatus(product._id, product.isActive)}
                              className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border 
                                       transition-colors ${
                                         product.isActive
                                           ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                           : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                       }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </button>
                          </PermissionGate>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/products/view/${product.slug || product._id}`}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 
                                       rounded-xl transition-all duration-200"
                              title="View"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                            <PermissionGate permission="manageProducts">
                              <Link
                                href={`/admin/products/edit/${product._id}`}
                                className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 
                                         rounded-xl transition-all duration-200"
                                title="Edit"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </Link>
                            </PermissionGate>
                            <PermissionGate permission="manageProducts">
                              <button
                                onClick={() => handleDelete(product._id, product.title)}
                                disabled={deleteLoading === product._id}
                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 
                                         rounded-xl transition-all duration-200 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === product._id ? (
                                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                )}
                              </button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View - Same as before but with permission gates on actions */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden 
                           hover:shadow-xl hover:border-gray-300 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-50">
                    <ProductImage
                      src={product.images?.[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${
                          product.isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {product.discountPercentage > 0 && (
                        <span className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm">
                          -{product.discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                      <Link
                        href={`/admin/products/view/${product.slug || product._id}`}
                        className="p-3.5 bg-white rounded-xl text-gray-700 hover:text-blue-600 
                                 transition-colors shadow-lg hover:scale-110"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                      <PermissionGate permission="manageProducts">
                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="p-3.5 bg-white rounded-xl text-gray-700 hover:text-amber-600 
                                   transition-colors shadow-lg hover:scale-110"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                      </PermissionGate>
                      <PermissionGate permission="manageProducts">
                        <button
                          onClick={() => handleDelete(product._id, product.title)}
                          className="p-3.5 bg-white rounded-xl text-gray-700 hover:text-red-600 
                                   transition-colors shadow-lg hover:scale-110"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </PermissionGate>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      {product.category || "Uncategorized"}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-1 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">
                      {product.shortDescription || "No description"}
                    </p>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-amber-600">
                        {formatPrice(product.price)}
                      </span>
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
                      <span
                        className={`text-xs font-semibold ${
                          product.inStock ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
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
      </div>
    </ProtectedPage>
  );
}