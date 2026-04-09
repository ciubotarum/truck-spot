// Cache configuration settings
module.exports = {
  // Cache TTL in milliseconds (default: 24 hours)
  // Override via env var when needed (e.g. CACHE_TTL_MS=1800000 for 30 min)
  TTL_MS: Number(process.env.CACHE_TTL_MS) || 24 * 60 * 60 * 1000,

  // Enable/disable caching globally
  ENABLED: true,

  // Log cache hits and misses (helpful for debugging)
  DEBUG: process.env.CACHE_DEBUG === 'true' || false,

  // Maximum cache size (number of cached date entries to keep)
  MAX_CACHE_SIZE: 50,

  // If true, cache is strictly invalidated on ANY data change
  // If false, cache can be used if only cosmetic/non-impact changes
  STRICT_MODE: true
};
