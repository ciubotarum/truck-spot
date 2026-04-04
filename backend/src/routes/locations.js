const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Get all locations
router.get('/', locationController.getAllLocations);

// Get location by ID
router.get('/:id', locationController.getLocationById);

// Get nearby locations
router.get('/nearby/:lat/:lng', locationController.getNearbyLocations);

module.exports = router;
