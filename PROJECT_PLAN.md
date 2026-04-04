# TruckSpot - MVP Project Plan

## 1. Project Overview

**Project Name:** TruckSpot  
**Goal:** Intelligent location recommendation system for food truck owners to maximize revenue
**MVP Timeline:** Phase-based development

### Description
TruckSpot combines AI analysis with real-time data to recommend optimal parking locations for food truck owners. By analyzing foot traffic patterns, local events, weather conditions, and competition, the system provides actionable insights and revenue predictions to help entrepreneurs make data-driven decisions.

---

## 2. Tech Stack Breakdown

### Frontend
- **React + Vite** - Fast, modern UI framework
- **Leaflet** - Interactive maps for location visualization
- **State Management** - TBD (Context API or Redux)
- **HTTP Client** - Axios or Fetch API
- **Styling** - Bootstrap 5 (responsive UI framework)

### Backend
- **Node.js + Express** - REST API server
- **Port** - 5000 (default, configurable)
- **Database** - JSON mock data (MVP only, no database required)
- **Environment Variables** - .env configuration

### AI/ML Integration
- **Hugging Face API** - NLP analysis for events, reviews, sentiment
- **Agent System** - Agentic AI for multi-step decision making
  - Location scoring agent
  - Revenue prediction agent
  - Optimization agent

### Additional Tools
- **Geolocation API** - For user positioning
- **Weather API** - Real-time weather data (OpenWeatherMap or similar)
- **Git** - Version control

---

## 3. MVP Features

### Phase 1: MVP Core (Weeks 1-2)
- [ ] **Location Map View**
  - Display city areas with Leaflet
  - Show food truck-friendly zones
  - Color-coded zones by demand/revenue potential

- **Mock Data System** (JSON only, no database)
  - mockLocations.json with 5+ food truck-friendly zones
  - mockFootTraffic.json with pedestrian volume data
  - mockEvents.json with daily events
  - mockCompetition.json with competitor data
  - weatherData.json with weather conditions

- **Basic AI Analysis**
  - Hugging Face API integration for sentiment/event analysis
  - Simple scoring algorithm
  - Revenue estimation based on metrics

- **Recommendation Engine**
  - Top 3 location recommendations per day
  - Revenue prediction for each location
  - Risk assessment (low/medium/high)

- **Branding & UI**
  - Logo and motto displayed in header
  - Bootstrap 5 responsive design
  - Professional, user-friendly interface

### Phase 2: Enhanced Features
- [ ] **User Authentication** (JWT, OAuth)
- [ ] **Food Truck Profile Management**
- [ ] **Real Database Integration** (PostgreSQL or MongoDB)
- [ ] **Real-time Updates** (WebSocket)
- [ ] **Competitor Monitoring & Alerts**

### Phase 3: Advanced Features
- [ ] **Multi-city Support**
- [ ] **Advanced Predictive Modeling** (ML models)
- [ ] **Integration with Real APIs** (OpenWeather, Google Maps, event platforms)
- [ ] **Mobile App** (React Native)
- [ ] **Advanced Analytics Dashboard** (historical trends, seasonal patterns)

---

## 4. Project Structure

```
truck-spot/
├── frontend/                      # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapComponent.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Map.jsx
│   │   │   └── Details.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   │   └── useLocationData.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── assets/
│   │   │   ├── logo.png                 # TruckSpot logo
│   │   │   └── motto.json               # TruckSpot motto/tagline
│   │   └── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend/                       # Node.js + Express server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── locations.js
│   │   │   ├── recommendations.js
│   │   │   └── analytics.js
│   │   ├── controllers/
│   │   │   ├── locationController.js
│   │   │   ├── recommendationController.js
│   │   │   └── aiController.js
│   │   ├── services/
│   │   │   ├── huggingFaceService.js
│   │   │   ├── scoringService.js
│   │   │   ├── agentService.js
│   │   │   └── weatherService.js
│   │   ├── agents/
│   │   │   ├── locationScorrerAgent.js
│   │   │   ├── revenuePredictionAgent.js
│   │   │   └── optimizationAgent.js
│   │   ├── data/
│   │   │   ├── mockLocations.json
│   │   │   ├── mockFootTraffic.json
│   │   │   ├── mockEvents.json
│   │   │   ├── mockCompetition.json
│   │   │   └── weatherData.json
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── logger.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── PROJECT_PLAN.md               # This file
├── README.md
├── .gitignore
└── setup-guide.md                # Step-by-step setup instructions
```

---

## 5. Setup & Installation Steps

### Prerequisites
- Node.js v16+ and npm/yarn
- Git
- Code editor (VS Code recommended)
- Hugging Face API key

### Installation Phases

#### Phase A: Project Setup
1. [ ] Initialize Git repository
2. [ ] Create root directory structure
3. [ ] Setup .gitignore

#### Phase B: Backend Setup
1. [ ] Create backend directory
2. [ ] Initialize Node.js project (`npm init`)
3. [ ] Install dependencies:
   - express
   - cors
   - dotenv
   - axios (for Hugging Face API)
   - body-parser
4. [ ] Create .env file with API keys
5. [ ] Setup Express server (server.js)
6. [ ] Create data directory with mock JSON files

#### Phase C: Frontend Setup
1. [ ] Create React + Vite project (`npm create vite@latest frontend -- --template react`)
2. [ ] Install dependencies:
   - react
   - react-router-dom
   - axios
   - leaflet
   - react-leaflet
   - tailwindcss (or CSS preferred)
