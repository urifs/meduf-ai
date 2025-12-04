/**
 * Simple in-memory cache for API calls
 * Reduces unnecessary network requests
 */

const cache = new Map();
const cacheTimestamps = new Map();

const DEFAULT_TTL = 60000; // 1 minute default

export const apiCache = {
  get: (key) => {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return null;
    
    const now = Date.now();
    const age = now - timestamp;
    
    // Check if cache is still valid
    const ttl = cache.get(key + '_ttl') || DEFAULT_TTL;
    if (age > ttl) {
      // Cache expired
      cache.delete(key);
      cache.delete(key + '_ttl');
      cacheTimestamps.delete(key);
      return null;
    }
    
    return cache.get(key);
  },
  
  set: (key, value, ttl = DEFAULT_TTL) => {
    cache.set(key, value);
    cache.set(key + '_ttl', ttl);
    cacheTimestamps.set(key, Date.now());
  },
  
  clear: (key) => {
    if (key) {
      cache.delete(key);
      cache.delete(key + '_ttl');
      cacheTimestamps.delete(key);
    } else {
      // Clear all
      cache.clear();
      cacheTimestamps.clear();
    }
  },
  
  has: (key) => {
    return cache.has(key) && cacheTimestamps.has(key);
  }
};

export default apiCache;
