"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL     = process.env.NEXT_PUBLIC_API_URL     || "http://localhost:5000/api";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const imgSrc = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};

const SCREEN_OPTIONS = [
  { value: "ProductList",   label: "Product List" },
  { value: "Cart",          label: "Cart" },
  { value: "Notifications", label: "Notifications" },
  { value: "Categories",    label: "Categories" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "none",     label: "No action (decorative)" },
  { value: "product",  label: "Navigate to a product" },
  { value: "category", label: "Browse a category" },
  { value: "screen",   label: "Open a screen" },
  { value: "url",      label: "Open external URL" },
];

const PRESET_COLORS = [
  "#2D5A27", "#1a4a6e", "#8B4513", "#4a1a6e",
  "#0D9488", "#B45309", "#991B1B", "#1D4ED8",
];

// ── Searchable Combo Box ────────────────────────────────────────
function SearchableSelect({ label, required, placeholder, value, onChange, options, renderOption }) {
  const [query, setQuery]       = useState("");
  const [isOpen, setIsOpen]     = useState(false);
  const containerRef            = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={isOpen ? query : (selectedOption?.label || "")}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setQuery("");
            }}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            className="w-full px-4 py-2.5 pr-16 bg-gray-50 border border-gray-200 rounded-xl
                       focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                       focus:bg-white text-gray-900 placeholder:text-gray-400
                       transition-all text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200
                          rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found for "{query}"
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50
                              transition-colors flex items-center justify-between
                              ${value === opt.value
                                ? "bg-amber-50 text-amber-800 font-medium"
                                : "text-gray-700"
                              }`}
                >
                  <span className="truncate">
                    {renderOption ? renderOption(opt) : opt.label}
                  </span>
                  {value === opt.value && (
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0 ml-2" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {required && (
          <input
            type="text"
            value={value}
            required
            onChange={() => {}}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function EditBannerPage() {
  const router    = useRouter();
  const { id }    = useParams();

  const [form, setForm]                 = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage]   = useState(false);
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`${API_URL}/banners/admin/${id}`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/products?limit=200`,  { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${API_URL}/categories`,          { headers: getAuthHeaders() }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([bannerData, productsData, categoriesData]) => {
        if (!bannerData.success) throw new Error(bannerData.message || "Banner not found");
        const b = bannerData.banner;
        setForm({
          title:           b.title,
          subtitle:        b.subtitle || "",
          backgroundColor: b.backgroundColor || "#2D5A27",
          existingImage:   b.image || null,
          actionType:      b.actionType || "none",
          actionProductId: b.actionProductId?._id || b.actionProductId || "",
          actionCategory:  b.actionCategory || "",
          actionScreen:    b.actionScreen || "",
          actionUrl:       b.actionUrl || "",
          isActive:        b.isActive,
        });
        setProducts(productsData.data?.products || []);
        setCategories(categoriesData.categories || categoriesData.data?.categories || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveExisting = () => {
    setRemoveImage(true);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("title",           form.title.trim());
      fd.append("subtitle",        form.subtitle.trim());
      fd.append("backgroundColor", form.backgroundColor);
      fd.append("actionType",      form.actionType);
      fd.append("isActive",        String(form.isActive));
      fd.append("removeImage",     removeImage ? "true" : "false");

      if (form.actionType === "product")
        fd.append("actionProductId", form.actionProductId);
      if (form.actionType === "category")
        fd.append("actionCategory", form.actionCategory);
      if (form.actionType === "screen")
        fd.append("actionScreen", form.actionScreen);
      if (form.actionType === "url")
        fd.append("actionUrl", form.actionUrl);
      if (imageFile)
        fd.append("image", imageFile);

      const { Authorization } = getAuthHeaders();
      const res = await fetch(`${API_URL}/banners/admin/${id}`, {
        method: "PUT",
        headers: { Authorization },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update banner");

      router.push("/admin/banners");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Build options
  const productOptions = products.map((p) => ({
    value: p._id,
    label: p.title,
    brand: p.brand,
    price: p.price,
  }));

  const categoryOptions = categories.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const screenOptions = SCREEN_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <ProtectedPage permission="manageProducts">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-400
                              border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-900 font-medium">Loading banner...</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  // ── Not found ────────────────────────────────────────────────
  if (error && !form) {
    return (
      <ProtectedPage permission="manageProducts">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Banner Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/admin/banners"
            className="text-amber-600 hover:text-amber-700 font-medium">
            ← Back to Banners
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  const showingExistingImage = form.existingImage && !removeImage && !imagePreview;
  const showingNewPreview    = !!imagePreview;
  const showingNoImage       = !showingExistingImage && !showingNewPreview;

  return (
    <ProtectedPage permission="manageProducts">
      <div className="space-y-6 max-w-2xl">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/banners"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
            <p className="text-gray-500 truncate max-w-xs">{form?.title}</p>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200
                          rounded-2xl">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Content ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Content</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={100}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                           focus:bg-white text-gray-900 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Subtitle
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                maxLength={200}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                           focus:bg-white text-gray-900 placeholder:text-gray-400
                           transition-all text-sm"
              />
            </div>
          </div>

          {/* ── Appearance ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Appearance</h2>

            {/* Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Background Image
              </label>

              {/* Existing image — horizontal banner ratio */}
              {showingExistingImage && (
                <div className="relative mb-3">
                  <div
                    className="w-full rounded-xl border border-gray-200 overflow-hidden
                                flex items-center justify-center"
                    style={{
                      aspectRatio: "2.2 / 1",
                      backgroundColor: form.backgroundColor,
                    }}
                  >
                    <img
                      src={imgSrc(form.existingImage)}
                      alt="Current banner"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveExisting}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white
                               rounded-full flex items-center justify-center shadow-sm
                               hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="absolute bottom-2 left-2 text-xs bg-black/50
                                   text-white px-2 py-0.5 rounded-lg">
                    Current image
                  </span>
                </div>
              )}

              {/* New preview — horizontal banner ratio */}
              {showingNewPreview && (
                <div className="relative mb-3">
                  <div
                    className="w-full rounded-xl border-2 border-amber-400 overflow-hidden
                                flex items-center justify-center"
                    style={{
                      aspectRatio: "2.2 / 1",
                      backgroundColor: form.backgroundColor,
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="New preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white
                               rounded-full flex items-center justify-center shadow-sm
                               hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="absolute bottom-2 left-2 text-xs bg-amber-500
                                   text-white px-2 py-0.5 rounded-lg font-medium">
                    New image
                  </span>
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/50
                                   text-white px-2 py-0.5 rounded-lg">
                    Recommended: 700×320 px
                  </span>
                </div>
              )}

              {/* Removed state */}
              {removeImage && !imagePreview && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl
                                text-sm text-red-700 flex items-center justify-between">
                  <span>Image will be removed on save.</span>
                  <button
                    type="button"
                    onClick={() => setRemoveImage(false)}
                    className="text-xs font-semibold underline ml-2"
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Upload area — horizontal ratio */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl
                            flex flex-col items-center justify-center
                            hover:border-amber-300 transition-colors cursor-pointer"
                style={{ aspectRatio: showingNoImage ? "2.2 / 1" : "auto", padding: showingNoImage ? undefined : "1rem 0" }}
                onClick={() => document.getElementById("edit-banner-image-input")?.click()}
              >
                {showingNoImage && (
                  <>
                    <svg className="w-10 h-10 text-gray-300 mb-2" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
                           2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                           00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">
                      Click to upload banner image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended: 700 × 320 px · PNG, JPG up to 5MB
                    </p>
                  </>
                )}
                {!showingNoImage && (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5
                                   bg-amber-50 text-amber-700 border border-amber-200
                                   rounded-lg text-sm font-medium hover:bg-amber-100
                                   transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {showingExistingImage ? "Replace Image" : "Upload Image"}
                  </span>
                )}
                <input
                  id="edit-banner-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Background colour */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Background Color{" "}
                <span className="text-gray-400 font-normal">(used when no image)</span>
              </label>

              <div
                className="w-full rounded-xl mb-3 border border-gray-200
                            flex items-center justify-center"
                style={{
                  aspectRatio: "5 / 1",
                  backgroundColor: form.backgroundColor,
                }}
              >
                <span className="text-white text-xs font-semibold drop-shadow">
                  Color Preview
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => set("backgroundColor", color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      form.backgroundColor === color
                        ? "border-gray-900 scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <div className="flex items-center gap-2 ml-1">
                  <div
                    className="w-7 h-7 rounded-full border border-gray-300"
                    style={{ backgroundColor: form.backgroundColor }}
                  />
                  <input
                    type="text"
                    value={form.backgroundColor}
                    onChange={(e) => set("backgroundColor", e.target.value)}
                    placeholder="#2D5A27"
                    maxLength={7}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs
                               w-24 font-mono focus:ring-2 focus:ring-amber-400/30
                               focus:border-amber-400 bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Tap Action ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Tap Action</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                What happens when a user taps this banner?
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Action Type
              </label>
              <select
                value={form.actionType}
                onChange={(e) => set("actionType", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                           focus:bg-white text-gray-900 transition-all text-sm
                           appearance-none cursor-pointer"
              >
                {ACTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product — searchable */}
            {form.actionType === "product" && (
              <SearchableSelect
                label="Select Product"
                required
                placeholder="Type to search products..."
                value={form.actionProductId}
                onChange={(val) => set("actionProductId", val)}
                options={productOptions}
                renderOption={(opt) => (
                  <div>
                    <span className="font-medium">{opt.label}</span>
                    {opt.brand && (
                      <span className="text-gray-400 ml-1.5 text-xs">
                        · {opt.brand}
                      </span>
                    )}
                    {opt.price && (
                      <span className="text-gray-400 ml-1.5 text-xs">
                        · ₹{opt.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                )}
              />
            )}

            {/* Category — searchable */}
            {form.actionType === "category" && (
              categories.length > 0 ? (
                <SearchableSelect
                  label="Category"
                  required
                  placeholder="Type to search categories..."
                  value={form.actionCategory}
                  onChange={(val) => set("actionCategory", val)}
                  options={categoryOptions}
                />
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.actionCategory}
                    onChange={(e) => set("actionCategory", e.target.value)}
                    placeholder="e.g. Wax Products"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                               focus:bg-white text-gray-900 placeholder:text-gray-400
                               transition-all text-sm"
                  />
                </div>
              )
            )}

            {/* Screen — searchable */}
            {form.actionType === "screen" && (
              <SearchableSelect
                label="Screen"
                required
                placeholder="Type to search screens..."
                value={form.actionScreen}
                onChange={(val) => set("actionScreen", val)}
                options={screenOptions}
              />
            )}

            {/* URL */}
            {form.actionType === "url" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.actionUrl}
                  onChange={(e) => set("actionUrl", e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                             focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                             focus:bg-white text-gray-900 placeholder:text-gray-400
                             transition-all text-sm"
                />
              </div>
            )}
          </div>

          {/* ── Visibility ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Active</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Inactive banners are saved but not shown on mobile
                </p>
              </div>
              <button
                type="button"
                onClick={() => set("isActive", !form.isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full
                            transition-colors focus:outline-none ${
                  form.isActive ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white
                              shadow transition-transform ${
                    form.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Submit ─────────────────────────────────────────── */}
          <div className="flex gap-3">
            <Link
              href="/admin/banners"
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm
                         text-gray-700 hover:bg-gray-50 transition-colors font-medium
                         text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl
                         py-2.5 text-sm font-semibold transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedPage>
  );
}