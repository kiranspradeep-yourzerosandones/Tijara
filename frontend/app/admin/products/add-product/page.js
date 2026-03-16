// frontend/app/admin/products/add-product/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ✅ Dynamic import to avoid SSR issues with TipTap
const EditorModal = dynamic(
  () => import("@/components/admin/RichTextEditor/EditorModal"),
  { ssr: false }
);

export default function AddProduct() {
  const router = useRouter();

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
    inStock: true
  });

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryRef = useRef(null);

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editor modal states
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
    fetchCategories();
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      const cats = data.categories || data || [];
      setCategories(Array.isArray(cats) ? cats : []);
      setFilteredCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.title.trim()) { setError("Product title is required"); setLoading(false); return; }
    if (!formData.category.trim()) { setError("Category is required"); setLoading(false); return; }
    if (!formData.price || isNaN(parseFloat(formData.price))) { setError("Valid price is required"); setLoading(false); return; }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      images.forEach(image => data.append("images", image));

      const response = await fetch(`${API_URL}/products`, { method: "POST", body: data });
      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Product created successfully!");
        setTimeout(() => router.push("/admin/products"), 1500);
      } else {
        setError(result.message || "Failed to create product");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Strip HTML tags for plain text preview
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <>
      {/* Rich Text Editor Modals */}
      <EditorModal
        isOpen={descriptionModal}
        onClose={() => setDescriptionModal(false)}
        title="Full Description"
        value={formData.description}
        onChange={(html) => setFormData({ ...formData, description: html })}
        placeholder="Write a detailed product description. You can use headings, lists, bold, links and more..."
      />

      <EditorModal
        isOpen={storageModal}
        onClose={() => setStorageModal(false)}
        title="Storage Instructions"
        value={formData.storage}
        onChange={(html) => setFormData({ ...formData, storage: html })}
        placeholder="Write storage and handling instructions. Use bullet points for clarity..."
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain bg-white" />
          </div>
        </div>
      )}

      <div className="w-full">

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 -mx-6 px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">New Product</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/admin/products" className="hidden sm:block px-4 py-2 text-gray-500 hover:text-gray-900 font-medium">
                Discard
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={`px-5 sm:px-6 py-2.5 font-semibold transition-all flex items-center gap-2 rounded-lg ${
                  loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-amber-400 hover:bg-amber-500 text-gray-900 shadow-sm"
                }`}
              >
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span className="hidden sm:inline">Saving...</span></>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>Save</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className="mt-4">
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* LEFT COLUMN */}
            <div className="xl:col-span-3 bg-white border border-gray-200">
              <div className="p-5 sm:p-6 space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-400">*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Product title"
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" required />
                </div>

                {/* Category + Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div ref={categoryRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type="text" value={categorySearch} onChange={handleCategoryInputChange} onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Select or type" className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 pr-10 transition-all" />
                      <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className={`w-4 h-4 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 shadow-xl max-h-48 overflow-y-auto">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">{categorySearch ? `Use "${categorySearch}"` : "No categories"}</div>
                        ) : filteredCategories.map((cat) => (
                          <button key={cat._id} type="button" onClick={() => handleCategorySelect(cat.name)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors flex items-center justify-between text-sm ${formData.category === cat.name ? "bg-amber-50 text-amber-700" : "text-gray-900"}`}>
                            {cat.name}
                            {formData.category === cat.name && <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand name"
                      className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Short Description <span className="text-gray-400 font-normal">{formData.shortDescription.length}/200</span>
                  </label>
                  <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange}
                    placeholder="Brief product summary" rows="2" maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 resize-none transition-all" />
                </div>

                {/* Full Description - Rich Editor Trigger */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
                  <button type="button" onClick={() => setDescriptionModal(true)}
                    className="w-full text-left border border-gray-300 hover:border-amber-400 transition-colors group">
                    {formData.description ? (
                      <div className="px-4 py-3 max-h-24 overflow-hidden relative">
                        <div className="text-gray-700 text-sm line-clamp-3" dangerouslySetInnerHTML={{ __html: formData.description }} />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    ) : (
                      <div className="px-4 py-6 flex flex-col items-center gap-2 text-gray-400 group-hover:text-amber-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="text-sm">Click to write rich description</span>
                      </div>
                    )}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formData.description ? `${stripHtml(formData.description).length} chars` : "Empty"}</span>
                      <span className="text-xs text-amber-600 font-medium group-hover:text-amber-700 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        {formData.description ? "Edit" : "Write"} with rich editor
                      </span>
                    </div>
                  </button>
                </div>

                {/* Applications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Applications <span className="text-gray-400 font-normal">(comma separated)</span></label>
                  <input type="text" name="applications" value={formData.applications} onChange={handleChange}
                    placeholder="Adhesives, Laminates, Coatings" className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" />
                </div>

                {/* Storage - Rich Editor Trigger */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Storage Instructions</label>
                  <button type="button" onClick={() => setStorageModal(true)}
                    className="w-full text-left border border-gray-300 hover:border-amber-400 transition-colors group">
                    {formData.storage ? (
                      <div className="px-4 py-3">
                        <div className="text-gray-700 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: formData.storage }} />
                      </div>
                    ) : (
                      <div className="px-4 py-4 flex items-center gap-3 text-gray-400 group-hover:text-amber-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <span className="text-sm">Click to write storage instructions</span>
                      </div>
                    )}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
                      <span className="text-xs text-amber-600 font-medium group-hover:text-amber-700">{formData.storage ? "Edit" : "Write"} →</span>
                    </div>
                  </button>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="xl:col-span-2 space-y-6">

              {/* Images */}
              <div className="bg-white border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Images <span className="text-gray-400 font-normal">{imagePreviews.length}/5</span></h3>
                </div>
                <div className="p-5">
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 xl:grid-cols-4 gap-2 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square group cursor-pointer" onClick={() => setPreviewImage(preview)}>
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover border border-gray-200 group-hover:border-amber-400 transition-colors" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {index === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-amber-400 text-gray-900 text-[10px] font-bold">MAIN</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {imagePreviews.length < 5 && (
                    <label className={`block border-2 border-dashed border-gray-300 hover:border-amber-400 transition-colors cursor-pointer ${imagePreviews.length > 0 ? "p-4" : "p-8"}`}>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg className={`${imagePreviews.length > 0 ? "w-6 h-6" : "w-10 h-10"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{imagePreviews.length > 0 ? "Add more" : "Upload images"}</span>
                        {imagePreviews.length === 0 && <span className="text-xs">PNG, JPG up to 5MB</span>}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Pricing</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Price <span className="text-red-400">*</span></label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01"
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" required />
                      </div>
                      <select name="unit" value={formData.unit} onChange={handleChange}
                        className="w-20 px-2 py-2.5 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 bg-white text-sm">
                        {units.map(u => <option key={u.value} value={u.value}>/{u.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Compare at price <span className="text-gray-400">(optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <input type="number" name="compareAtPrice" value={formData.compareAtPrice} onChange={handleChange} placeholder="Original price" min="0" step="0.01"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" />
                    </div>
                    {formData.price && formData.compareAtPrice && parseFloat(formData.compareAtPrice) > parseFloat(formData.price) && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        {Math.round(((parseFloat(formData.compareAtPrice) - parseFloat(formData.price)) / parseFloat(formData.compareAtPrice)) * 100)}% discount
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Inventory</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Min Order</label>
                      <input type="number" name="minOrderQuantity" value={formData.minOrderQuantity} onChange={handleChange} min="1"
                        className="w-full px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Max Order</label>
                      <input type="number" name="maxOrderQuantity" value={formData.maxOrderQuantity} onChange={handleChange} min="1"
                        className="w-full px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900 transition-all" />
                    </div>
                  </div>
                  <label className="flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.inStock ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="text-sm font-medium text-gray-700">{formData.inStock ? "In Stock" : "Out of Stock"}</span>
                    </div>
                    <div className="relative">
                      <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-300 peer-checked:bg-amber-400 rounded-full transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </form>

        {/* Mobile Bottom Bar */}
        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="flex gap-3 ml-0 sm:ml-64">
            <Link href="/admin/products" className="flex-1 py-3 text-center text-gray-600 font-medium border border-gray-300 bg-white rounded-lg">Cancel</Link>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className={`flex-[2] py-3 font-semibold flex items-center justify-center gap-2 rounded-lg ${loading ? "bg-gray-200 text-gray-400" : "bg-amber-400 hover:bg-amber-500 text-gray-900"}`}>
              {loading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>) : "Save Product"}
            </button>
          </div>
        </div>
        <div className="xl:hidden h-20" />

      </div>
    </>
  );
}