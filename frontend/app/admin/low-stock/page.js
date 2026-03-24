// frontend/app/admin/inventory/low-stock/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LowStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, low, out
  const [updating, setUpdating] = useState(null);

  // Stock Update Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    quantity: "",
    operation: "set" // set, add, subtract
  });

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch all products that track quantity
      const res = await fetch(`${API_URL}/products?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();

      let productsList = [];
      if (data.success && data.data?.products) {
        productsList = data.data.products;
      } else if (data.products && Array.isArray(data.products)) {
        productsList = data.products;
      } else if (Array.isArray(data)) {
        productsList = data;
      }

      // Filter products based on stock status
      let filtered = productsList.filter(p => p.trackQuantity);

      if (filter === "out") {
        filtered = filtered.filter(p => p.stockQuantity <= 0 || !p.inStock);
      } else if (filter === "low") {
        filtered = filtered.filter(p => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 10));
      } else {
        // Show all tracked products, sorted by stock level
        filtered = filtered.sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));
      }

      setProducts(filtered);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (product) => {
    setSelectedProduct(product);
    setStockForm({
      quantity: "",
      operation: "add"
    });
    setShowUpdateModal(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !stockForm.quantity) return;

    setUpdating(selectedProduct._id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/${selectedProduct._id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: parseInt(stockForm.quantity),
          operation: stockForm.operation
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowUpdateModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert(data.message || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update stock");
    } finally {
      setUpdating(null);
    }
  };

  const quickUpdateStock = async (productId, operation, amount = 1) => {
    setUpdating(productId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/products/${productId}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: amount,
          operation: operation
        })
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const getStockBadge = (product) => {
    const stock = product.stockQuantity || 0;
    const threshold = product.lowStockThreshold || 10;

    if (stock <= 0) {
      return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">Out of Stock</span>;
    } else if (stock <= threshold) {
      return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">Low Stock</span>;
    } else {
      return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">In Stock</span>;
    }
  };

  const outOfStockCount = products.filter(p => (p.stockQuantity || 0) <= 0).length;
  const lowStockCount = products.filter(p => {
    const stock = p.stockQuantity || 0;
    return stock > 0 && stock <= (p.lowStockThreshold || 10);
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Alert</h1>
          <p className="text-gray-500 mt-1">Monitor and manage inventory levels</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 
                   bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          All Products
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 mb-2 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`p-5 rounded-2xl border-2 transition-all text-left ${
            filter === "all" 
              ? "border-amber-400 bg-amber-50" 
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center   gap-4">
            <div className={`w-12 h-12  rounded-xl flex items-center justify-center ${
              filter === "all" ? "bg-amber-200" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${filter === "all" ? "text-amber-700" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tracked Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter("low")}
          className={`p-5 rounded-2xl border-2 transition-all text-left ${
            filter === "low" 
              ? "border-amber-400 bg-amber-50" 
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              filter === "low" ? "bg-amber-200" : "bg-amber-100"
            }`}>
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter("out")}
          className={`p-5 rounded-2xl border-2 transition-all text-left ${
            filter === "out" 
              ? "border-red-400 bg-red-50" 
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              filter === "out" ? "bg-red-200" : "bg-red-100"
            }`}>
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {filter === "all" ? "No tracked products" : "All Good!"}
            </h3>
            <p className="text-gray-500 mt-1">
              {filter === "all" 
                ? "Enable stock tracking on products to see them here" 
                : filter === "low"
                  ? "No products are running low on stock"
                  : "No products are out of stock"
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Current Stock</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Quick Update</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.images?.[0] ? (
                              <ProductImage
                                src={product.images[0]}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link href={`/admin/products/view/${product.slug || product._id}`} className="font-medium text-gray-900 hover:text-amber-600">
                              {product.title}
                            </Link>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-2xl font-bold ${
                          (product.stockQuantity || 0) <= 0 ? "text-red-600" :
                          (product.stockQuantity || 0) <= (product.lowStockThreshold || 10) ? "text-amber-600" :
                          "text-gray-900"
                        }`}>
                          {product.stockQuantity || 0}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">{product.unit || "units"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-600">{product.lowStockThreshold || 10}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStockBadge(product)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => quickUpdateStock(product._id, "subtract", 1)}
                            disabled={updating === product._id || (product.stockQuantity || 0) <= 0}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 
                                     text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-12 text-center font-mono font-bold">
                            {updating === product._id ? (
                              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : (
                              product.stockQuantity || 0
                            )}
                          </span>
                          <button
                            onClick={() => quickUpdateStock(product._id, "add", 1)}
                            disabled={updating === product._id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 
                                     text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openUpdateModal(product)}
                          className="px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 
                                   hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {products.map((product) => (
                <div key={product._id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images?.[0] ? (
                        <ProductImage
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStockBadge(product)}
                        <span className={`font-bold ${
                          (product.stockQuantity || 0) <= 0 ? "text-red-600" : "text-gray-900"
                        }`}>
                          {product.stockQuantity || 0} {product.unit || "units"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center gap-1 flex-1">
                      <button
                        onClick={() => quickUpdateStock(product._id, "subtract", 1)}
                        disabled={updating === product._id || (product.stockQuantity || 0) <= 0}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 
                                 hover:bg-gray-100 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-16 text-center font-mono font-bold">
                        {updating === product._id ? "..." : product.stockQuantity || 0}
                      </span>
                      <button
                        onClick={() => quickUpdateStock(product._id, "add", 1)}
                        disabled={updating === product._id}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 
                                 hover:bg-gray-100 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => openUpdateModal(product)}
                      className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg 
                               hover:bg-amber-200 transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Update Stock Modal */}
      {showUpdateModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUpdateModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Update Stock</h2>
              <button onClick={() => setShowUpdateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUpdateStock} className="p-6 space-y-5">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  {selectedProduct.images?.[0] ? (
                    <ProductImage
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedProduct.title}</h3>
                  <p className="text-sm text-gray-500">
                    Current: <span className="font-bold text-gray-900">{selectedProduct.stockQuantity || 0}</span> {selectedProduct.unit || "units"}
                  </p>
                </div>
              </div>

              {/* Operation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "set", label: "Set to" },
                    { value: "add", label: "Add" },
                    { value: "subtract", label: "Subtract" }
                  ].map((op) => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setStockForm(prev => ({ ...prev, operation: op.value }))}
                      className={`py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                        stockForm.operation === op.value
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-lg font-bold text-center"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              {/* Preview */}
              {stockForm.quantity && (
                <div className="p-4 bg-amber-50 rounded-xl text-center">
                  <p className="text-sm text-amber-700">New stock will be:</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {stockForm.operation === "set" 
                      ? parseInt(stockForm.quantity || 0)
                      : stockForm.operation === "add"
                        ? (selectedProduct.stockQuantity || 0) + parseInt(stockForm.quantity || 0)
                        : Math.max(0, (selectedProduct.stockQuantity || 0) - parseInt(stockForm.quantity || 0))
                    }
                  </p>
                  <p className="text-sm text-amber-600">{selectedProduct.unit || "units"}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={updating === selectedProduct._id}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl 
                         transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating === selectedProduct._id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Stock
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}