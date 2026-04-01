// frontend/app/admin/products/view/[slug]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import PermissionGate from "@/components/admin/PermissionGate";
import { getImageUrl } from "@/lib/imageHelper";
import { productAPI } from "@/lib/api";

const contentStyles = `
  .rich-content h2 { font-size: 1.4em; font-weight: 700; margin: 1.2em 0 0.5em; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.3em; }
  .rich-content h3 { font-size: 1.2em; font-weight: 600; margin: 1em 0 0.4em; color: #222; }
  .rich-content h4 { font-size: 1.05em; font-weight: 600; margin: 0.8em 0 0.3em; color: #333; }
  .rich-content p { margin: 0.5em 0; line-height: 1.7; }
  .rich-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
  .rich-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
  .rich-content li { margin: 0.3em 0; }
  .rich-content li p { margin: 0; }
  .rich-content blockquote { border-left: 4px solid #fbbf24; padding: 0.5em 1em; margin: 1em 0; background: #fffbeb; border-radius: 0 8px 8px 0; color: #92400e; }
  .rich-content pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; margin: 1em 0; font-size: 0.9em; overflow-x: auto; }
  .rich-content code { background: #f1f5f9; color: #d97706; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  .rich-content pre code { background: none; color: inherit; padding: 0; }
  .rich-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.2em 0; }
  .rich-content a { color: #d97706; text-decoration: underline; }
  .rich-content strong { font-weight: 700; }
`;

export default function ProductDetail() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const data = await productAPI.getBySlug(params.slug);

      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setError("Product not found");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);
  };

  const isHtml = (str) => /<[a-z][\s\S]*>/i.test(str);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Link href="/admin/products" className="inline-block mt-6 bg-amber-400 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-amber-500">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: contentStyles }} />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt={product.title} className="max-w-full max-h-[90vh] object-contain bg-white rounded-lg" />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">{product.category}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {product.isActive ? "Active" : "Inactive"}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${product.inStock ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>
          </div>
          
          {/* ✅ Only show Edit button if user has manageProducts permission */}
          <PermissionGate permission="manageProducts">
            <Link href={`/admin/products/edit/${product._id}`}
              className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-amber-500 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
          </PermissionGate>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT - Scrollable Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Images */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 cursor-pointer" 
                onClick={() => product.images?.[currentImage] && setPreviewImage(getImageUrl(product.images[currentImage]))}>
                <ProductImage
                  src={product.images?.[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto border-t border-gray-100">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImage === i ? "border-amber-400 scale-105" : "border-gray-200 hover:border-gray-300"}`}>
                      <ProductImage src={img} alt={`${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Full Description */}
            {product.description && (
              <div className="bg-white mt-2 border border-gray-200 rounded-xl p-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Description</h3>
                {isHtml(product.description) ? (
                  <div className="rich-content text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                )}
              </div>
            )}

            {/* Storage / Specs */}
            {product.storage && (
              <div className="bg-white border mt-2 border-gray-200 rounded-xl p-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Storage & Specifications</h3>
                {isHtml(product.storage) ? (
                  <div className="rich-content text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: product.storage }} />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{product.storage}</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT - STICKY SIDEBAR */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Pricing Card */}
              <div className="bg-white mb-2 border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pricing</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                  {product.unit && <span className="text-gray-500">/{product.unit}</span>}
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                      {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                    </span>
                  </div>
                )}
                {(product.minOrderQuantity > 1 || product.maxOrderQuantity) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Min Order</p>
                      <p className="font-semibold text-gray-900">{product.minOrderQuantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Max Order</p>
                      <p className="font-semibold text-gray-900">{product.maxOrderQuantity || "—"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Card */}
              <div className="bg-white mb-2 border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  {product.brand && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Brand</span>
                      <span className="font-medium text-gray-900">{product.brand}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-900">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${product.isActive ? "text-emerald-600" : "text-red-600"}`}>
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stock</span>
                    <span className={`font-medium ${product.inStock ? "text-emerald-600" : "text-red-600"}`}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  {product.trackQuantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity</span>
                      <span className="font-medium text-gray-900">{product.stockQuantity ?? "—"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="bg-white mb-2 border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.shortDescription}</p>
                </div>
              )}

              {/* Applications */}
              {product.applications?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Applications</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.applications.map((app, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-lg border border-amber-200">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Info</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="text-gray-700 font-mono truncate max-w-[160px]">{product._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Slug</span>
                    <span className="text-gray-700">{product.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-700">{new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated</span>
                    <span className="text-gray-700">{new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}