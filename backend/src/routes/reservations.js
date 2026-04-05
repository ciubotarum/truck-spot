const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db/sqlite');
const locationsData = require('../data/mockLocations.json');

const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

const getLocationNameById = (locationId) => {
  const locations = Array.isArray(locationsData) ? locationsData : locationsData.locations;
  const loc = locations.find(l => l.id === locationId);
  return loc?.name || null;
};

// GET /api/reservations?date=YYYY-MM-DD
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || null;

    if (date && !isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const rows = date
      ? db.prepare(
        `SELECT date, location_id as locationId, spot_number as spotNumber, created_at as createdAt
         FROM reservations
         WHERE user_id = ? AND date = ?
         ORDER BY created_at DESC`
      ).all(req.user.id, date)
      : db.prepare(
        `SELECT date, location_id as locationId, spot_number as spotNumber, created_at as createdAt
         FROM reservations
         WHERE user_id = ?
         ORDER BY created_at DESC`
      ).all(req.user.id);

    const data = rows.map(r => ({
      ...r,
      locationName: getLocationNameById(r.locationId)
    }));

    return res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[RESERVATIONS][LIST]', e);
    return res.status(500).json({ success: false, error: 'Failed to load reservations' });
  }
});

module.exports = router;
