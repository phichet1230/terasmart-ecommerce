const cache = new Map();

/**
 * Get cached item if present and not expired
 */
exports.getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

/**
 * Set item in cache with TTL in seconds
 */
exports.setCache = (key, data, ttlSeconds = 60) => {
  cache.set(key, {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
};

/**
 * Flush cache entries matching a prefix (e.g. 'products_') or clear all
 */
exports.clearCache = (prefix = null) => {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};
