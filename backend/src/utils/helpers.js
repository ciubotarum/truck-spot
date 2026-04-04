/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid date format
 */
const isValidDateFormat = (date) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

/**
 * Parse date string and return Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
const parseDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00');
};

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get day of week from date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Day of week (Monday, Tuesday, etc.)
 */
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Sort array of recommendations by score (descending)
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Array} Sorted array
 */
const sortByScore = (recommendations) => {
  return [...recommendations].sort((a, b) => b.score - a.score);
};

/**
 * Filter recommendations by risk level
 * @param {Array} recommendations - Array of recommendation objects
 * @param {string} riskLevel - Risk level to filter ('low', 'medium', 'high')
 * @returns {Array} Filtered array
 */
const filterByRiskLevel = (recommendations, riskLevel) => {
  return recommendations.filter(rec => rec.riskLevel === riskLevel);
};

/**
 * Get recommendations with revenue above threshold
 * @param {Array} recommendations - Array of recommendation objects
 * @param {number} minRevenue - Minimum revenue threshold
 * @returns {Array} Filtered array
 */
const filterByMinRevenue = (recommendations, minRevenue) => {
  return recommendations.filter(rec => rec.estimatedRevenue >= minRevenue);
};

/**
 * Calculate average score from recommendations
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {number} Average score
 */
const calculateAverageScore = (recommendations) => {
  if (recommendations.length === 0) return 0;
  const sum = recommendations.reduce((total, rec) => total + rec.score, 0);
  return parseFloat((sum / recommendations.length).toFixed(2));
};

/**
 * Generate report statistics from recommendations
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Object} Statistics object
 */
const generateReportStats = (recommendations) => {
  return {
    totalLocations: recommendations.length,
    averageScore: calculateAverageScore(recommendations),
    maxRevenue: Math.max(...recommendations.map(r => r.estimatedRevenue)),
    minRevenue: Math.min(...recommendations.map(r => r.estimatedRevenue)),
    riskDistribution: {
      low: filterByRiskLevel(recommendations, 'low').length,
      medium: filterByRiskLevel(recommendations, 'medium').length,
      high: filterByRiskLevel(recommendations, 'high').length
    }
  };
};

module.exports = {
  calculateDistance,
  isValidDateFormat,
  parseDate,
  formatDate,
  getDayOfWeek,
  sortByScore,
  filterByRiskLevel,
  filterByMinRevenue,
  calculateAverageScore,
  generateReportStats
};
