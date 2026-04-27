// frontend/app/admin/settings/images/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { imageAPI } from "@/lib/api";
import { getImageUrl } from "@/lib/imageHelper";

export default function ImageManagement() {
  const [stats, setStats] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [filter, setFilter] = useState("all"); // all, orphaned, used
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, imagesRes] = await Promise.all([
        imageAPI.getStats(),
        imageAPI.getAll()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (imagesRes.success) setImages(imagesRes.data.images || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAll = async () => {
    if (!confirm("Are you sure you want to delete ALL orphaned images? This cannot be undone.")) {
      return;
    }

    setCleaning(true);
    setError("");
    setSuccess("");

    try {
      const res = await imageAPI.cleanupAll();
      if (res.success) {
        setSuccess(`Successfully deleted ${res.data.deleted} orphaned images. Freed ${res.data.freedSpaceFormatted}`);
        fetchData();
        setSelectedImages([]);
      } else {
        setError(res.message || "Cleanup failed");
      }
    } catch (err) {
      setError(err.message || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) {
      setError("No images selected");
      return;
    }

    if (!confirm(`Delete ${selectedImages.length} selected image(s)?`)) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const res = await imageAPI.deleteSelected(selectedImages);
      if (res.success) {
        setSuccess(`Deleted ${res.data.deleted} images. Freed ${res.data.freedSpaceFormatted}`);
        fetchData();
        setSelectedImages([]);
      } else {
        setError(res.message || "Delete failed");
      }
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectImage = (filename) => {
    setSelectedImages(prev =>
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  const selectAllOrphaned = () => {
    const orphanedFilenames = images.filter(img => !img.isUsed).map(img => img.filename);
    setSelectedImages(orphanedFilenames);
  };

  const clearSelection = () => {
    setSelectedImages([]);
  };

  const filteredImages = images.filter(img => {
    if (filter === "orphaned") return !img.isUsed;
    if (filter === "used") return img.isUsed;
    return true;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPage permission="manageProducts">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getImageUrl(previewImage)}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain bg-white rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="w-full min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 -mx-6 px-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/settings"
                className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Image Storage</h1>
                <p className="text-sm text-gray-400">Manage uploaded images & cleanup unused files</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className="mt-6 max-w-[1600px] mx-auto">
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200/60 text-emerald-800 flex items-center gap-3 text-sm rounded-2xl">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium flex-1">{success}</span>
                <button onClick={() => setSuccess("")} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200/60 text-red-800 flex items-center gap-3 text-sm rounded-2xl">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium flex-1">{error}</span>
                <button onClick={() => setError("")} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pb-6 max-w-[1600px] mx-auto space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalImages}</p>
                    <p className="text-sm text-gray-500">Total Images</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.totalSizeFormatted}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.usedImages}</p>
                    <p className="text-sm text-gray-500">In Use</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.usedSizeFormatted}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.orphanedImages}</p>
                    <p className="text-sm text-gray-500">Orphaned</p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">{stats.orphanedSizeFormatted} can be freed</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-red-100">Quick Cleanup</p>
                    <p className="text-xs text-red-200 mt-0.5">Delete all orphaned images</p>
                  </div>
                  <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <button
                  onClick={handleCleanupAll}
                  disabled={cleaning || stats.orphanedImages === 0}
                  className="w-full py-2.5 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed 
                             text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {cleaning ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Cleanup All ({stats.orphanedImages})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Filters & Actions */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { key: "all", label: "All", count: images.length },
                  { key: "orphaned", label: "Orphaned", count: images.filter(i => !i.isUsed).length },
                  { key: "used", label: "In Use", count: images.filter(i => i.isUsed).length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filter === tab.key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-md ${
                      filter === tab.key ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-500"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selection Actions */}
              <div className="flex items-center gap-2">
                {selectedImages.length > 0 && (
                  <>
                    <span className="text-sm text-gray-500">
                      {selectedImages.length} selected
                    </span>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl 
                                 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Selected
                        </>
                      )}
                    </button>
                  </>
                )}
                {filter === "orphaned" && images.filter(i => !i.isUsed).length > 0 && selectedImages.length === 0 && (
                  <button
                    onClick={selectAllOrphaned}
                    className="px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium rounded-xl transition-colors"
                  >
                    Select All Orphaned
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Images Grid */}
          {filteredImages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Images Found</h3>
              <p className="text-gray-500 mt-2">
                {filter === "orphaned" ? "No orphaned images. Your storage is clean!" : "No images match this filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.filename}
                  className={`group relative bg-white rounded-xl border overflow-hidden transition-all ${
                    selectedImages.includes(image.filename)
                      ? "border-amber-400 ring-2 ring-amber-400/30"
                      : image.isUsed
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-amber-200 hover:border-amber-300"
                  }`}
                >
                  {/* Image */}
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer relative overflow-hidden"
                    onClick={() => setPreviewImage(image.path)}
                  >
                    <img
                      src={getImageUrl(image.path)}
                      alt={image.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ccc'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                      }}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        image.isUsed
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {image.isUsed ? "IN USE" : "ORPHANED"}
                      </span>
                    </div>

                    {/* Select Checkbox (only for orphaned) */}
                    {!image.isUsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectImage(image.filename);
                        }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedImages.includes(image.filename)
                            ? "bg-amber-500 border-amber-500"
                            : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {selectedImages.includes(image.filename) && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-600 font-medium truncate" title={image.filename}>
                      {image.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{image.sizeFormatted}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(image.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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