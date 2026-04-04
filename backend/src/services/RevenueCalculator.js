/**
 * Revenue Calculator
 * Calculates revenue projections based on demand score, context adjustment, and location capacity
 */
class RevenueCalculator {
  projectRevenue(location, demandScore, contextAdjustment) {
    try {
      console.log(`[REVENUE CALCULATOR] Calculating revenue for ${location.name}...`);

      const baseRevenue = {
        'high': 600,
        'very_high': 800,
        'medium': 400,
        'low': 200
      };

      const capacityRevenue = baseRevenue[location.capacity] || 400;
      
      const projectedRevenue = capacityRevenue * demandScore * contextAdjustment;
      
      const avgTransactionValue = 15;
      const estimatedTransactions = Math.floor(projectedRevenue / avgTransactionValue);

      return {
        calculator: 'RevenueCalculator',
        location: location.name,
        projectedDailyRevenue: Math.round(projectedRevenue),
        estimatedTransactions: estimatedTransactions,
        currency: 'USD',
        calculation: `${capacityRevenue} (base) × ${demandScore.toFixed(2)} (demand) × ${contextAdjustment.toFixed(2)} (context)`
      };
    } catch (error) {
      console.error('Revenue Calculator Error:', error.message);
      return {
        calculator: 'RevenueCalculator',
        location: location.name,
        error: error.message,
        projectedDailyRevenue: 0
      };
    }
  }
}

module.exports = RevenueCalculator;
