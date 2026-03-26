// src/utils/htmlHelper.js

/**
 * Strip HTML tags from string
 */
export const stripHtml = (html) => {
  if (!html) return '';
  
  return html
    // Replace <br>, <br/>, <br /> with newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Replace </p>, </li>, </div> with newline
    .replace(/<\/(p|li|div|h[1-6])>/gi, '\n')
    // Replace <li> with bullet point
    .replace(/<li[^>]*>/gi, '• ')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
};

/**
 * Check if string contains HTML
 */
export const isHtml = (text) => {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
};

/**
 * Get plain text preview (for cards, lists)
 */
export const getTextPreview = (html, maxLength = 100) => {
  const plain = stripHtml(html);
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).trim() + '...';
};

/**
 * Parse HTML list items into array
 */
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
      .trim();
    
    if (text) {
      items.push(text);
    }
  }
  
  return items;
};