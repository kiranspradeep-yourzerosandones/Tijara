// frontend/app/admin/products/edit/[id]/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import ProductImage from "@/components/ProductImage";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getImageUrl } from "@/lib/imageHelper";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const EditorModal = dynamic(
  () => import("@/components/admin/RichTextEditor/EditorModal"),
  { ssr: false }
);

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    brand: "",
    applications: "",
    storage: "",
    price: "",
    compareAtPrice: "",
    unit: "piece",
    minOrderQuantity: "1",
    maxOrderQuantity: "100",
    inStock: true,
    isActive: true,
    trackQuantity: false,
    stockQuantity: "",
    lowStockThreshold: "10"
  });

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryRef = useRef(null);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [descriptionModal, setDescriptionModal] = useState(false);
  const [storageModal, setStorageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const units = [
    { value: "piece", label: "Piece" },
    { value: "kg", label: "Kg" },
    { value: "liter", label: "Liter" },
    { value: "box", label: "Box" },
    { value: "pack", label: "Pack" },
    { value: "dozen", label: "Dozen" },
    { value: "meter", label: "Meter" },
    { value: "unit", label: "Unit" }
  ];

  useEffect(() => {
    fetchProduct();
    fetchCategories();

    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [productId]);

  useEffect(() => {
    if (categorySearch) {
      setFilteredCategories(categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      ));
    } else {
      setFilteredCategories(categories);
    }
  }, [categorySearch, categories]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const cats = data.categories || data || [];
      setCategories(Array.isArray(cats) ? cats : []);
      setFilteredCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }
      
      const data = await res.json();
      const product = data.product || data;

      setFormData({
        title: product.title || "",
        shortDescription: product.shortDescription || "",
        description: product.description || "",
        category: product.category || "",
        brand: product.brand || "",
        applications: product.applications ? product.applications.join(", ") : "",
        storage: product.storage || "",
        price: product.price ? String(product.price) : "",
        compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
        unit: product.unit || "piece",
        minOrderQuantity: product.minOrderQuantity ? String(product.minOrderQuantity) : "1",
        maxOrderQuantity: product.maxOrderQuantity ? String(product.maxOrderQuantity) : "100",
        inStock: product.inStock !== false,
        isActive: product.isActive !== false,
        trackQuantity: product.trackQuantity || false,
        stockQuantity: product.stockQuantity !== null && product.stockQuantity !== undefined ? String(product.stockQuantity) : "",
        lowStockThreshold: product.lowStockThreshold ? String(product.lowStockThreshold) : "10"
      });

      setCategorySearch(product.category || "");
      setExistingImages(product.images || []);
    } catch (error) {
      console.error("Error fetching product:", error);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleCategorySelect = (name) => {
    setFormData({ ...formData, category: name });
    setCategorySearch(name);
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (e) => {
    setCategorySearch(e.target.value);
    setFormData({ ...formData, category: e.target.value });
    setShowCategoryDropdown(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setNewImages(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!formData.title.trim()) { 
      setError("Product title is required"); 
      setSaving(false); 
      return; 
    }
    if (!formData.category.trim()) { 
      setError("Category is required"); 
      setSaving(false); 
      return; 
    }

    try {
      const data = new FormData();

      data.append("title", formData.title);
      data.append("shortDescription", formData.shortDescription);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("brand", formData.brand);
      data.append("applications", formData.applications);
      data.append("storage", formData.storage);
      data.append("isActive", formData.isActive);
      data.append("existingImages", JSON.stringify(existingImages));

      if (formData.price) data.append("price", formData.price);
      if (formData.compareAtPrice) data.append("compareAtPrice", formData.compareAtPrice);
      data.append("unit", formData.unit);
      data.append("minOrderQuantity", formData.minOrderQuantity);
      data.append("maxOrderQuantity", formData.maxOrderQuantity);
      data.append("inStock", formData.inStock);

      // Stock tracking fields
      data.append("trackQuantity", formData.trackQuantity);
      if (formData.trackQuantity && formData.stockQuantity !== "") {
        data.append("stockQuantity", formData.stockQuantity);
      }
      data.append("lowStockThreshold", formData.lowStockThreshold);

      newImages.forEach(image => {
        data.append("images", image);
      });

      // ✅ Include auth headers
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: "PUT",
        headers: getAuthHeaders(), // This adds Authorization header
        body: data
      });

      const result = await res.json();

      if (res.ok) {
        setSuccess("Product updated successfully!");
        setTimeout(() => router.push("/admin/products"), 1500);
      } else {
        setError(result.message || "Failed to update product");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const discountPercent =
    formData.price &&
    formData.compareAtPrice &&
    parseFloat(formData.compareAtPrice) > parseFloat(formData.price)
      ? Math.round(
          ((parseFloat(formData.compareAtPrice) - parseFloat(formData.price)) /
            parseFloat(formData.compareAtPrice)) *
            100
        )
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPage permission="manageProducts">
      {/* Rich Text Editor Modals */}
      <EditorModal
        isOpen={descriptionModal}
        onClose={() => setDescriptionModal(false)}
        title="Full Description"
        value={formData.description}
        onChange={(html) => setFormData({ ...formData, description: html })}
        placeholder="Write a detailed product description..."
      />

      <EditorModal
        isOpen={storageModal}
        onClose={() => setStorageModal(false)}
        title="Storage Instructions"
        value={formData.storage}
        onChange={(html) => setFormData({ ...formData, storage: html })}
        placeholder="Write storage and handling instructions..."
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain bg-white rounded-lg" />
          </div>
        </div>
      )}

      <div className="w-full">

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex items-center justify-between py-4 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="group p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
                  <span className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${formData.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block truncate max-w-xs">{formData.title || "Untitled"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin/products"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-gray-500 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`group relative px-6 sm:px-7 py-2.5 font-semibold text-sm transition-all duration-200 flex items-center gap-2 rounded-xl overflow-hidden ${
                  saving
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Update Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className="mt-6 max-w-[1600px] mx-auto">
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-3 text-sm rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <span className="font-medium">{success}</span>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200/60 text-red-800 flex items-center gap-3 text-sm rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </div>
                <span className="flex-1 font-medium">{error}</span>
                <button onClick={() => setError("")} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 pb-6 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">

            {/* ═══════════ LEFT COLUMN ═══════════ */}
            <div className="xl:col-span-7 space-y-6">

              {/* Basic Information */}
              <div className="bg-white rounded-2xl mb-2 border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                      <p className="text-xs text-gray-400">Product identity and classification</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Title <span className="text-red-400 text-xs">*</span></label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Premium Industrial Adhesive 500ml"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300" required />
                  </div>

                  {/* Category + Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div ref={categoryRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-400 text-xs">*</span></label>
                      <div className="relative">
                        <input type="text" value={categorySearch} onChange={handleCategoryInputChange} onFocus={() => setShowCategoryDropdown(true)}
                          placeholder="Select or type category"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 pr-10 transition-all duration-200 hover:border-gray-300" />
                        <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors">
                          <svg className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      {showCategoryDropdown && (
                        <div className="absolute z-30 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 max-h-52 overflow-y-auto">
                          <div className="p-1.5">
                            {filteredCategories.length === 0 ? (
                              <div className="p-4 text-center"><p className="text-gray-400 text-sm">{categorySearch ? `Create "${categorySearch}"` : "No categories found"}</p></div>
                            ) : filteredCategories.map((cat) => (
                              <button key={cat._id} type="button" onClick={() => handleCategorySelect(cat.name)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all duration-150 flex items-center justify-between text-sm ${formData.category === cat.name ? "bg-amber-50 text-amber-800 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                                <span>{cat.name}</span>
                                {formData.category === cat.name && <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. BrandName"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300" />
                    </div>
                  </div>

                  {/* Short Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Short Description</label>
                      <span className={`text-xs font-mono tabular-nums ${formData.shortDescription.length > 180 ? "text-amber-600" : "text-gray-400"}`}>
                        {formData.shortDescription.length}/200
                      </span>
                    </div>
                    <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange}
                      placeholder="Brief product summary..." rows="3" maxLength={200}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 resize-none transition-all duration-200 hover:border-gray-300" />
                  </div>
                </div>
              </div>

              {/* Detailed Content */}
              <div className="bg-white rounded-2xl mb-2 border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Detailed Content</h3>
                      <p className="text-xs text-gray-400">Rich descriptions and product specs</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {/* Full Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
                    <button type="button" onClick={() => setDescriptionModal(true)}
                      className="w-full text-left border border-gray-200 rounded-xl hover:border-amber-400 transition-all duration-200 group overflow-hidden hover:shadow-md hover:shadow-amber-100/50">
                      {formData.description ? (
                        <div className="px-5 py-4 max-h-28 overflow-hidden relative">
                          <div className="text-gray-600 text-sm leading-relaxed line-clamp-3 prose prose-sm" dangerouslySetInnerHTML={{ __html: formData.description }} />
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent" />
                        </div>
                      ) : (
                        <div className="px-5 py-8 flex flex-col items-center gap-3 text-gray-400 group-hover:text-amber-500 transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </div>
                          <span className="text-sm font-medium">Click to write rich description</span>
                        </div>
                      )}
                      <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-mono">{formData.description ? `${stripHtml(formData.description).length} characters` : "No content yet"}</span>
                        <span className="text-xs text-amber-600 font-semibold group-hover:text-amber-700 flex items-center gap-1.5 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          {formData.description ? "Edit" : "Open"} Editor
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Applications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Applications <span className="text-gray-400 text-xs font-normal">(comma separated)</span></label>
                    <input type="text" name="applications" value={formData.applications} onChange={handleChange} placeholder="e.g. Adhesives, Laminates, Coatings"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300" />
                    {formData.applications && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {formData.applications.split(",").filter(a => a.trim()).map((app, i) => (
                          <span key={i} className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">{app.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Storage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Storage Instructions</label>
                    <button type="button" onClick={() => setStorageModal(true)}
                      className="w-full text-left border border-gray-200 rounded-xl hover:border-amber-400 transition-all duration-200 group overflow-hidden hover:shadow-md hover:shadow-amber-100/50">
                      {formData.storage ? (
                        <div className="px-5 py-3.5">
                          <div className="text-gray-600 text-sm line-clamp-2 prose prose-sm" dangerouslySetInnerHTML={{ __html: formData.storage }} />
                        </div>
                      ) : (
                        <div className="px-5 py-5 flex items-center gap-3 text-gray-400 group-hover:text-amber-500 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-amber-50 flex items-center justify-center transition-colors flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Add storage instructions</p>
                            <p className="text-xs text-gray-400">Temperature, handling, shelf life...</p>
                          </div>
                        </div>
                      )}
                      <div className="px-5 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end">
                        <span className="text-xs text-amber-600 font-semibold group-hover:text-amber-700 flex items-center gap-1 transition-colors">
                          {formData.storage ? "Edit" : "Write"}
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Active Status */}
                  <label className="flex items-center justify-between py-4 px-5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ring-4 transition-all duration-200 ${formData.isActive ? "bg-emerald-500 ring-emerald-100" : "bg-red-500 ring-red-100"}`} />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{formData.isActive ? "Active" : "Inactive"}</span>
                        <p className="text-xs text-gray-400">{formData.isActive ? "Visible on website" : "Hidden from website"}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                      <div className="w-12 h-6 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-6" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ═══════════ RIGHT COLUMN ═══════════ */}
            <div className="xl:col-span-5 space-y-6">

              {/* Images */}
              <div className="bg-white rounded-2xl mb-2 border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Product Images</h3>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded-md ${(existingImages.length + newImagePreviews.length) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                      {existingImages.length + newImagePreviews.length}/5
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-3 gap-3 mb-4">
                      {existingImages.map((img, index) => (
                        <div key={`ex-${index}`} className="relative aspect-square group cursor-pointer rounded-xl overflow-hidden ring-1 ring-gray-200"
                          onClick={() => setPreviewImage(getImageUrl(img))}>
                          <ProductImage src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2">
                            <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingImage(index); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 backdrop-blur text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {index === 0 && <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-amber-400/90 backdrop-blur text-gray-900 text-[10px] font-bold rounded-md tracking-wide">COVER</span>}
                        </div>
                      ))}
                      {newImagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative aspect-square group cursor-pointer rounded-xl overflow-hidden ring-2 ring-emerald-400"
                          onClick={() => setPreviewImage(preview)}>
                          <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-md">NEW</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeNewImage(index); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 backdrop-blur text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(existingImages.length + newImagePreviews.length) < 5 && (
                    <label className={`block border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 ${(existingImages.length + newImagePreviews.length) > 0 ? "p-5" : "p-10"}`}>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <div className={`${(existingImages.length + newImagePreviews.length) > 0 ? "w-10 h-10" : "w-14 h-14"} rounded-xl bg-gray-100 flex items-center justify-center`}>
                          <svg className={`${(existingImages.length + newImagePreviews.length) > 0 ? "w-5 h-5" : "w-7 h-7"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{(existingImages.length + newImagePreviews.length) > 0 ? "Add more images" : "Drop images here or click to upload"}</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl mb-2 border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Pricing</h3>
                      <p className="text-xs text-gray-400">Set product pricing and discounts</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price <span className="text-red-400 text-xs">*</span></label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01"
                          className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 font-semibold text-lg placeholder:text-gray-300 placeholder:font-normal transition-all duration-200 hover:border-gray-300" required />
                      </div>
                      <select name="unit" value={formData.unit} onChange={handleChange}
                        className="w-24 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:border-gray-300">
                        {units.map(u => <option key={u.value} value={u.value}>/{u.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Compare at price <span className="text-gray-400 text-xs font-normal">(MRP)</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <input type="number" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} placeholder="Original price" min="0" step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:border-gray-300" />
                    </div>
                    {discountPercent && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">
                          {discountPercent}% OFF
                        </span>
                        <span className="text-xs text-gray-400">Customer saves ₹{(parseFloat(formData.compareAtPrice) - parseFloat(formData.price)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory - MATCHING ADD PRODUCT STYLE */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Inventory</h3>
                      <p className="text-xs text-gray-400">Stock and order quantity settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {/* Order Quantity Limits */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Min Order</label>
                      <input type="number" name="minOrderQuantity" value={formData.minOrderQuantity} onChange={handleChange} min="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Max Order</label>
                      <input type="number" name="maxOrderQuantity" value={formData.maxOrderQuantity} onChange={handleChange} min="1"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 focus:bg-white text-gray-900 font-medium transition-all duration-200 hover:border-gray-300" />
                    </div>
                  </div>

                  {/* Track Stock Quantity Toggle */}
                  <div className="border border-gray-200 rounded-xl mb-2 overflow-hidden">
                    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${formData.trackQuantity ? "bg-indigo-100" : "bg-gray-100"}`}>
                          <svg className={`w-5 h-5 ${formData.trackQuantity ? "text-indigo-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">Track Stock Quantity</span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formData.trackQuantity ? "Stock will be tracked and decremented on orders" : "No stock tracking - use manual In Stock toggle"}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <input type="checkbox" name="trackQuantity" checked={formData.trackQuantity} onChange={handleChange} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-200 peer-checked:bg-indigo-500 rounded-full transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-6" />
                      </div>
                    </label>

                    {/* Stock Quantity Input */}
                    {formData.trackQuantity && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-indigo-50/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Stock Quantity</label>
                            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} min="0" placeholder="0"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-gray-900 font-semibold text-lg transition-all duration-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Low Stock Alert</label>
                            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} min="1" placeholder="10"
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 text-gray-900 font-medium transition-all duration-200" />
                          </div>
                        </div>
                        {formData.stockQuantity && parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Low stock warning will be triggered
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* In Stock Toggle - Only when NOT tracking quantity */}
                  {!formData.trackQuantity && (
                    <label className={`flex items-center justify-between py-4 px-5 rounded-xl cursor-pointer transition-all duration-200 border ${
                      formData.inStock ? "bg-emerald-50/50 border-emerald-200/60 hover:bg-emerald-50" : "bg-red-50/50 border-red-200/60 hover:bg-red-50"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ring-4 transition-all duration-200 ${formData.inStock ? "bg-emerald-500 ring-emerald-100" : "bg-red-500 ring-red-100"}`} />
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{formData.inStock ? "In Stock" : "Out of Stock"}</span>
                          <p className="text-xs text-gray-400 mt-0.5">{formData.inStock ? "Product is available for purchase" : "Product is currently unavailable"}</p>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} className="sr-only peer" />
                        <div className="w-12 h-6 bg-gray-200 peer-checked:bg-emerald-500 rounded-full transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-6" />
                      </div>
                    </label>
                  )}

                  {/* Stock Status Display when tracking */}
                  {formData.trackQuantity && formData.stockQuantity !== "" && (
                    <div className={`p-4 rounded-xl border ${
                      parseInt(formData.stockQuantity) <= 0 ? "bg-red-50 border-red-200" :
                      parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "bg-amber-50 border-amber-200" :
                      "bg-emerald-50 border-emerald-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          parseInt(formData.stockQuantity) <= 0 ? "bg-red-100" :
                          parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "bg-amber-100" :
                          "bg-emerald-100"
                        }`}>
                          {parseInt(formData.stockQuantity) <= 0 ? (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          ) : (
                            <svg className={`w-5 h-5 ${parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-amber-600" : "text-emerald-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${
                            parseInt(formData.stockQuantity) <= 0 ? "text-red-800" :
                            parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-amber-800" :
                            "text-emerald-800"
                          }`}>
                            {parseInt(formData.stockQuantity) <= 0 ? "Out of Stock" :
                             parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "Low Stock" : "In Stock"}
                          </p>
                          <p className={`text-xs ${
                            parseInt(formData.stockQuantity) <= 0 ? "text-red-600" :
                            parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold || 10) ? "text-amber-600" :
                            "text-emerald-600"
                          }`}>
                            {formData.stockQuantity} units available
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Mobile Bottom Bar */}
        <div className="xl:hidden mb-2 fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 p-4 z-30">
          <div className="flex gap-3 ml-0 sm:ml-64 max-w-2xl mx-auto">
            <Link href="/admin/products" className="flex-1 py-3.5 text-center text-gray-600 font-semibold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </Link>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className={`flex-[2] py-3.5 font-semibold flex items-center justify-center gap-2 rounded-xl text-sm transition-all duration-200 ${
                saving ? "bg-gray-100 text-gray-400" : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20 active:scale-[0.98]"
              }`}>
              {saving ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Update Product</>
              )}
            </button>
          </div>
        </div>
        <div className="xl:hidden h-24" />
      </div>
     </ProtectedPage>
  );
}