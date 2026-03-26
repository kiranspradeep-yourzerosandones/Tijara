// src/utils/helpers.js
import env from '../config/env';

// ============================================================
// CURRENCY & NUMBERS
// ============================================================

// Format currency
export const formatCurrency = (amount, currency = '₹') => {
  if (amount === undefined || amount === null) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// Calculate discount percentage
export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// ============================================================
// DATE & TIME
// ============================================================

// Format date
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (format === 'time') {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (format === 'datetime') {
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-IN');
};

// Format date with time
export const formatDateTime = (date) => {
  return formatDate(date, 'datetime');
};

// Get relative time
export const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, 'short');
};

// ============================================================
// TEXT & STRING
// ============================================================

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate initials
export const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Format address
export const formatAddress = (address) => {
  if (!address) return '';
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  return parts.join(', ');
};

// ============================================================
// HTML HELPERS
// ============================================================

// Strip HTML tags from string
export const stripHtml = (html) => {
  if (!html) return '';

  return html
    // Replace <br>, <br/>, <br /> with newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Replace closing block tags with newline
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    // Replace <li> with bullet point
    .replace(/<li[^>]*>/gi, '• ')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Remove extra whitespace and blank lines
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
};

// Check if string contains HTML tags
export const isHtml = (text) => {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
};

// Get plain text preview from HTML (for cards/lists)
export const getTextPreview = (html, maxLength = 100) => {
  const plain = stripHtml(html);
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).trim() + '...';
};

// Parse HTML <li> items into array of strings
export const parseHtmlList = (html) => {
  if (!html) return [];

  const items = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .trim();

    if (text) {
      items.push(text);
    }
  }

  return items;
};

// Clean text - strip HTML if present, otherwise return as-is
export const cleanText = (text) => {
  if (!text) return '';
  return isHtml(text) ? stripHtml(text) : text;
};

// ============================================================
// IMAGE
// ============================================================

// Get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${env.IMAGE_BASE_URL}${path}`;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Debounce function
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Sleep function (await sleep(1000))
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Check if object/array is empty
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};