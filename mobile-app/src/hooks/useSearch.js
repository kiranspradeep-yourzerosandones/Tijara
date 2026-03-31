// src/hooks/useSearch.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { productsAPI } from '../api';
import { searchProductsLocally, isValidSearchQuery } from '../utils/searchUtils';

const useSearch = (options = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 8,
    enableBackendSearch = true,
    localProducts = [],
    categories = [],  // ✅ Accept categories as option
  } = options;

  // State
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [error, setError] = useState(null);

  // Refs
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Local filtered products
  const filteredProducts = useMemo(() => {
    return searchProductsLocally(localProducts, query);
  }, [localProducts, query]);

  // Is currently searching
  const isSearching = isValidSearchQuery(query, 1);

  // Generate popular searches from categories and products
  const popularSearches = useMemo(() => {
    const searches = [];
    
    // Add category names
    if (categories && categories.length > 0) {
      categories.slice(0, 3).forEach(cat => {
        if (cat.name) {
          searches.push(cat.name);
        }
      });
    }
    
    // Add some product titles if available
    if (localProducts && localProducts.length > 0) {
      localProducts.slice(0, 2).forEach(product => {
        if (product.title && !searches.includes(product.title)) {
          searches.push(product.title);
        }
      });
    }
    
    return searches.slice(0, 5);
  }, [categories, localProducts]);

  // Fetch suggestions from backend
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!isValidSearchQuery(searchQuery, minQueryLength)) {
      setSuggestions([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoadingSuggestions(true);
    setError(null);

    try {
      const response = await productsAPI.searchProducts(searchQuery);
      const products = response.data?.products || response.products || [];

      // Generate keyword suggestions
      const keywordSet = new Set();
      products.forEach(product => {
        const title = product.title?.toLowerCase() || '';
        if (title.includes(searchQuery.toLowerCase())) {
          keywordSet.add(product.title);
        }
      });

      const keywordSuggestions = Array.from(keywordSet).slice(0, 3).map((keyword, index) => ({
        id: `keyword_${index}`,
        type: 'keyword',
        title: keyword,
      }));

      // Product suggestions
      const productSuggestions = products.slice(0, maxSuggestions).map(product => ({
        id: product._id,
        type: 'product',
        title: product.title,
        category: product.category,
        price: product.price,
        image: product.images?.[0],
        product: product,
      }));

      // Category suggestions
      const categoriesFromProducts = [...new Set(products.map(p => p.category).filter(Boolean))];
      const categorySuggestions = categoriesFromProducts.slice(0, 2).map(cat => ({
        id: `cat_${cat}`,
        type: 'category',
        title: cat,
      }));

      setSuggestions([
        ...keywordSuggestions,
        ...categorySuggestions,
        ...productSuggestions,
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search suggestions error:', err);
        setError(err.message);
        setSuggestions([]);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [minQueryLength, maxSuggestions]);

  // Debounced search
  useEffect(() => {
    if (!enableBackendSearch) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, fetchSuggestions, enableBackendSearch]);

  // Update query
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
    setShowSuggestions(true);
  }, []);

  // Fill search
  const fillSearch = useCallback((text) => {
    setQuery(text);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  }, []);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Show suggestions
  const openSuggestions = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  // Add to recent searches
  const addToRecentSearches = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
      return [searchTerm, ...filtered].slice(0, 10);
    });
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback((searchTerm) => {
    setRecentSearches(prev => prev.filter(s => s !== searchTerm));
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  // Select suggestion
  const selectSuggestion = useCallback((suggestion) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion.title;
    setQuery(text);
    addToRecentSearches(text);
    setShowSuggestions(false);
  }, [addToRecentSearches]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    query,
    suggestions,
    filteredProducts,
    isSearching,
    isLoadingSuggestions,
    showSuggestions,
    recentSearches,
    trendingSearches: popularSearches,  // ✅ Dynamic from categories/products
    error,

    // Actions
    setQuery: updateQuery,
    fillSearch,
    clearSearch,
    hideSuggestions,
    openSuggestions,
    selectSuggestion,
    addToRecentSearches,
    removeRecentSearch,
    clearRecentSearches,
    fetchSuggestions,
  };
};

export default useSearch;