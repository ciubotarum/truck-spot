const { getDb } = require('../db/sqlite');

const DEFAULT_CURRENCY = 'RON';
const DEFAULT_AVG_ITEM_PRICE_CENTS = 1500; // 15.00 RON fallback

class TruckPricingService {
  /**
   * Returns menu stats for a truck.
   * Filters to currency=RON to avoid mixed-currency math.
   */
  getMenuStats(truckId) {
    const db = getDb();

    const rows = db.prepare(
      `SELECT price_cents as priceCents, currency, updated_at as updatedAt
       FROM menu_items
       WHERE user_id = ?`
    ).all(truckId);

    const ronRows = rows.filter(r => String(r.currency || '').toUpperCase() === DEFAULT_CURRENCY);

    const itemCountTotal = rows.length;
    const itemCountRON = ronRows.length;

    let avgItemPriceCents = null;
    if (itemCountRON > 0) {
      const sum = ronRows.reduce((acc, r) => acc + Number(r.priceCents || 0), 0);
      avgItemPriceCents = Math.round(sum / itemCountRON);
    }

    const latestUpdatedAt = ronRows
      .map(r => r.updatedAt)
      .filter(Boolean)
      .sort()
      .slice(-1)[0] || null;

    return {
      currency: DEFAULT_CURRENCY,
      itemCountTotal,
      itemCountRON,
      avgItemPriceCents: avgItemPriceCents ?? DEFAULT_AVG_ITEM_PRICE_CENTS,
      usedDefaultPricing: itemCountRON === 0,
      latestUpdatedAt
    };
  }

  getMenuSummary(truckId, maxItems = 5) {
    const db = getDb();

    const rows = db.prepare(
      `SELECT name, price_cents as priceCents, currency
       FROM menu_items
       WHERE user_id = ? AND currency = ?
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(truckId, DEFAULT_CURRENCY, maxItems);

    return rows.map(r => ({
      name: r.name,
      price: (Number(r.priceCents || 0) / 100).toFixed(2),
      currency: DEFAULT_CURRENCY
    }));
  }

  getMenuFingerprint(truckId) {
    const stats = this.getMenuStats(truckId);
    // Changes whenever item count changes or any item updated_at changes.
    return `${stats.itemCountRON}:${stats.latestUpdatedAt || 'none'}`;
  }
}

module.exports = new TruckPricingService();
module.exports.DEFAULT_CURRENCY = DEFAULT_CURRENCY;
