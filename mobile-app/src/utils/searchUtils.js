// src/utils/searchUtils.js

/**
 * Search Utilities
 * Reusable search functions for the entire app
 */

/**
 * Calculate relevance score between search query and text
 * Higher score = better match
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @returns {number} - Relevance score (0-100)
 */
export const calculateRelevanceScore = (text, query) => {
  if (!text || !query) return 0;
  
  const textLower = text.toLowerCase().trim();
  const queryLower = query.toLowerCase().trim();
  
  // Exact match - highest priority
  if (textLower === queryLower) return 100;
  
  // Starts with query - high priority
  if (textLower.startsWith(queryLower)) return 80;
  
  // Contains query as whole word
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(queryLower)}\\b`, 'i');
  if (wordBoundaryRegex.test(textLower)) return 60;
  
  // Contains query anywhere
  if (textLower.includes(queryLower)) return 40;
  
  // Check if all characters of query appear in order (fuzzy match)
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  if (queryIndex === queryLower.length) return 20;
  
  return 0;
};

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
export const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Search and sort products by relevance (local search)
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} - Sorted products with relevance scores
 */
export const searchProductsLocally = (products, query, options = {}) => {
  const {
    titleWeight = 3,
    categoryWeight = 2,
    descriptionWeight = 1,
    skuBonus = 50,
    minScore = 0,
  } = options;

  if (!query || query.trim() === '') {
    return products;
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  const scoredProducts = products.map(product => {
    let totalScore = 0;
    
    // Calculate score for each search term
    searchTerms.forEach(term => {
      // Title has highest weight
      const titleScore = calculateRelevanceScore(product.title, term) * titleWeight;
      
      // Category has medium weight
      const categoryScore = calculateRelevanceScore(product.category, term) * categoryWeight;
      
      // Description has lower weight
      const descScore = calculateRelevanceScore(product.description, term) * descriptionWeight;
      
      // SKU exact match bonus
      const skuScore = product.sku?.toLowerCase().includes(term) ? skuBonus : 0;
      
      totalScore += titleScore + categoryScore + descScore + skuScore;
    });
    
    return {
      ...product,
      relevanceScore: totalScore,
    };
  });
  
  // Filter products with any match and sort by relevance
  return scoredProducts
    .filter(product => product.relevanceScore > minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

/**
 * Highlight matching text in search results
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {Array} - Array of {text, highlight} objects
 */
export const highlightMatches = (text, query) => {
  if (!text || !query) return [{ text, highlight: false }];
  
  const parts = [];
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  let lastIndex = 0;
  let index = textLower.indexOf(queryLower);
  
  while (index !== -1) {
    // Add non-highlighted part
    if (index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, index),
        highlight: false,
      });
    }
    
    // Add highlighted part
    parts.push({
      text: text.substring(index, index + queryLower.length),
      highlight: true,
    });
    
    lastIndex = index + queryLower.length;
    index = textLower.indexOf(queryLower, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      highlight: false,
    });
  }
  
  return parts.length > 0 ? parts : [{ text, highlight: false }];
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Generate search suggestions from products
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @param {number} limit - Max suggestions
 * @returns {Array} - Suggestions array
 */
export const generateSuggestions = (products, query, limit = 5) => {
  if (!query || query.trim().length < 2) return [];
  
  const queryLower = query.toLowerCase().trim();
  const suggestions = new Set();
  
  products.forEach(product => {
    // Add matching product titles
    if (product.title?.toLowerCase().includes(queryLower)) {
      suggestions.add(product.title);
    }
    
    // Add matching categories
    if (product.category?.toLowerCase().includes(queryLower)) {
      suggestions.add(product.category);
    }
  });
  
  return Array.from(suggestions).slice(0, limit);
};

/**
 * Format search query for display
 * @param {string} query - Search query
 * @returns {string} - Formatted query
 */
export const formatSearchQuery = (query) => {
  return query.trim().replace(/\s+/g, ' ');
};

/**
 * Check if search query is valid
 * @param {string} query - Search query
 * @param {number} minLength - Minimum length
 * @returns {boolean}
 */
export const isValidSearchQuery = (query, minLength = 1) => {
  return query && query.trim().length >= minLength;
};

export default {
  calculateRelevanceScore,
  searchProductsLocally,
  highlightMatches,
  debounce,
  generateSuggestions,
  formatSearchQuery,
  isValidSearchQuery,
  escapeRegex,
};