3. [ ] Create .env file with API endpoints
4. [ ] Setup folder structure (components, pages, services)

#### Phase D: Integration
1. [ ] Connect frontend to backend API
2. [ ] Setup Hugging Face API integration
3. [ ] Test end-to-end flow

---

## 6. Development Phases

### Phase 1: MVP Foundation (Sprint 1-2)

**Backend Tasks:**
- [ ] Create Express server with health check endpoint
- [ ] Setup mock JSON data structure
- [ ] Create `/api/locations` endpoint (GET)
- [ ] Create `/api/recommendations` endpoint (GET)
- [ ] Integrate Hugging Face API for event analysis
- [ ] Create location scoring algorithm
- [ ] Implement revenue estimation logic

**Frontend Tasks:**
- [ ] Create Map Component (Leaflet integration)
- [ ] Create Location Dashboard
- [ ] Display recommendations list
- [ ] Show revenue predictions
- [ ] Basic styling

**AI/Agent Tasks:**
- [ ] Design location scorer agent
- [ ] Design revenue prediction agent
- [ ] Implement agent orchestration

---

### Phase 2: Polish & Testing (Sprint 3)
- [ ] Error handling & logging
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Documentation

### Phase 3: Deployment Ready
- [ ] Environment configuration
- [ ] Production build
- [ ] Deployment setup (Vercel/Netlify for frontend, Heroku/Railway for backend)

---

## 7. Key Integration Points

### Hugging Face API Usage
- **Zero-shot classification** for event categorization
- **Sentiment analysis** for review analysis
- **Named Entity Recognition** for location/business names
- **Text summarization** for event descriptions

### Agentic AI System
1. **Location Scorer Agent**
   - Input: Location ID, date, weather, events
   - Output: Location score (0-100)

2. **Revenue Prediction Agent**
   - Input: Location score, foot traffic, competition
   - Output: Estimated revenue range

3. **Optimization Agent**
   - Input: All location data
   - Output: Top 3 recommended locations

### API Endpoints (Backend)

**Locations**
```
GET /api/locations                 # Get all locations
GET /api/locations/:id             # Get specific location
GET /api/locations/nearby/:lat/:lng # Get nearby locations
```

**Recommendations**
```
GET /api/recommendations/:date     # Get daily recommendations
GET /api/recommendations/:date/:foodTruckType
POST /api/recommendations/analyze  # Trigger AI analysis
```

**Analytics**
```
GET /api/analytics/revenue/:period # Historical revenue data
GET /api/analytics/trends          # Trend analysis
```

---

## 8. Mock Data Structure

### mockLocations.json
```json
{
  "locations": [
    {
      "id": "loc_1",
      "name": "Downtown High Street",
      "lat": 44.4268,
      "lng": 26.1025,
      "zone": "downtown",
      "capacity": "high",
      "baseScore": 0.75
    }
  ]
}
```

### mockFootTraffic.json
```json
{
  "traffic": [
    {
      "locationId": "loc_1",
      "date": "2026-04-04",
      "peakHours": "12:00-14:00, 18:00-20:00",
      "trafficVolume": 1500,
      "trafficScore": 0.82
    }
  ]
}
```

### mockEvents.json
```json
{
  "events": [
    {
      "id": "evt_1",
      "name": "Spring Festival",
      "date": "2026-04-04",
      "location": "Downtown Park",
      "expectedAttendance": 5000,
      "relevanceScore": 0.9
    }
  ]
}
```

### mockCompetition.json
```json
{
  "competitors": [
    {
      "id": "comp_1",
      "name": "Pizza Wagon",
      "location": "loc_1",
      "type": "pizza",
      "rating": 4.5
    }
  ]
}
```

---

## 9. Testing Strategy

### Unit Tests
- Location scoring algorithm
- Revenue estimation logic
- Data validation

### Integration Tests
- API endpoints
- Hugging Face API calls
- Frontend-backend communication

### E2E Tests
- Complete user flow (map view → recommendation → details)
- Real-world scenarios

---

## 10. Success Metrics (MVP)

- [ ] All endpoints returning correct data
- [ ] Map displaying locations with accurate positioning
- [ ] Recommendations generated within 2 seconds
- [ ] Hugging Face API successfully analyzing events
- [ ] Revenue predictions within reasonable range
- [ ] UI responsive on desktop/mobile

---

## 11. Known Challenges & Solutions

### Challenge 1: Real-time Data Accuracy
- **Solution:** Start with mock data, migrate to real APIs in Phase 2

### Challenge 2: AI Agent Complexity
- **Solution:** Start simple (scoring algorithm), add complexity incrementally

### Challenge 3: Leaflet Map Performance
- **Solution:** Optimize by clustering locations, limiting visible data

---

## 12. Next Steps

1. ✅ **DONE:** Create this project plan document
2. **NEXT:** Create setup-guide.md with step-by-step installation
3. Initialize backend project
4. Initialize frontend project
5. Setup mock data files
6. Create basic Express server
7. Create basic React components
8. Integrate Hugging Face API
9. Implement location scoring system
10. Deploy and test MVP

---

## 13. Resources & References

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Leaflet Docs](https://leafletjs.com/)
- [Hugging Face API Docs](https://huggingface.co/docs/api/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)

---

**Last Updated:** April 4, 2026
**Project Status:** Planning Phase
**Next Review:** Before starting Phase 1 development
