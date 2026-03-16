// frontend/lib/imageHelper.js

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SERVER_BASE = API_BASE.replace('/api', '');

/**
 * Converts a database image path to a full URL
 * @param {string} imagePath - Path from database (e.g., "/uploads/image.jpg")
 * @returns {string|null} Full URL or null
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads/, construct full URL
  if (imagePath.startsWith('/uploads/')) {
    return `${SERVER_BASE}${imagePath}`;
  }
  
  // If it doesn't start with /, add /uploads/
  if (!imagePath.startsWith('/')) {
    return `${SERVER_BASE}/uploads/${imagePath}`;
  }
  
  return `${SERVER_BASE}${imagePath}`;
}

/**
 * Placeholder SVG component
 */
export const ImagePlaceholder = ({ className = "w-full h-full" }) => (
  <svg className={`${className} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
);