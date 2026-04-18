import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Boot token on initial load (so deep links still auth correctly)
try {
  const existingToken = window.localStorage.getItem('truckspot_auth_token');
  if (existingToken) setAuthToken(existingToken);
} catch {
  // ignore
}

// Request interceptor
api.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  response => {
    console.log(`[API] Response: ${response.status}`, response.data);
    return response;
  },
  error => {
    console.error('[API] Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Location API
export const locationService = {
  getAllLocations: () => api.get('/api/locations'),
  getLocationById: (id) => api.get(`/api/locations/${id}`),
  getNearbyLocations: (lat, lng, radius = 2) =>
    api.get(`/api/locations/nearby/${lat}/${lng}?radius=${radius}`)
};

// Recommendation API
export const recommendationService = {
  getDailyRecommendations: (date) => api.get(`/api/recommendations/${date}`),
  analyzeAndRecommend: (data) => api.post('/api/recommendations/analyze', data)
};

// AI Agent API
export const agentService = {
  healthCheck: () => api.get('/api/agents/health'),
  analyzeLocation: (locationId, date) => api.get(`/api/agents/analyze/${locationId}/${date}`),
  getAIRecommendations: (date) => api.get(`/api/agents/recommendations/${date}`),
  getMyAIRecommendations: (date) => api.get(`/api/agents/recommendations/${date}/mine`),
  getAIRecommendationsSummary: (date) => api.get(`/api/agents/recommendations/${date}/summary`)
};

// Parking / reservations API
export const parkingService = {
  getAvailability: (date, locationId) =>
    api.get(`/api/parking/${date}/${locationId}`),
  listTrucks: (date, locationId) =>
    api.get(`/api/parking/${date}/${locationId}/trucks`),
  reserveSpot: (date, locationId, spotNumber) =>
    api.post(`/api/parking/${date}/${locationId}/reserve`, { spotNumber }),
  releaseSpot: (date, locationId) =>
    api.post(`/api/parking/${date}/${locationId}/release`)
};

export const reservationsService = {
  listMine: (date) => api.get('/api/reservations', { params: date ? { date } : {} })
};

// Payments (pay-as-you-go booking)
export const paymentsService = {
  getQuote: (date, locationId) => api.get('/api/payments/quote', { params: { date, locationId } }),
  createCheckout: ({ date, locationId, spotNumber }) => api.post('/api/payments/checkout', { date, locationId, spotNumber }),
  confirmSession: (sessionId) => api.get('/api/payments/confirm', { params: { sessionId } })
};

// Auth (food truck owner)
export const authService = {
  register: ({ email, password, truckName, cuisine, description, phone }) =>
    api.post('/api/auth/register', { email, password, truckName, cuisine, description, phone }),
  login: ({ email, password }) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me')
};

// Trucks (public + owner)
export const truckService = {
  getTruck: (truckId) => api.get(`/api/trucks/${truckId}`),
  getMyProfile: () => api.get('/api/trucks/me/profile'),
  getMyMenu: () => api.get('/api/trucks/me/menu'),
  addMyMenuItem: ({ name, price, currency = 'EUR', description = null }) =>
    api.post('/api/trucks/me/menu', { name, price, currency, description }),
  deleteMyMenuItem: (itemId) => api.delete(`/api/trucks/me/menu/${itemId}`)
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
