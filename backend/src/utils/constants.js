// Constants for TruckSpot backend

const CAPACITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

const SCORING_WEIGHTS = {
  TRAFFIC: 0.35,
  EVENTS: 0.30,
  COMPETITION: 0.20,
  BASE_SCORE: 0.10,
  WEATHER: 0.05
};

const REVENUE_BASE = 150; // Base revenue multiplier

const COMPETITION_PENALTY = 0.15; // 15% penalty per competitor

const CAPACITY_MULTIPLIERS = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
  very_high: 1.3
};

const LOCATION_TYPES = {
  BUSINESS_DISTRICT: 'business_district',
  STUDENT_AREA: 'student_area',
  RECREATIONAL: 'recreational',
  COMMERCE: 'commerce',
  LEISURE: 'leisure'
};

const EVENT_CATEGORIES = {
  FESTIVAL: 'festival',
  MARKET: 'market',
  BUSINESS: 'business',
  ACADEMIC: 'academic',
  SPORTS: 'sports',
  CONCERT: 'concert',
  OTHER: 'other'
};

const WEATHER_CONDITIONS = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy',
  RAINY: 'rainy',
  SNOWY: 'snowy',
  WINDY: 'windy',
  STORMY: 'stormy'
};

module.exports = {
  CAPACITY_LEVELS,
  RISK_LEVELS,
  SCORING_WEIGHTS,
  REVENUE_BASE,
  COMPETITION_PENALTY,
  CAPACITY_MULTIPLIERS,
  LOCATION_TYPES,
  EVENT_CATEGORIES,
  WEATHER_CONDITIONS
};
