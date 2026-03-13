"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddProduct() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    brand: "",
    applications: "",
    storage: ""
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
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [categorySearch, categories]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(data.categories || data || []);
      setFilteredCategories(data.categories || data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategorySelect = (categoryName) => {
    setFormData({ ...formData, category: categoryName });
    setCategorySearch(categoryName);
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (e) => {
    setCategorySearch(e.target.value);
    setFormData({ ...formData, category: e.target.value });
    setShowCategoryDropdown(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Product title is required");
      setLoading(false);
      return;
    }

    if (!formData.category.trim()) {
      setError("Category is required");
      setLoading(false);
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

      images.forEach(image => {
        data.append("images", image);
      });

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: data
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Product added successfully!");
        
        setFormData({
          title: "",
          shortDescription: "",
          description: "",
          category: "",
          brand: "",
          applications: "",
          storage: ""
        });
        setCategorySearch("");
        setImages([]);
        setImagePreviews([]);

        setTimeout(() => {
          router.push("/admin/products");
        }, 1500);

      } else {
        setError(result.message || "Failed to add product");
      }

    } catch (err) {
      console.error("Error:", err);
      setError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-black">Add New Product</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new product</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title & Brand Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Melamine Powder"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
                required
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Tijara"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
              />
            </div>
          </div>

          {/* Category - Searchable Dropdown */}
          <div ref={categoryRef} className="relative">
            <label className="block text-sm font-semibold text-black mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={categorySearch}
                onChange={handleCategoryInputChange}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="Search or select category..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Dropdown */}
            {showCategoryDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCategories.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No categories found</p>
                    <p className="text-sm mt-1">Type to use as new category</p>
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.name)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#ffe494]/20 transition-colors flex items-center gap-3 ${
                        formData.category === cat.name ? "bg-[#ffe494]/30" : ""
                      }`}
                    >
                      <div className="w-8 h-8 bg-[#ffe494] rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <span className="text-black font-medium">{cat.name}</span>
                      {formData.category === cat.name && (
                        <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Category Badge */}
            {formData.category && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <span className="px-3 py-1 bg-[#ffe494] text-black rounded-full text-sm font-medium flex items-center gap-2">
                  {formData.category}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: "" });
                      setCategorySearch("");
                    }}
                    className="hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Short Description
              <span className="text-gray-400 font-normal ml-2">(Shown on product cards - Max 200 chars)</span>
            </label>
            <textarea
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief description for product listing..."
              rows="2"
              maxLength={200}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
            />
            <p className="text-sm text-gray-400 mt-1">
              {formData.shortDescription.length}/200 characters
            </p>
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Full Description
              <span className="text-gray-400 font-normal ml-2">(Shown on product detail page)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Complete product description, features, specifications..."
              rows="6"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
            />
          </div>

          {/* Applications */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Applications
            </label>
            <textarea
              name="applications"
              value={formData.applications}
              onChange={handleChange}
              placeholder="Adhesives, Laminates, Coatings, Textiles..."
              rows="2"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
            />
            <p className="text-sm text-gray-400 mt-1">Separate multiple applications with commas</p>
          </div>

          {/* Storage */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Storage Instructions
            </label>
            <input
              type="text"
              name="storage"
              value={formData.storage}
              onChange={handleChange}
              placeholder="e.g., Store in cool, dry place"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ffe494] focus:border-[#ffe494] text-black"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Product Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#ffe494] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Click to upload images</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB each</p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-xl text-black font-bold text-lg transition-all ${
                loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#ffe494] hover:bg-[#f5d97a]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Product"
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-8 py-4 border-2 border-gray-200 rounded-xl text-black font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}