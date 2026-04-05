const express = require('express');
const router = express.Router();
const ParkingManager = require('../services/ParkingManager');

const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

// GET /api/parking/:date/:locationId
router.get('/:date/:locationId', (req, res) => {
  try {
    const { date, locationId } = req.params;
    const userId = req.query.userId || null;

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const availability = ParkingManager.getAvailability(date, locationId, userId);
    return res.json({ success: true, data: availability, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

// POST /api/parking/:date/:locationId/reserve  body: { userId, spotNumber }
router.post('/:date/:locationId/reserve', (req, res) => {
  try {
    const { date, locationId } = req.params;
    const { userId, spotNumber } = req.body || {};

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = ParkingManager.reserveSpot({ date, locationId, userId, spotNumber });
    const availability = ParkingManager.getAvailability(date, locationId, userId);

    return res.json({
      success: true,
      data: {
        reservation: result,
        availability
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

// POST /api/parking/:date/:locationId/release  body: { userId }
router.post('/:date/:locationId/release', (req, res) => {
  try {
    const { date, locationId } = req.params;
    const { userId } = req.body || {};

    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = ParkingManager.releaseSpot({ date, locationId, userId });
    const availability = ParkingManager.getAvailability(date, locationId, userId);

    return res.json({
      success: true,
      data: {
        release: result,
        availability
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

module.exports = router;
