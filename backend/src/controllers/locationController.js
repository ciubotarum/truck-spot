const locations = require('../data/mockLocations.json');

/**
 * Get all locations
 */
exports.getAllLocations = (req, res) => {
  try {
    res.json({
      success: true,
      data: locations.locations,
      count: locations.locations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get location by ID
 */
exports.getLocationById = (req, res) => {
  try {
    const { id } = req.params;
    const location = locations.locations.find(loc => loc.id === id);

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
        locationId: id
      });
    }

    res.json({
      success: true,
      data: location,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get nearby locations within a radius
 */
exports.getNearbyLocations = (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = parseFloat(req.query.radius) || 2; // km, default 2km

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude or longitude'
      });
    }

    // Calculate distance using Haversine formula
    const nearby = locations.locations.filter(loc => {
      const distance = Math.sqrt(
        Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
      ) * 111; // Convert degree difference to km (approx)

      return distance <= radius;
    });

    res.json({
      success: true,
      data: nearby,
      count: nearby.length,
      center: { lat: latitude, lng: longitude },
      radius,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
