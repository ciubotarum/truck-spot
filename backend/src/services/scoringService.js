const locations = require('../data/mockLocations.json');
const footTraffic = require('../data/mockFootTraffic.json');
const events = require('../data/mockEvents.json');
const competition = require('../data/mockCompetition.json');
const weather = require('../data/weatherData.json');

/**
 * Score all locations based on multiple factors
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} foodTruckType - Type of food truck (optional)
 * @returns {Array} Array of locations with scores
 */
const scoreAllLocations = async (date, foodTruckType = null) => {
  try {
    return locations.locations.map(location => {
      // Get foot traffic for this location and date
      const footTrafficData = footTraffic.footTraffic.find(
        ft => ft.locationId === location.id && ft.date === date
      ) || { estimatedPedestrians: 0 };

      // Get events for this location and date
      const locationEvents = events.events.filter(
        evt => evt.locationId === location.id && evt.date === date
      );

      // Get competitors at this location
      const locationCompetition = competition.competitors.filter(
        comp => comp.locationId === location.id
      );

      // Get weather data for the date
      const weatherData = weather.weather.find(w => w.date === date) || { trafficImpact: 1 };

      // Calculate score components (weighted)
      const trafficScore = Math.min(1, footTrafficData.estimatedPedestrians / 1000) * 0.35;

      const eventScore = locationEvents.length > 0
        ? (locationEvents.reduce((sum, e) => sum + e.relevanceScore, 0) /
           locationEvents.length) * 0.30
        : 0;

      const competitionScore = (1 - Math.min(1, locationCompetition.length * 0.15)) * 0.20;

      const baseScore = location.baseScore * 0.10;

      const weatherScore = weatherData.trafficImpact * 0.05;

      // Total weighted score (0-1)
      const totalScore = trafficScore + eventScore + competitionScore + baseScore + weatherScore;

      // Estimate revenue based on multiple factors
      const capacityMultiplier = location.capacity === 'very_high' ? 1.3 : location.capacity === 'high' ? 1.2 : 1;
      const estimatedRevenue = Math.round(totalScore * 150 * capacityMultiplier);

      // Determine risk level
      let riskLevel = 'high';
      if (totalScore > 0.7) riskLevel = 'low';
      else if (totalScore > 0.5) riskLevel = 'medium';

      // Build reasons array
      const reasons = [];
      if (footTrafficData.estimatedPedestrians > 500) reasons.push('✓ High foot traffic');
      if (locationEvents.length > 0) reasons.push('✓ Local events today');
      if (locationCompetition.length === 0) reasons.push('✓ No direct competition');
      if (weatherData.trafficImpact > 1) reasons.push('✓ Favorable weather');
      if (location.capacity === 'very_high') reasons.push('✓ Optimal parking availability');

      return {
        locationId: location.id,
        locationName: location.name,
        zone: location.zone,
        score: parseFloat(totalScore.toFixed(2)),
        estimatedRevenue,
        confidence: 'medium',
        footTraffic: footTrafficData.estimatedPedestrians,
        eventsCount: locationEvents.length,
        competitionCount: locationCompetition.length,
        capacity: location.capacity,
        reasons: reasons.length > 0 ? reasons : ['✓ Suitable location'],
        riskLevel,
        lat: location.lat,
        lng: location.lng,
        scoreBreakdown: {
          traffic: parseFloat(trafficScore.toFixed(3)),
          events: parseFloat(eventScore.toFixed(3)),
          competition: parseFloat(competitionScore.toFixed(3)),
          base: parseFloat(baseScore.toFixed(3)),
          weather: parseFloat(weatherScore.toFixed(3))
        }
      };
    });
  } catch (error) {
    console.error('Error in scoreAllLocations:', error);
    throw error;
  }
};

module.exports = {
  scoreAllLocations
};
