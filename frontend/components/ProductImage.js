// frontend/components/ProductImage.js
"use client";

import { useState } from "react";
import { getImageUrl, ImagePlaceholder } from "@/lib/imageHelper";

export default function ProductImage({ src, alt, className = "", onError }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(src);

  const handleError = (e) => {
    console.error('Image failed to load:', imageUrl);
    setFailed(true);
    if (onError) onError(e);
  };

  if (!imageUrl || failed) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <ImagePlaceholder className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || "Product"}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}