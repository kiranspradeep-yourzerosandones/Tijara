"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL     = process.env.NEXT_PUBLIC_API_URL     || "http://localhost:5000/api";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const ACTION_LABELS = {
  none:     "No action",
  product:  "Go to product",
  category: "Browse category",
  screen:   "Open screen",
  url:      "Open URL",
};

const imgSrc = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};

export default function BannersPage() {
  const router = useRouter();

  const [banners,  setBanners]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [moving,   setMoving]   = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/banners/admin`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load banners");
      setBanners(data.banners || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (banner) => {
    setToggling(banner._id);
    try {
      const res = await fetch(`${API_URL}/banners/admin/${banner._id}/toggle`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle");
      setBanners((prev) =>
        prev.map((b) => b._id === banner._id ? { ...b, isActive: data.isActive } : b)
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (banner) => {
    if (!confirm(`Delete banner "${banner.title}"? This cannot be undone.`)) return;
    setDeleting(banner._id);
    try {
      const res = await fetch(`${API_URL}/banners/admin/${banner._id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleMove = async (index, direction) => {
    const newBanners  = [...banners];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [
      newBanners[targetIndex],
      newBanners[index],
    ];

    setBanners(newBanners);
    setMoving(newBanners[targetIndex]._id);

    try {
      const res = await fetch(`${API_URL}/banners/admin/reorder`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newBanners.map((b) => b._id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reorder failed");
    } catch (e) {
      alert("Reorder failed: " + e.message);
      load();
    } finally {
      setMoving(null);
    }
  };

  return (
    <ProtectedPage permission="manageProducts">
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
            <p className="text-gray-500">
              Manage home screen banners · {banners.length} / 4 used
            </p>
          </div>
          {banners.length < 4 ? (
            <Link
              href="/admin/banners/add"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600
                         transition-colors flex items-center gap-2 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Add Banner
            </Link>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200
                             px-3 py-2 rounded-lg font-medium">
              Maximum 4 banners reached
            </span>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">Failed to load banners</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
            <button
              onClick={load}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold
                         rounded-lg hover:bg-red-600 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-400
                              border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 font-medium">Loading banners...</p>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────── */}
        {!loading && !error && banners.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center
                            justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-amber-400" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0
                     01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1
                     1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1
                     1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">No Banners Yet</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              Add up to 4 banners to display on the mobile home screen
            </p>
            <Link
              href="/admin/banners/add"
              className="inline-flex mt-6 px-6 py-2.5 bg-amber-500 text-white rounded-lg
                         hover:bg-amber-600 transition-colors font-medium"
            >
              Create First Banner
            </Link>
          </div>
        )}

        {/* ── Banner List ─────────────────────────────────────── */}
        {!loading && banners.length > 0 && (
          <div className="space-y-3">
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className={`bg-white rounded-2xl border border-gray-100 overflow-hidden
                            flex transition-opacity shadow-sm ${
                  !banner.isActive ? "opacity-60" : ""
                }`}
              >
                {/* ── Preview thumbnail ─────────────────────────
                    Fixed width, full height of the card.
                    Inner div uses padding-bottom trick for 2.2:1 ratio
                    so the thumbnail always looks like a mini banner.
                ──────────────────────────────────────────────── */}
                <div className="w-52 flex-shrink-0 self-stretch relative overflow-hidden">
                  {/* Aspect-ratio box that fills the sidebar width */}
                  <div className="absolute inset-0">
                    {/* Colour background */}
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: banner.backgroundColor || "#2D5A27" }}
                    />

                    {/* Decorative circles — same as mobile */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: 120, height: 120,
                        top: -30, right: -20,
                        backgroundColor: "rgba(255,255,255,0.1)",
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: 80, height: 80,
                        bottom: -20, right: 40,
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    />

                    {/* Image — covers the entire thumbnail */}
                    {banner.image && (
                      <img
                        src={imgSrc(banner.image)}
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Inactive overlay */}
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center
                                      justify-center">
                        <span className="text-white text-[10px] font-bold bg-black/60
                                         px-2 py-0.5 rounded tracking-wide">
                          INACTIVE
                        </span>
                      </div>
                    )}

                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0
                                    bg-gradient-to-t from-black/70 to-transparent
                                    px-3 py-2">
                      <p className="text-white text-[10px] font-semibold truncate leading-tight">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <p className="text-white/70 text-[9px] truncate mt-0.5">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Position badge */}
                    <span className="absolute top-2 left-2 w-5 h-5 rounded-full
                                     bg-black/50 text-white text-[10px] font-bold
                                     flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Image indicator */}
                    {banner.image && (
                      <span className="absolute top-2 right-2 text-[9px] bg-black/50
                                       text-white px-1.5 py-0.5 rounded font-medium">
                        IMG
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Info + controls ───────────────────────────── */}
                <div className="flex-1 px-5 py-4 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {banner.subtitle}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Action badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5
                                         text-xs font-medium bg-blue-50 text-blue-700
                                         border border-blue-100 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {ACTION_LABELS[banner.actionType] || "No action"}
                          {banner.actionType === "category" && banner.actionCategory &&
                            `: ${banner.actionCategory}`}
                          {banner.actionType === "screen" && banner.actionScreen &&
                            `: ${banner.actionScreen}`}
                          {banner.actionType === "product" &&
                            banner.actionProductId?.title &&
                            `: ${banner.actionProductId.title}`}
                        </span>

                        {/* Colour chip (only when no image) */}
                        {!banner.image && (
                          <span className="inline-flex items-center gap-1.5 text-xs
                                           text-gray-500">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300
                                         inline-block flex-shrink-0"
                              style={{ backgroundColor: banner.backgroundColor }}
                            />
                            {banner.backgroundColor}
                          </span>
                        )}

                        {/* Active pill */}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          banner.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* ── Controls ─────────────────────────────── */}
                    <div className="flex items-center gap-2 flex-shrink-0">

                      {/* Up / Down */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0 || !!moving}
                          className="p-1.5 text-gray-400 hover:text-gray-700
                                     hover:bg-gray-100 rounded-lg transition-colors
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-3.5 h-3.5" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === banners.length - 1 || !!moving}
                          className="p-1.5 text-gray-400 hover:text-gray-700
                                     hover:bg-gray-100 rounded-lg transition-colors
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-3.5 h-3.5" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(banner)}
                        disabled={toggling === banner._id}
                        title={banner.isActive ? "Deactivate" : "Activate"}
                        className={`relative inline-flex h-6 w-11 items-center
                                    rounded-full transition-colors focus:outline-none
                                    disabled:opacity-50 ${
                          banner.isActive ? "bg-amber-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full
                                      bg-white shadow transition-transform ${
                            banner.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/admin/banners/edit/${banner._id}`}
                        className="px-3 py-1.5 text-sm font-medium bg-amber-100
                                   text-amber-700 rounded-lg hover:bg-amber-200
                                   transition-colors"
                      >
                        Edit
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(banner)}
                        disabled={deleting === banner._id}
                        className="px-3 py-1.5 text-sm font-medium bg-red-50
                                   text-red-600 rounded-lg hover:bg-red-100
                                   transition-colors disabled:opacity-50"
                      >
                        {deleting === banner._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Footer hint */}
            <p className="text-xs text-gray-400 text-center py-2">
              Use ▲ ▼ to reorder · Toggle to show/hide on mobile ·
              Only active banners appear on the home screen
            </p>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}