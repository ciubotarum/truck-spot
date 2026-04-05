const locationsData = require('../data/mockLocations.json');

class ParkingManager {
  constructor() {
    // date -> locationId -> Map(spotNumber -> userId)
    this.reservationsByDate = new Map();
  }

  getTotalSpots(locationId) {
    const locations = Array.isArray(locationsData) ? locationsData : locationsData.locations;
    const loc = locations.find(l => l.id === locationId);
    const total = Number(loc?.parkingSpots);
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  ensureDateLocation(date, locationId) {
    if (!this.reservationsByDate.has(date)) {
      this.reservationsByDate.set(date, new Map());
    }
    const byLocation = this.reservationsByDate.get(date);
    if (!byLocation.has(locationId)) {
      byLocation.set(locationId, new Map());
    }
    return byLocation.get(locationId);
  }

  getAvailability(date, locationId, userId = null) {
    const total = this.getTotalSpots(locationId);
    const reservationsForLocation = this.ensureDateLocation(date, locationId);

    const reserved = reservationsForLocation.size;
    const available = Math.max(0, total - reserved);

    let mySpot = null;
    if (userId) {
      for (const [spotNumber, spotUserId] of reservationsForLocation.entries()) {
        if (spotUserId === userId) {
          mySpot = spotNumber;
          break;
        }
      }
    }

    const reservedSpots = Array.from(reservationsForLocation.keys()).sort((a, b) => a - b);
    const availableSpots = [];
    for (let i = 1; i <= total; i += 1) {
      if (!reservationsForLocation.has(i)) availableSpots.push(i);
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

    const reservationsForLocation = this.ensureDateLocation(date, locationId);

    // Enforce at most one reservation per user per location/date.
    for (const [existingSpot, existingUser] of reservationsForLocation.entries()) {
      if (existingUser === userId) {
        return { spotNumber: existingSpot, alreadyReserved: true };
      }
    }

    const desired = Number(spotNumber);
    if (!Number.isInteger(desired) || desired < 1 || desired > total) {
      const err = new Error(`spotNumber must be an integer between 1 and ${total}`);
      err.status = 400;
      throw err;
    }

    if (reservationsForLocation.has(desired)) {
      const err = new Error('Spot already reserved');
      err.status = 409;
      throw err;
    }

    reservationsForLocation.set(desired, userId);
    return { spotNumber: desired, alreadyReserved: false };
  }

  releaseSpot({ date, locationId, userId }) {
    if (!date || !locationId || !userId) {
      const err = new Error('date, locationId, and userId are required');
      err.status = 400;
      throw err;
    }

    const reservationsForLocation = this.ensureDateLocation(date, locationId);

    let releasedSpot = null;
    for (const [spotNumber, existingUser] of reservationsForLocation.entries()) {
      if (existingUser === userId) {
        reservationsForLocation.delete(spotNumber);
        releasedSpot = spotNumber;
        break;
      }
    }

    return { releasedSpot };
  }
}

module.exports = new ParkingManager();
