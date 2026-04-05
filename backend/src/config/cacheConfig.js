// Cache configuration settings
module.exports = {
  // Cache TTL in milliseconds (30 minutes)
  TTL_MS: 30 * 60 * 1000,

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
