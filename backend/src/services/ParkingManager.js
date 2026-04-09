const locationsData = require('../data/mockLocations.json');
const { getDb } = require('../db/sqlite');
const crypto = require('crypto');

class ParkingManager {
  cleanupExpiredHolds(date = null, locationId = null) {
    const db = getDb();
    const now = new Date().toISOString();

    if (date && locationId) {
      db.prepare(
        `DELETE FROM reservations
         WHERE status = 'pending'
           AND expires_at IS NOT NULL
           AND expires_at <= ?
           AND date = ?
           AND location_id = ?`
      ).run(now, date, locationId);
      return;
    }

    // Global cleanup (best-effort)
    db.prepare(
      `DELETE FROM reservations
       WHERE status = 'pending'
         AND expires_at IS NOT NULL
         AND expires_at <= ?`
    ).run(now);
  }

  getTotalSpots(locationId) {
    const locations = Array.isArray(locationsData) ? locationsData : locationsData.locations;
    const loc = locations.find(l => l.id === locationId);
    const total = Number(loc?.parkingSpots);
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  getAvailability(date, locationId, userId = null) {
    this.cleanupExpiredHolds(date, locationId);
    const total = this.getTotalSpots(locationId);

    const db = getDb();
    const now = new Date().toISOString();
    const rows = db.prepare(
      `SELECT spot_number as spotNumber,
              user_id as userId,
              status,
              expires_at as expiresAt
       FROM reservations
       WHERE date = ? AND location_id = ?
         AND (
           status = 'confirmed'
           OR (status = 'pending' AND (expires_at IS NULL OR expires_at > ?))
         )`
    ).all(date, locationId, now);

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
    const now = new Date().toISOString();

    // Enforce at most one reservation per user per location/date.
    const existing = db.prepare(
      `SELECT spot_number as spotNumber, status, expires_at as expiresAt
       FROM reservations
       WHERE date = ? AND location_id = ? AND user_id = ?
         AND (
           status = 'confirmed'
           OR (status = 'pending' AND (expires_at IS NULL OR expires_at > ?))
         )`
    ).get(date, locationId, userId, now);
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

    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO reservations (id, date, location_id, spot_number, user_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`
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
    const now = new Date().toISOString();
    const existing = db.prepare(
      `SELECT spot_number as spotNumber, status, expires_at as expiresAt
       FROM reservations
       WHERE date = ? AND location_id = ? AND user_id = ?
         AND (
           status = 'confirmed'
           OR (status = 'pending' AND (expires_at IS NULL OR expires_at > ?))
         )`
    ).get(date, locationId, userId, now);

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
         AND r.status = 'confirmed'
       ORDER BY r.spot_number ASC`
    ).all(date, locationId);
  }

  createPendingHold({ date, locationId, userId, spotNumber, expiresAt, amountCents, currency, provider = 'stripe' }) {
    if (!date || !locationId || !userId) {
      const err = new Error('date, locationId, and userId are required');
      err.status = 400;
      throw err;
    }

    this.cleanupExpiredHolds(date, locationId);

    const total = this.getTotalSpots(locationId);
    if (total <= 0) {
      const err = new Error('Location has no parking spots configured');
      err.status = 400;
      throw err;
    }

    const desired = Number(spotNumber);
    if (!Number.isInteger(desired) || desired < 1 || desired > total) {
      const err = new Error(`spotNumber must be an integer between 1 and ${total}`);
      err.status = 400;
      throw err;
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Prevent multiple active holds/reservations by the same user for date/location.
    const existing = db.prepare(
      `SELECT id, spot_number as spotNumber, status, expires_at as expiresAt
       FROM reservations
       WHERE date = ? AND location_id = ? AND user_id = ?
         AND (
           status = 'confirmed'
           OR (status = 'pending' AND (expires_at IS NULL OR expires_at > ?))
         )`
    ).get(date, locationId, userId, now);

    if (existing?.id) {
      const err = new Error(existing.status === 'confirmed'
        ? 'You already have a reservation for this date/location'
        : 'You already have a pending reservation hold for this date/location');
      err.status = 409;
      throw err;
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO reservations
           (id, date, location_id, spot_number, user_id, status, expires_at, created_at)
         VALUES
           (?, ?, ?, ?, ?, 'pending', ?, ?)`
      ).run(
        id,
        date,
        locationId,
        desired,
        userId,
        expiresAt || null,
        now
      );

      db.exec('COMMIT');
      return { id, date, locationId, userId, spotNumber: desired, status: 'pending', expiresAt: expiresAt || null };
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      const err = new Error('Spot already reserved');
      err.status = 409;
      throw err;
    }
  }

  createPaymentSession({ reservationId, provider = 'stripe', sessionId, amountRon, currency }) {
    const db = getDb();
    if (!reservationId || !sessionId) return;

    const crypto = require('crypto');
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();

    const amount = Number(amountRon);

    db.prepare(
      `INSERT INTO reservation_payments
         (id, reservation_id, provider, session_id, amount_ron, currency, status, created_at, updated_at)
       VALUES
         (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(
      id,
      reservationId,
      provider,
      sessionId,
      Number.isInteger(amount) ? amount : 0,
      String(currency || 'ron'),
      now,
      now
    );
  }

  confirmByPaymentSession(sessionId) {
    const db = getDb();
    if (!sessionId) return { updated: 0 };

    const now = new Date().toISOString();
    const payment = db.prepare(
      `SELECT reservation_id as reservationId, status
       FROM reservation_payments
       WHERE session_id = ?`
    ).get(sessionId);

    if (!payment?.reservationId) return { updated: 0 };

    db.exec('BEGIN');
    try {
      db.prepare(
        `UPDATE reservation_payments
         SET status = 'paid', updated_at = ?
         WHERE session_id = ? AND status != 'paid'`
      ).run(now, sessionId);

      const res = db.prepare(
        `UPDATE reservations
         SET status = 'confirmed', expires_at = NULL
         WHERE id = ? AND status = 'pending'`
      ).run(payment.reservationId);

      db.exec('COMMIT');
      return { updated: res?.changes || 0 };
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    }
  }
}

module.exports = new ParkingManager();
