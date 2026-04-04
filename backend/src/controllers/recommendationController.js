const scoringService = require('../services/scoringService');

/**
 * Get daily recommendations for a specific date
 */
exports.getDailyRecommendations = async (req, res) => {
  try {
    const { date } = req.params;
    const foodTruckType = req.query.foodTruckType;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const recommendations = await scoringService.scoreAllLocations(date, foodTruckType);

    // Sort by score and get top 3
    const topThree = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((rec, index) => ({
        rank: index + 1,
        ...rec
      }));

    res.json({
      success: true,
      date,
      foodTruckType: foodTruckType || 'all',
      recommendations: topThree,
      totalLocations: recommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Analyze and provide custom recommendations
 * POST body: { date: "2026-04-04", foodTruckType: "pizza" }
 */
exports.analyzeAndRecommend = async (req, res) => {
  try {
    const { date, foodTruckType } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required'
      });
    }

    const recommendations = await scoringService.scoreAllLocations(date, foodTruckType);

    const sorted = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5

    res.json({
      success: true,
      analysis: {
        date,
        foodTruckType: foodTruckType || 'all',
        topLocations: sorted,
        analysis: {
          bestLocation: sorted[0],
          averageScore: (sorted.reduce((sum, r) => sum + r.score, 0) / sorted.length).toFixed(2),
          highRiskCount: sorted.filter(r => r.riskLevel === 'high').length,
          mediumRiskCount: sorted.filter(r => r.riskLevel === 'medium').length,
          lowRiskCount: sorted.filter(r => r.riskLevel === 'low').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
