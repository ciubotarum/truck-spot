const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { computeQuoteForLocation } = require('../services/PricingService');
const ParkingManager = require('../services/ParkingManager');
const { getStripe } = require('../services/StripeService');

const router = express.Router();

const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''));

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

// GET /api/payments/quote?date=YYYY-MM-DD&locationId=...
router.get('/quote', requireAuth, async (req, res) => {
  try {
    const { date, locationId } = req.query;

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'locationId is required' });
    }

    const quote = await computeQuoteForLocation({ date, locationId });
    return res.json({ success: true, data: quote, timestamp: new Date().toISOString() });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, error: e.message || 'Failed to compute quote' });
  }
});

// POST /api/payments/checkout
// body: { date, locationId, spotNumber }
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { date, locationId, spotNumber } = req.body || {};

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'locationId is required' });
    }
    const desiredSpot = Number(spotNumber);
    if (!Number.isInteger(desiredSpot)) {
      return res.status(400).json({ success: false, error: 'spotNumber must be an integer' });
    }

    const quote = await computeQuoteForLocation({ date, locationId });

    // Create a 10 minute hold while the user completes payment.
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hold = ParkingManager.createPendingHold({
      date,
      locationId,
      userId: req.user.id,
      spotNumber: desiredSpot,
      expiresAt,
      amountCents: quote.amountCents,
      currency: quote.currency,
      provider: 'stripe'
    });

    const stripe = getStripe();
    const frontendUrl = getFrontendUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: quote.currency,
            unit_amount: quote.amountCents,
            product_data: {
              name: 'TruckSpot',
              description: `Parking booking fee — ${quote.reason}`
            }
          },
          quantity: 1
        }
      ],
      custom_text: {
        submit: {
          message: 'Complete your TruckSpot booking payment.'
        }
      },
      success_url: `${frontendUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/?payment=cancel`,
      metadata: {
        reservationId: hold.id,
        date,
        locationId: String(locationId),
        spotNumber: String(desiredSpot),
        userId: String(req.user.id),
        rank: String(quote.rank),
        tier: quote.tier
      }
    });

    if (!session?.id || !session?.url) {
      return res.status(500).json({ success: false, error: 'Failed to create checkout session' });
    }

    ParkingManager.createPaymentSession({
      reservationId: hold.id,
      provider: 'stripe',
      sessionId: session.id,
      amountRon: quote.amountRon,
      currency: quote.currency
    });

    return res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        expiresAt,
        quote
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return res.status(e.status || 500).json({ success: false, error: e.message || 'Failed to start checkout' });
  }
});

// GET /api/payments/confirm?sessionId=...
// Fallback for local dev when Stripe webhooks are not delivered (or delayed).
router.get('/confirm', requireAuth, async (req, res) => {
  try {
    const sessionId = req.query?.sessionId;
    if (!isNonEmptyString(sessionId)) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(String(sessionId));

    // For Checkout Sessions, payment_status === 'paid' indicates settled payment.
    // Some accounts may also have session.status === 'complete'.
    const paymentStatus = session?.payment_status;
    const sessionStatus = session?.status;

    if (paymentStatus !== 'paid' && sessionStatus !== 'complete') {
      return res.status(409).json({
        success: false,
        error: 'Payment is not completed yet',
        data: { paymentStatus, sessionStatus }
      });
    }

    const result = ParkingManager.confirmByPaymentSession(String(sessionId));

    return res.json({
      success: true,
      data: {
        updatedReservations: result?.updated || 0,
        paymentStatus,
        sessionStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || 'Failed to confirm session' });
  }
});

module.exports = router;
