const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Get daily recommendations for a specific date
router.get('/:date', recommendationController.getDailyRecommendations);

// Analyze and provide custom recommendations
router.post('/analyze', recommendationController.analyzeAndRecommend);

module.exports = router;
