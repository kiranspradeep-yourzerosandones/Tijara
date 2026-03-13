"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProductDetail() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/slug/${params.slug}`);
      const data = await res.json();

      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setError("Product not found");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load product");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#ffe494] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-black">Product Not Found</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link
          href="/admin/products"
          className="inline-block mt-6 bg-[#ffe494] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#f5d97a]"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>

        <Link
          href={`/admin/products/edit/${product._id}`}
          className="flex items-center gap-2 bg-[#ffe494] text-black px-4 py-2 rounded-xl font-semibold hover:bg-[#f5d97a] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Product
        </Link>
      </div>

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Images Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            {product.images && product.images.length > 0 ? (
              <img
                src={`http://localhost:5000${product.images[currentImage]}`}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    currentImage === index ? "border-[#ffe494]" : "border-gray-200"
                  }`}
                >
                  <img
                    src={`http://localhost:5000${img}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <span className="px-3 py-1 bg-[#ffe494] text-black rounded-full text-sm font-medium">
              {product.category}
            </span>

            <h1 className="text-3xl font-bold text-black mt-4">{product.title}</h1>

            {product.brand && (
              <p className="text-gray-500 mt-2">Brand: <span className="text-black font-medium">{product.brand}</span></p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {product.shortDescription && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-700">{product.shortDescription}</p>
              </div>
            )}
          </div>

          {product.applications && product.applications.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Applications</h3>
              <div className="flex flex-wrap gap-2">
                {product.applications.map((app, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-[#ffe494]/30 text-black rounded-lg text-sm font-medium"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.storage && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Storage</h3>
              <p className="text-gray-700">{product.storage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Description */}
      {product.description && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-black mb-4">Full Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Product Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-black mb-4">Product Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Product ID</p>
            <p className="text-black font-medium text-sm truncate">{product._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Slug</p>
            <p className="text-black font-medium text-sm">{product.slug}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-black font-medium text-sm">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Updated</p>
            <p className="text-black font-medium text-sm">
              {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}