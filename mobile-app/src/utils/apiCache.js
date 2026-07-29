// src/utils/apiCache.js

const cache = new Map();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data
 * @param {string} key
 * @returns {any|null}
 */
export const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() > entry.expiresAt;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

/**
 * Set cached data
 * @param {string} key
 * @param {any} data
 * @param {number} ttl - Time to live in ms
 */
export const setCached = (key, data, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    cachedAt: Date.now(),
  });
};

/**
 * Invalidate cache for a key
 * @param {string} key
 */
export const invalidateCache = (key) => {
  cache.delete(key);
};

/**
 * Invalidate all cache keys matching prefix
 * @param {string} prefix
 */
export const invalidateCacheByPrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear entire cache
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Fetch with cache wrapper
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttl - Cache duration in ms
 * @returns {any}
 */
export const fetchWithCache = async (key, fetchFn, ttl = DEFAULT_TTL) => {
  // Return cached if available
  const cached = getCached(key);
  if (cached !== null) {
    // console.log(`⚡ Cache hit: ${key}`);
    return cached;
  }

  // Fetch fresh data
  // console.log(`🌐 Cache miss: ${key} — fetching...`);
  const data = await fetchFn();
  setCached(key, data, ttl);
  return data;
};

export default {
  getCached,
  setCached,
  invalidateCache,
  invalidateCacheByPrefix,
  clearCache,
  fetchWithCache,
};