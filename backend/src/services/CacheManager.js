const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cacheConfig = require('../config/cacheConfig');

class CacheManager {
  constructor() {
    this.cache = new Map(); // In-memory cache storage
    this.dataHashes = {}; // Track hashes of source data
  }

  /**
   * Compute a hash of all input data files to detect changes
   * This is used to invalidate cache when data changes
   */
  computeDataHash() {
    try {
      const dataPath = path.join(__dirname, '../data');
      const files = ['mockLocations.json', 'mockEvents.json', 'mockFootTraffic.json', 'weatherData.json', 'mockCompetition.json'];
      
      let combinedData = '';
      
      for (const file of files) {
        try {
          const filePath = path.join(dataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          combinedData += fileContent;
        } catch (err) {
          if (cacheConfig.DEBUG) {
            console.log(`[CACHE] Warning: Could not read file ${file}:`, err.message);
          }
        }
      }

      // Create hash of combined data
      const hash = crypto.createHash('sha256').update(combinedData).digest('hex');
      return hash;
    } catch (error) {
      console.error('[CACHE] Error computing data hash:', error.message);
      return null;
    }
  }

  /**
   * Check if cache is valid for the given date
   * Validates TTL and data hash
   */
  isCacheValid(date) {
    if (!cacheConfig.ENABLED) {
      return false;
    }

    if (!this.cache.has(date)) {
      if (cacheConfig.DEBUG) console.log(`[CACHE] MISS: No cache for date ${date}`);
      return false;
    }

    const cachedEntry = this.cache.get(date);
    const now = Date.now();
    const age = now - cachedEntry.timestamp;

    // Check TTL
    if (age > cacheConfig.TTL_MS) {
      if (cacheConfig.DEBUG) console.log(`[CACHE] MISS: Cache expired for ${date} (age: ${age}ms > TTL: ${cacheConfig.TTL_MS}ms)`);
      this.cache.delete(date);
      return false;
    }

    // Check data hash
    const currentHash = this.computeDataHash();
    if (currentHash !== cachedEntry.dataHash) {
      if (cacheConfig.DEBUG) console.log(`[CACHE] MISS: Data changed for ${date} (hash mismatch)`);
      this.cache.delete(date);
      return false;
    }

    if (cacheConfig.DEBUG) {
      const ttlRemaining = cacheConfig.TTL_MS - age;
      console.log(`[CACHE] HIT: Valid cache for ${date} (${(ttlRemaining / 1000).toFixed(1)}s remaining)`);
    }
    return true;
  }

  /**
   * Get cached recommendations for a date
   */
  get(date) {
    if (!this.isCacheValid(date)) {
      return null;
    }
    return this.cache.get(date).data;
  }

  /**
   * Store recommendations in cache
   */
  set(date, data) {
    if (!cacheConfig.ENABLED) {
      return;
    }

    try {
      const dataHash = this.computeDataHash();
      
      this.cache.set(date, {
        data: data,
        timestamp: Date.now(),
        dataHash: dataHash
      });

      // Manage cache size
      if (this.cache.size > cacheConfig.MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
        if (cacheConfig.DEBUG) console.log(`[CACHE] Pruned oldest entry to maintain max size`);
      }

      if (cacheConfig.DEBUG) {
        console.log(`[CACHE] STORED: Recommendations for ${date} (hash: ${dataHash?.substring(0, 8)}...)`);
      }
    } catch (error) {
      console.error('[CACHE] Error storing cache:', error.message);
    }
  }

  /**
   * Clear cache for a specific date or all cache
   */
  clear(date = null) {
    if (date) {
      this.cache.delete(date);
      if (cacheConfig.DEBUG) console.log(`[CACHE] Cleared cache for ${date}`);
    } else {
      this.cache.clear();
      if (cacheConfig.DEBUG) console.log(`[CACHE] Cleared all cache`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      enabled: cacheConfig.ENABLED,
      size: this.cache.size,
      ttlMs: cacheConfig.TTL_MS,
      entries: []
    };

    for (const [date, entry] of this.cache) {
      const age = Date.now() - entry.timestamp;
      const ttlRemaining = Math.max(0, cacheConfig.TTL_MS - age);
      
      stats.entries.push({
        date: date,
        timestamp: new Date(entry.timestamp).toISOString(),
        ageMs: age,
        ttlRemainingMs: ttlRemaining,
        dataHash: entry.dataHash?.substring(0, 8) + '...',
        isValid: ttlRemaining > 0
      });
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new CacheManager();
