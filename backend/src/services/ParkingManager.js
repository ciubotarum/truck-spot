const locationsData = require('../data/mockLocations.json');
const { getDb } = require('../db/sqlite');
const crypto = require('crypto');

class ParkingManager {
  getTotalSpots(locationId) {
    const locations = Array.isArray(locationsData) ? locationsData : locationsData.locations;
    const loc = locations.find(l => l.id === locationId);
    const total = Number(loc?.parkingSpots);
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  getAvailability(date, locationId, userId = null) {
    const total = this.getTotalSpots(locationId);

    const db = getDb();
    const rows = db.prepare(
      'SELECT spot_number as spotNumber, user_id as userId FROM reservations WHERE date = ? AND location_id = ?'
    ).all(date, locationId);

    const reserved = rows.length;
    const available = Math.max(0, total - reserved);

    let mySpot = null;
    if (userId) {
      const mine = rows.find(r => r.userId === userId);
      mySpot = mine ? mine.spotNumber : null;
    }

    const reservedSpots = rows.map(r => r.spotNumber).sort((a, b) => a - b);
    const availableSpots = [];
    const reservedSet = new Set(reservedSpots);
    for (let i = 1; i <= total; i += 1) {
      if (!reservedSet.has(i)) availableSpots.push(i);
    }

    return {
      date,
      locationId,
      total,
      reserved,
      available,
      reservedSpots,
      availableSpots,
      mySpot
    };
  }

  reserveSpot({ date, locationId, userId, spotNumber }) {
    if (!date || !locationId || !userId) {
      const err = new Error('date, locationId, and userId are required');
      err.status = 400;
      throw err;
    }

    const total = this.getTotalSpots(locationId);
    if (total <= 0) {
      const err = new Error('Location has no parking spots configured');
      err.status = 400;
      throw err;
    }

    const db = getDb();

    // Enforce at most one reservation per user per location/date.
    const existing = db.prepare(
      'SELECT spot_number as spotNumber FROM reservations WHERE date = ? AND location_id = ? AND user_id = ?'
    ).get(date, locationId, userId);
    if (existing?.spotNumber) {
      return { spotNumber: existing.spotNumber, alreadyReserved: true };
    }

    const desired = Number(spotNumber);
    if (!Number.isInteger(desired) || desired < 1 || desired > total) {
      const err = new Error(`spotNumber must be an integer between 1 and ${total}`);
      err.status = 400;
      throw err;
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    db.exec('BEGIN');
    try {
      db.prepare(
        'INSERT INTO reservations (id, date, location_id, spot_number, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, date, locationId, desired, userId, now);

      db.exec('COMMIT');
      return { spotNumber: desired, alreadyReserved: false };
    } catch (e) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }

      const err = new Error('Spot already reserved');
      err.status = 409;
      throw err;
    }
  }

  releaseSpot({ date, locationId, userId }) {
    if (!date || !locationId || !userId) {
      const err = new Error('date, locationId, and userId are required');
      err.status = 400;
      throw err;
    }

    const db = getDb();
    const existing = db.prepare(
      'SELECT spot_number as spotNumber FROM reservations WHERE date = ? AND location_id = ? AND user_id = ?'
    ).get(date, locationId, userId);

    if (!existing?.spotNumber) {
      return { releasedSpot: null };
    }

    db.prepare(
      'DELETE FROM reservations WHERE date = ? AND location_id = ? AND user_id = ?'
    ).run(date, locationId, userId);

    return { releasedSpot: existing.spotNumber };
  }

  listReservedTrucks(date, locationId) {
    const db = getDb();
    return db.prepare(
      `SELECT
         r.spot_number as spotNumber,
         r.created_at as reservedAt,
         r.user_id as truckId,
         p.truck_name as truckName,
         p.cuisine as cuisine,
         p.description as description
       FROM reservations r
       JOIN truck_profiles p ON p.user_id = r.user_id
       WHERE r.date = ? AND r.location_id = ?
       ORDER BY r.spot_number ASC`
    ).all(date, locationId);
  }
}

module.exports = new ParkingManager();
