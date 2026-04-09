const { scoreAllLocations } = require('./scoringService');

const DEFAULT_BASE_FEE_RON = 60;

const getCurrency = () => {
  // Booking payments are always in Romanian Leu.
  // Stripe expects lowercase ISO currency code.
  return 'ron';
};

const getBaseFeeRon = () => {
  const rawRon = process.env.BOOKING_BASE_FEE_RON;
  const ron = Number(rawRon);
  if (Number.isInteger(ron) && ron >= 0) return ron;

  // Backward-compatible fallback (old env var). Prefer BOOKING_BASE_FEE_RON.
  const rawCents = process.env.BOOKING_BASE_FEE_CENTS;
  const cents = Number(rawCents);
  if (Number.isInteger(cents) && cents >= 0) return Math.round(cents / 100);

  return DEFAULT_BASE_FEE_RON;
};

const rankToTier = (rank) => {
  if (rank <= 3) return { tier: 'A', multiplier: 1.6 };
  if (rank <= 10) return { tier: 'B', multiplier: 1.2 };
  return { tier: 'C', multiplier: 1.0 };
};

const computeQuoteForLocation = async ({ date, locationId }) => {
  if (!date || !locationId) {
    const err = new Error('date and locationId are required');
    err.status = 400;
    throw err;
  }

  const scored = await scoreAllLocations(date);

  const sorted = scored
    .slice()
    .sort((a, b) => (b.estimatedRevenue || 0) - (a.estimatedRevenue || 0));

  const idx = sorted.findIndex((r) => String(r.locationId) === String(locationId));
  if (idx < 0) {
    const err = new Error('Unknown locationId');
    err.status = 404;
    throw err;
  }

  const rank = idx + 1;
  const { tier, multiplier } = rankToTier(rank);

  const baseFeeRon = getBaseFeeRon();
  const amountRon = Math.round(baseFeeRon * multiplier);
  const amountCents = Math.round(amountRon * 100);

  return {
    date,
    locationId,
    rank,
    tier,
    currency: getCurrency(),
    baseFeeRon,
    multiplier,
    amountRon,
    amountCents,
    reason: `Tier ${tier} (rank ${rank})`
  };
};

module.exports = {
  computeQuoteForLocation
};
