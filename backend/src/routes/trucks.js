const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../db/sqlite');
const { requireAuth } = require('../middleware/auth');

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

const normalizePriceToCents = (price) => {
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
};

// GET /api/trucks/me  (owner)
router.get('/me/profile', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const profile = db.prepare(
      `SELECT
         user_id as truckId,
         truck_name as truckName,
         cuisine,
         description,
         phone
       FROM truck_profiles
       WHERE user_id = ?`
    ).get(req.user.id);

    return res.json({ success: true, data: profile || null, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[TRUCKS][ME][PROFILE]', e);
    return res.status(500).json({ success: false, error: 'Failed to load profile' });
  }
});

// GET /api/trucks/me/menu  (owner)
router.get('/me/menu', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const menu = db.prepare(
      `SELECT id, user_id as truckId, name, price_cents as priceCents, currency, description
       FROM menu_items
       WHERE user_id = ?
       ORDER BY created_at DESC`
    ).all(req.user.id);

    return res.json({
      success: true,
      data: menu.map(m => ({ ...m, price: (m.priceCents / 100).toFixed(2) })),
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[TRUCKS][ME][MENU]', e);
    return res.status(500).json({ success: false, error: 'Failed to load menu' });
  }
});

// POST /api/trucks/me/menu  (owner)
// body: { name, price, currency?, description? }
router.post('/me/menu', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, price, currency = 'RON', description = null } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Menu item name is required' });
    }

    const normalizedCurrency = String(currency || 'RON').trim().toUpperCase();
    if (normalizedCurrency !== 'RON') {
      return res.status(400).json({ success: false, error: 'Currency must be RON' });
    }

    const priceCents = normalizePriceToCents(price);
    if (priceCents === null) {
      return res.status(400).json({ success: false, error: 'Price must be a non-negative number' });
    }

    const id = makeId();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO menu_items (id, user_id, name, price_cents, currency, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, req.user.id, String(name).trim(), priceCents, 'RON', description, now, now);

    return res.json({
      success: true,
      data: {
        id,
        name: String(name).trim(),
        priceCents,
        price: (priceCents / 100).toFixed(2),
        currency: 'RON',
        description
      },
      timestamp: now
    });
  } catch (e) {
    console.error('[TRUCKS][ME][MENU][ADD]', e);
    return res.status(500).json({ success: false, error: 'Failed to add menu item' });
  }
});

// DELETE /api/trucks/me/menu/:itemId  (owner)
router.delete('/me/menu/:itemId', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { itemId } = req.params;

    const result = db.prepare('DELETE FROM menu_items WHERE id = ? AND user_id = ?').run(itemId, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    return res.json({ success: true, data: { deleted: true }, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[TRUCKS][ME][MENU][DELETE]', e);
    return res.status(500).json({ success: false, error: 'Failed to delete menu item' });
  }
});

// GET /api/trucks/:truckId  (public)
router.get('/:truckId', (req, res) => {
  try {
    const db = getDb();
    const { truckId } = req.params;

    const profile = db.prepare(
      `SELECT
         user_id as truckId,
         truck_name as truckName,
         cuisine,
         description,
         phone
       FROM truck_profiles
       WHERE user_id = ?`
    ).get(truckId);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Truck not found' });
    }

    const menu = db.prepare(
      `SELECT id, user_id as truckId, name, price_cents as priceCents, currency, description
       FROM menu_items
       WHERE user_id = ?
       ORDER BY created_at DESC`
    ).all(truckId);

    return res.json({
      success: true,
      data: {
        profile,
        menu: menu.map(m => ({
          ...m,
          price: (m.priceCents / 100).toFixed(2)
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[TRUCKS][GET]', e);
    return res.status(500).json({ success: false, error: 'Failed to load truck' });
  }
});

module.exports = router;
