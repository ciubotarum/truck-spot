import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

// Auth (food truck owner)
export const authService = {
  register: ({ email, password, truckName, cuisine, description, phone }) =>
    api.post('/api/auth/register', { email, password, truckName, cuisine, description, phone }),
  login: ({ email, password }) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me')
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
