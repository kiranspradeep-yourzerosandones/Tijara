"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL     = process.env.NEXT_PUBLIC_API_URL     || "http://localhost:5000/api";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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

// ── Searchable combo box ──────────────────────────────────────
function SearchableSelect({ label, required, placeholder, value, onChange, options, renderOption }) {
  const [query,  setQuery]  = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef        = useRef(null);

  const selectedOption = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
            onChange={(e) => { setQuery(e.target.value); if (!isOpen) setIsOpen(true); }}
            onFocus={() => { setIsOpen(true); setQuery(""); }}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 pr-16 bg-gray-50 border border-gray-200 rounded-xl
                       focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                       focus:bg-white text-gray-900 placeholder:text-gray-400 transition-all text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <button type="button" onClick={() => { onChange(""); setQuery(""); }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button type="button" onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200
                          rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results for "{query}"
              </div>
            ) : filtered.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setQuery(""); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50
                            transition-colors flex items-center justify-between
                            ${value === opt.value ? "bg-amber-50 text-amber-800 font-medium" : "text-gray-700"}`}>
                <span className="truncate">
                  {renderOption ? renderOption(opt) : opt.label}
                </span>
                {value === opt.value && (
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 ml-2" fill="none"
                    stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}

        {required && (
          <input type="text" value={value} required onChange={() => {}}
            className="sr-only" tabIndex={-1} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

// ── Live banner preview ───────────────────────────────────────
function BannerPreview({ form, imagePreview }) {
  const actionLabel = {
    product: "View Product", category: "Browse",
    screen: "Go", url: "Learn More",
  }[form.actionType] || null;

  const isActionable = form.actionType && form.actionType !== "none";

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg relative"
      style={{ aspectRatio: "2.2 / 1", backgroundColor: form.backgroundColor || "#2D5A27" }}>

      {/* Background image */}
      {imagePreview && (
        <img src={imagePreview} alt="Banner preview"
          className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Overlay */}
      {imagePreview && (
        <div className="absolute inset-0 bg-black/35" />
      )}

      {/* Decorative circles (colour banners only) */}
      {!imagePreview && (
        <>
          <div className="absolute rounded-full opacity-10 bg-white"
            style={{ width: 140, height: 140, top: -40, right: -20 }} />
          <div className="absolute rounded-full opacity-8 bg-white"
            style={{ width: 90, height: 90, bottom: -30, right: 50 }} />
        </>
      )}

      {/* Text content */}
      <div className="absolute inset-0 flex items-center px-5 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">
            {form.title || "Banner Title"}
          </p>
          {form.subtitle && (
            <p className="text-white/80 text-xs mt-1 line-clamp-2 leading-relaxed">
              {form.subtitle}
            </p>
          )}
          {isActionable && actionLabel && (
            <div className="mt-2 inline-flex items-center gap-1 bg-amber-400
                            text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full">
              {actionLabel}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </div>

        {/* Icon placeholder — colour banners */}
        {!imagePreview && (
          <div className="w-14 h-14 rounded-full bg-white/15 flex items-center
                          justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function AddBannerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", subtitle: "", backgroundColor: "#2D5A27",
    actionType: "none", actionProductId: "", actionCategory: "",
    actionScreen: "", actionUrl: "", isActive: true,
  });

  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products?limit=200`, { headers: getAuthHeaders() })
      .then((r) => r.json()).then((d) => setProducts(d.data?.products || [])).catch(() => {});
    fetch(`${API_URL}/categories`, { headers: getAuthHeaders() })
      .then((r) => r.json()).then((d) => setCategories(d.categories || d.data?.categories || [])).catch(() => {});
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title",           form.title.trim());
      fd.append("subtitle",        form.subtitle.trim());
      fd.append("backgroundColor", form.backgroundColor);
      fd.append("actionType",      form.actionType);
      fd.append("isActive",        String(form.isActive));
      if (form.actionType === "product")  fd.append("actionProductId", form.actionProductId);
      if (form.actionType === "category") fd.append("actionCategory",  form.actionCategory);
      if (form.actionType === "screen")   fd.append("actionScreen",    form.actionScreen);
      if (form.actionType === "url")      fd.append("actionUrl",       form.actionUrl);
      if (imageFile) fd.append("image", imageFile);

      const { Authorization } = getAuthHeaders();
      const res  = await fetch(`${API_URL}/banners/admin`, { method: "POST", headers: { Authorization }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create banner");
      router.push("/admin/banners");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const productOptions  = products.map((p) => ({ value: p._id,  label: p.title, brand: p.brand, price: p.price }));
  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));
  const screenOptions   = SCREEN_OPTIONS.map((s) => ({ value: s.value, label: s.label }));

  return (
    <ProtectedPage permission="manageProducts">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/banners"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Banner</h1>
            <p className="text-gray-500 text-sm">Create a new home screen banner</p>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200
                          rounded-2xl mb-6">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── Two-column layout ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── LEFT: form fields (3 cols) ───────────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Content */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Content</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Godrej Vegetable Wax"
                    maxLength={100} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                               focus:bg-white text-gray-900 placeholder:text-gray-400
                               transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subtitle
                  </label>
                  <input type="text" value={form.subtitle}
                    onChange={(e) => set("subtitle", e.target.value)}
                    placeholder="Short description shown below title"
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                               focus:bg-white text-gray-900 placeholder:text-gray-400
                               transition-all text-sm" />
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Appearance</h2>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Background Image
                    <span className="text-gray-400 font-normal ml-1">(optional — overrides color)</span>
                  </label>

                  {imagePreview ? (
                    <div className="relative">
                      <div className="w-full rounded-xl border border-gray-200 overflow-hidden
                                      bg-gray-100 flex items-center justify-center"
                        style={{ aspectRatio: "2.2 / 1", backgroundColor: form.backgroundColor }}>
                        <img src={imagePreview} alt="Preview"
                          className="max-w-full max-h-full object-contain" />
                      </div>
                      <button type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white
                                   rounded-full flex items-center justify-center shadow
                                   hover:bg-red-600 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] bg-amber-500
                                       text-white px-2 py-0.5 rounded font-medium">
                        New image
                      </span>
                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/50
                                       text-white px-2 py-0.5 rounded">
                        700 × 320 px recommended
                      </span>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl
                                    flex flex-col items-center justify-center cursor-pointer
                                    hover:border-amber-300 transition-colors"
                      style={{ aspectRatio: "2.2 / 1" }}
                      onClick={() => document.getElementById("add-banner-img")?.click()}>
                      <svg className="w-8 h-8 text-gray-300 mb-1.5" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
                             2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                             00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-medium">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG · 700×320 px</p>
                      <input id="add-banner-img" type="file" accept="image/*"
                        onChange={handleImageChange} className="hidden" />
                    </div>
                  )}
                </div>

                {/* Background colour */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Background Color
                    <span className="text-gray-400 font-normal ml-1">(used when no image)</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button key={color} type="button" onClick={() => set("backgroundColor", color)}
                        title={color}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          form.backgroundColor === color
                            ? "border-gray-900 scale-110 shadow-md"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }} />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: form.backgroundColor }} />
                      <input type="text" value={form.backgroundColor}
                        onChange={(e) => set("backgroundColor", e.target.value)}
                        maxLength={7} placeholder="#2D5A27"
                        className="border text-black border-gray-200 rounded-lg px-2 py-1 text-xs
                                   w-20 font-mono bg-gray-50 focus:ring-2
                                   focus:ring-amber-400/30 focus:border-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tap Action */}
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
                  <select value={form.actionType}
                    onChange={(e) => set("actionType", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                               focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                               focus:bg-white text-gray-900 text-sm appearance-none cursor-pointer">
                    {ACTION_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {form.actionType === "product" && (
                  <SearchableSelect label="Select Product" required
                    placeholder="Type to search products..."
                    value={form.actionProductId}
                    onChange={(v) => set("actionProductId", v)}
                    options={productOptions}
                    renderOption={(opt) => (
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        {opt.brand && <span className="text-gray-400 ml-1.5 text-xs">· {opt.brand}</span>}
                        {opt.price && <span className="text-gray-400 ml-1.5 text-xs">· ₹{opt.price.toLocaleString("en-IN")}</span>}
                      </div>
                    )} />
                )}

                {form.actionType === "category" && (
                  categories.length > 0 ? (
                    <SearchableSelect label="Category" required
                      placeholder="Type to search categories..."
                      value={form.actionCategory}
                      onChange={(v) => set("actionCategory", v)}
                      options={categoryOptions} />
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={form.actionCategory}
                        onChange={(e) => set("actionCategory", e.target.value)}
                        placeholder="e.g. Wax Products" required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                                   focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                                   focus:bg-white text-gray-900 placeholder:text-gray-400
                                   transition-all text-sm" />
                    </div>
                  )
                )}

                {form.actionType === "screen" && (
                  <SearchableSelect label="Screen" required
                    placeholder="Type to search screens..."
                    value={form.actionScreen}
                    onChange={(v) => set("actionScreen", v)}
                    options={screenOptions} />
                )}

                {form.actionType === "url" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input type="url" value={form.actionUrl}
                      onChange={(e) => set("actionUrl", e.target.value)}
                      placeholder="https://example.com" required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                                 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                                 focus:bg-white text-gray-900 placeholder:text-gray-400
                                 transition-all text-sm" />
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Publish immediately</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Inactive banners are saved but not shown on mobile
                    </p>
                  </div>
                  <button type="button" onClick={() => set("isActive", !form.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                                transition-colors focus:outline-none ${
                      form.isActive ? "bg-amber-500" : "bg-gray-300"
                    }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white
                                      shadow transition-transform ${
                      form.isActive ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Link href="/admin/banners"
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm
                             text-gray-700 hover:bg-gray-50 transition-colors font-medium
                             text-center">
                  Cancel
                </Link>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl
                             py-2.5 text-sm font-semibold transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : "Create Banner"}
                </button>
              </div>
            </div>

            {/* ── RIGHT: sticky live preview (2 cols) ─────────── */}
            <div className="lg:col-span-2">
              <div className="sticky top-6 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-900 text-sm">Live Preview</h2>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Mobile view
                    </span>
                  </div>

                  {/* Phone mockup frame */}
                  <div className="bg-gray-100 rounded-2xl p-3">
                    <BannerPreview form={form} imagePreview={imagePreview} />
                  </div>

                  {/* Preview meta */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Action</span>
                      <span className="font-medium text-gray-800">
                        {ACTION_TYPE_OPTIONS.find((o) => o.value === form.actionType)?.label || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-semibold ${form.isActive ? "text-green-600" : "text-gray-400"}`}>
                        {form.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {!imagePreview && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Color</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                            style={{ backgroundColor: form.backgroundColor }} />
                          <span className="font-mono text-gray-700">{form.backgroundColor}</span>
                        </div>
                      </div>
                    )}
                    {imagePreview && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Image</span>
                        <span className="font-medium text-amber-600">Uploaded ✓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-800">Tips</p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Recommended image size: 700 × 320 px</li>
                    <li>Images override the background colour</li>
                    <li>Keep titles short — under 40 characters</li>
                    <li>Maximum 4 banners allowed at once</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ProtectedPage>
  );
}