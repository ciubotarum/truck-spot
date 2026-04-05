/**
 * Revenue Calculator
 * Calculates revenue projections based on demand score, context adjustment, and location capacity
 */
class RevenueCalculator {
  projectRevenue(location, demandScore, contextAdjustment, options = {}) {
    try {
      console.log(`[REVENUE CALCULATOR] Calculating revenue for ${location.name}...`);

      // Base transactions per day by capacity tier (tunable heuristic).
      const baseTransactionsByCapacity = {
        low: 80,
        medium: 130,
        high: 190,
        very_high: 240
      };

      const baseTransactions = baseTransactionsByCapacity[location.capacity] || baseTransactionsByCapacity.medium;

      const estimatedTransactions = Number.isInteger(options.estimatedTransactions)
        ? Math.max(0, options.estimatedTransactions)
        : Math.max(
          0,
          Math.round(baseTransactions * (Number(demandScore) || 0) * (Number(contextAdjustment) || 1))
        );

      // Average ticket in cents (RON bani). If not provided, keep a sensible default.
      const avgTicketCents = Number.isInteger(options.avgTicketCents)
        ? options.avgTicketCents
        : 1500;

      const projectedRevenueCents = estimatedTransactions * avgTicketCents;
      const projectedDailyRevenue = Math.round(projectedRevenueCents / 100);

      const currency = options.currency || 'RON';
      const basis = options.pricingBasis || (options.avgTicketCents ? 'menu' : 'default');

      return {
        calculator: 'RevenueCalculator',
        location: location.name,
        projectedDailyRevenue,
        estimatedTransactions,
        currency,
        revenueType: 'gross',
        avgTicket: (avgTicketCents / 100).toFixed(2),
        pricingBasis: basis,
        assumptions: options.assumptions || null,
        calculation: `${baseTransactions} (base tx) × ${Number(demandScore || 0).toFixed(2)} (demand) × ${Number(contextAdjustment || 1).toFixed(2)} (context) × ${avgTicketCents} (avgTicketCents)`
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
