# TruckSpot - Step-by-Step Setup Guide

## Quick Start (5-10 minutes)

This guide will walk you through setting up the entire TruckSpot MVP from scratch.

---

## Prerequisites Checklist

- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Hugging Face API key ([Get one here](https://huggingface.co/settings/tokens))
- [ ] VS Code or preferred code editor
- [ ] Windows Terminal or PowerShell ready

---

## Part 1: Initialize Project Structure

### Step 1.1: Setup Git Repository

```bash
cd c:\Users\MihaelaCiubotaru\repos\truck-spot

# Initialize git
git init

# Create initial commit
git add README.md
git commit -m "Initial commit: Project structure"
```

### Step 1.2: Create Root .gitignore

Create file `c:\Users\MihaelaCiubotaru\repos\truck-spot\.gitignore`:

```
# Dependencies
node_modules/
/.env
/.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log*

# Package manager
package-lock.json
yarn.lock
```

---

## Part 2: Backend Setup (Node.js + Express)

### Step 2.1: Create Backend Directory & Initialize

```bash
# Create backend folder
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express cors dotenv axios body-parser
npm install --save-dev nodemon
```

### Step 2.2: Create Backend Directory Structure

```bash
# From backend directory
mkdir src
mkdir src/routes
mkdir src/controllers
mkdir src/services
mkdir src/agents
mkdir src/data
mkdir src/middleware
mkdir src/utils
```

### Step 2.3: Create Backend Files

**Create `backend/.env`:**
```
# Server Configuration
PORT=5000
NODE_ENV=development

# Hugging Face API
HUGGING_FACE_API_KEY=your_api_key_here

# CORS
CORS_ORIGIN=http://localhost:5173

# Weather API (optional)
WEATHER_API_KEY=optional_key
```

**Create `backend/package.json` - Update scripts section:**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**Create `backend/server.js`:**
```javascript
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TruckSpot Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
```

**Create `backend/src/app.js`:**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'TruckSpot Backend'
  });
});

// API Routes (will be added)
app.use('/api/locations', require('./routes/locations'));
app.use('/api/recommendations', require('./routes/recommendations'));

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
```

### Step 2.4: Create Mock Data Files

**Create `backend/src/data/mockLocations.json`:**
```json
{
  "locations": [
    {
      "id": "loc_downtown_high_street",
      "name": "Downtown High Street",
      "lat": 44.4268,
      "lng": 26.1025,
      "zone": "downtown",
      "capacity": "high",
      "baseScore": 0.85,
      "type": "business_district",
      "parkingSpots": 15
    },
    {
      "id": "loc_university_square",
      "name": "University Square",
      "lat": 44.4397,
      "lng": 26.0996,
      "zone": "university",
      "capacity": "very_high",
      "baseScore": 0.90,
      "type": "student_area",
      "parkingSpots": 8
    },
    {
      "id": "loc_central_park",
      "name": "Central Park Area",
      "lat": 44.4506,
      "lng": 26.0979,
      "zone": "parks",
      "capacity": "medium",
      "baseScore": 0.75,
      "type": "recreational",
      "parkingSpots": 12
    },
    {
      "id": "loc_market_square",
      "name": "Market Square",
      "lat": 44.4268,
      "lng": 26.1100,
      "zone": "market",
      "capacity": "high",
      "baseScore": 0.82,
      "type": "commerce",
      "parkingSpots": 10
    },
    {
      "id": "loc_beach_area",
      "name": "Beach Promenade",
      "lat": 44.4000,
      "lng": 26.0800,
      "zone": "waterfront",
      "capacity": "medium",
      "baseScore": 0.78,
      "type": "leisure",
      "parkingSpots": 20
    }
  ]
}
```

**Create `backend/src/data/mockFootTraffic.json`:**
```json
{
  "footTraffic": [
    {
      "locationId": "loc_downtown_high_street",
      "date": "2026-04-04",
      "hour": "12",
      "peakHours": ["12", "13", "18", "19"],
      "estimatedPedestrians": 850,
      "trafficTrend": "rising"
    },
    {
      "locationId": "loc_university_square",
      "date": "2026-04-04",
      "hour": "14",
      "peakHours": ["11", "12", "14", "15", "18", "19"],
      "estimatedPedestrians": 1200,
      "trafficTrend": "peak"
    },
    {
      "locationId": "loc_market_square",
      "date": "2026-04-04",
      "hour": "10",
      "peakHours": ["10", "11", "16", "17"],
      "estimatedPedestrians": 650,
      "trafficTrend": "stable"
    }
  ]
}
```

**Create `backend/src/data/mockEvents.json`:**
```json
{
  "events": [
    {
      "id": "evt_spring_festival",
      "name": "Spring Food Festival",
      "date": "2026-04-04",
      "location": "Central Park Area",
      "locationId": "loc_central_park",
      "startTime": "10:00",
      "endTime": "22:00",
      "expectedAttendance": 5000,
      "description": "Annual spring food festival with local vendors",
      "category": "festival",
      "relevanceScore": 0.95,
      "impact": "very_high"
    },
    {
      "id": "evt_farmers_market",
      "name": "Weekly Farmers Market",
      "date": "2026-04-04",
      "location": "Market Square",
      "locationId": "loc_market_square",
      "startTime": "08:00",
      "endTime": "14:00",
      "expectedAttendance": 2000,
      "description": "Fresh produce and local goods market",
      "category": "market",
      "relevanceScore": 0.80,
      "impact": "high"
    }
  ]
}
```

**Create `backend/src/data/mockCompetition.json`:**
```json
{
  "competitors": [
    {
      "id": "comp_pizza_wagon",
      "name": "Pizza Wagon",
      "locationId": "loc_downtown_high_street",
      "cuisineType": "pizza",
      "rating": 4.5,
      "reviews": 120,
      "priceRange": "$$",
      "active": true
    },
    {
      "id": "comp_taco_street",
      "name": "Taco Street",
      "locationId": "loc_university_square",
      "cuisineType": "mexican",
      "rating": 4.3,
      "reviews": 95,
      "priceRange": "$",
      "active": true
    },
    {
      "id": "comp_burger_king_mobile",
      "name": "Burger King Mobile",
      "locationId": "loc_central_park",
      "cuisineType": "american",
      "rating": 4.0,
      "reviews": 200,
      "priceRange": "$$",
      "active": true
    }
  ]
}
```

**Create `backend/src/data/weatherData.json`:**
```json
{
  "weather": [
    {
      "date": "2026-04-04",
      "temperature": 18,
      "condition": "sunny",
      "humidity": 65,
      "windSpeed": 12,
      "uvIndex": 6,
      "perception": "ideal",
      "trafficImpact": 1.1
    }
  ]
}
```

### Step 2.5: Create Backend Routes

**Create `backend/src/routes/locations.js`:**
```javascript
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/', locationController.getAllLocations);
router.get('/:id', locationController.getLocationById);
router.get('/nearby/:lat/:lng', locationController.getNearbyLocations);

module.exports = router;
```

**Create `backend/src/routes/recommendations.js`:**
```javascript
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/:date', recommendationController.getDailyRecommendations);
router.post('/analyze', recommendationController.analyzeAndRecommend);

module.exports = router;
```

### Step 2.6: Create Backend Controllers

**Create `backend/src/controllers/locationController.js`:**
```javascript
const locations = require('../data/mockLocations.json');

exports.getAllLocations = (req, res) => {
  try {
    res.json({
      success: true,
      data: locations.locations,
      count: locations.locations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLocationById = (req, res) => {
  try {
    const { id } = req.params;
    const location = locations.locations.find(loc => loc.id === id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNearbyLocations = (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = req.query.radius || 2; // km
    
    const nearby = locations.locations.filter(loc => {
      const distance = Math.sqrt(
        Math.pow(loc.lat - lat, 2) + Math.pow(loc.lng - lng, 2)
      ) * 111; // Convert to km
      return distance <= radius;
    });
    
    res.json({
      success: true,
      data: nearby,
      count: nearby.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
```

**Create `backend/src/controllers/recommendationController.js`:**
```javascript
const scoringService = require('../services/scoringService');

exports.getDailyRecommendations = async (req, res) => {
  try {
    const { date } = req.params;
    const recommendations = await scoringService.scoreAllLocations(date);
    
    const topThree = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((rec, index) => ({
        rank: index + 1,
        ...rec
      }));
    
    res.json({
      success: true,
      date,
      recommendations: topThree
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.analyzeAndRecommend = async (req, res) => {
  try {
    const { date, foodTruckType } = req.body;
    const recommendations = await scoringService.scoreAllLocations(date, foodTruckType);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
```

### Step 2.7: Create Scoring Service

**Create `backend/src/services/scoringService.js`:**
```javascript
const locations = require('../data/mockLocations.json');
const footTraffic = require('../data/mockFootTraffic.json');
const events = require('../data/mockEvents.json');
const competition = require('../data/mockCompetition.json');
const weather = require('../data/weatherData.json');

const scoreAllLocations = async (date, foodTruckType = null) => {
  return locations.locations.map(location => {
    const footTrafficData = footTraffic.footTraffic.find(
      ft => ft.locationId === location.id && ft.date === date
    ) || { estimatedPedestrians: 0 };
    
    const locationEvents = events.events.filter(
      evt => evt.locationId === location.id && evt.date === date
    );
    
    const locationCompetition = competition.competitors.filter(
      comp => comp.locationId === location.id
    );
    
    const weatherData = weather.weather.find(w => w.date === date) || { trafficImpact: 1 };
    
    // Calculate score components
    const trafficScore = Math.min(1, footTrafficData.estimatedPedestrians / 1000) * 0.35;
    const eventScore = (locationEvents.length > 0 ? 0.3 : 0) + 
                       (locationEvents.reduce((sum, e) => sum + e.relevanceScore, 0) / 
                       (locationEvents.length || 1)) * 0.25;
    const competitionScore = (1 - (locationCompetition.length * 0.15)) * 0.2;
    const baseScore = location.baseScore * 0.2;
    const weatherScore = weatherData.trafficImpact * 0.05;
    
    const totalScore = (trafficScore + eventScore + competitionScore + baseScore + weatherScore);
    
    const estimatedRevenue = totalScore * 150 * (location.capacity === 'high' ? 1.2 : 1) *
                            (location.capacity === 'very_high' ? 1.3 : 1);
    
    return {
      locationId: location.id,
      locationName: location.name,
      score: parseFloat(totalScore.toFixed(2)),
      estimatedRevenue: parseInt(estimatedRevenue),
      confidence: 'medium',
      footTraffic: footTrafficData.estimatedPedestrians,
      eventsCount: locationEvents.length,
      competitionCount: locationCompetition.length,
      reasons: [
        footTrafficData.estimatedPedestrians > 500 ? '✓ High foot traffic' : '',
        locationEvents.length > 0 ? '✓ Local events today' : '',
        locationCompetition.length === 0 ? '✓ No direct competition' : '',
        weatherData.trafficImpact > 1 ? '✓ Favorable weather' : ''
      ].filter(r => r),
      riskLevel: totalScore > 0.7 ? 'low' : totalScore > 0.5 ? 'medium' : 'high'
    };
  });
};

module.exports = { scoreAllLocations };
```

### Step 2.8: Test Backend

```bash
# From backend directory
npm run dev

# In another terminal, test the endpoints:
# GET http://localhost:5000/health
# GET http://localhost:5000/api/locations
# GET http://localhost:5000/api/recommendations/2026-04-04
```

---

## Part 3: Frontend Setup (React + Vite)

### Step 3.1: Create React + Vite Project

```bash
# From root truck-spot directory
npm create vite@latest frontend -- --template react

# Navigate to frontend
cd frontend

# Install dependencies
npm install
npm install leaflet react-leaflet axios react-router-dom bootstrap
npm install --save-dev tailwindcss postcss autoprefixer
```

### Step 3.2: Create Frontend Directory Structure

```bash
# From frontend directory
mkdir src/components
mkdir src/pages
mkdir src/services
mkdir src/hooks
mkdir src/assets
mkdir public/assets
```

### Step 3.2.1: Add Logo and Motto

Copy your logo to `frontend/public/assets/logo.png`

Create `frontend/public/assets/motto.json`:
```json
{
  "motto": "Intelligent Location Analytics for Food Trucks",
  "tagline": "Maximize your revenue with data-driven decisions"
}
```

### Step 3.3: Create Frontend Files

**Create `frontend/.env`:**
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=TruckSpot
```

**Create `frontend/src/services/api.js`:**
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export const locationService = {
  getAllLocations: () => api.get('/locations'),
  getLocationById: (id) => api.get(`/locations/${id}`),
  getNearbyLocations: (lat, lng, radius) => 
    api.get(`/locations/nearby/${lat}/${lng}?radius=${radius}`),
};

export const recommendationService = {
  getDailyRecommendations: (date) => api.get(`/recommendations/${date}`),
  analyzeAndRecommend: (data) => api.post('/recommendations/analyze', data),
};

export default api;
```

**Create `frontend/src/components/MapComponent.jsx`:**
```jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { locationService } from '../services/api';

const MapComponent = ({ onLocationSelect }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  useEffect(() => {
    locationService.getAllLocations()
      .then(res => {
        setLocations(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load locations:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">Loading map...</div>;

  const center = locations[0] ? [locations[0].lat, locations[0].lng] : [44.4, 26.1];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {locations.map(location => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={customIcon}
          onClick={() => onLocationSelect(location)}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{location.name}</h3>
              <p>Zone: {location.zone}</p>
              <p>Score: {location.baseScore}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
```

**Create `frontend/src/components/RecommendationCard.jsx`:**
```jsx
import React from 'react';

const RecommendationCard = ({ recommendation, rank }) => {
  const getRiskStyle = (risk) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0 hover-shadow transition">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex gap-2 align-items-center">
            <span className="badge bg-primary rounded-circle" style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              #{rank}
            </span>
            <h6 className="card-title mb-0">{recommendation.locationName}</h6>
          </div>
          <span className={`badge bg-${getRiskStyle(recommendation.riskLevel)}`}>
            {recommendation.riskLevel.toUpperCase()}
          </span>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-4 text-center">
            <small className="text-muted d-block">Score</small>
            <h5 className="text-primary mb-0">{recommendation.score}</h5>
          </div>
          <div className="col-4 text-center">
            <small className="text-muted d-block">Revenue</small>
            <h5 className="text-success mb-0">€{recommendation.estimatedRevenue}</h5>
          </div>
          <div className="col-4 text-center">
            <small className="text-muted d-block">Traffic</small>
            <h5 className="text-warning mb-0">{recommendation.footTraffic}</h5>
          </div>
        </div>

        <div className="mb-3">
          <small className="fw-bold text-muted d-block mb-2">Why this location?</small>
          <ul className="list-unstyled">
            {recommendation.reasons.map((reason, idx) => (
              <li key={idx} className="small text-muted">{reason}</li>
            ))}
          </ul>
        </div>

        <button className="btn btn-primary w-100 btn-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;
```

**Create `frontend/src/pages/Home.jsx`:**
```jsx
import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import RecommendationCard from '../components/RecommendationCard';
import { recommendationService } from '../services/api';
import motto from '/assets/motto.json';

const Home = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await recommendationService.getDailyRecommendations(date);
      setRecommendations(res.data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <nav className="navbar navbar-dark bg-primary mb-4">
        <div className="container-lg">
          <div className="d-flex align-items-center gap-3">
            <img 
              src="/assets/logo.png" 
              alt="TruckSpot Logo" 
              style={{ height: '50px', width: 'auto' }} 
            />
            <div>
              <h1 className="navbar-brand fs-3 mb-0">🚚 TruckSpot</h1>
              <small className="text-light">{motto.tagline}</small>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-lg py-4">
        <div className="row mb-4 g-3">
          {/* Map */}
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">📍 Location Map</h5>
                <MapComponent onLocationSelect={setSelectedLocation} />
              </div>
            </div>
          </div>

          {/* Selected Location Info */}
          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">📌 Selected Location</h5>
                {selectedLocation ? (
                  <div>
                    <h6 className="card-subtitle mb-2 fw-bold">{selectedLocation.name}</h6>
                    <small className="text-muted d-block"><strong>Zone:</strong> {selectedLocation.zone}</small>
                    <small className="text-muted d-block"><strong>Capacity:</strong> {selectedLocation.capacity}</small>
                    <small className="text-muted d-block"><strong>Base Score:</strong> {selectedLocation.baseScore}</small>
                    <small className="text-muted d-block"><strong>Parking Spots:</strong> {selectedLocation.parkingSpots}</small>
                  </div>
                ) : (
                  <small className="text-muted">Click on a location on the map</small>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Recommendations */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">⭐ Top Recommendations for {date}</h5>
            <p className="text-muted mb-4">Based on foot traffic, events, weather, and competition analysis</p>

            {loading ? (
              <p className="text-muted">Loading recommendations...</p>
            ) : recommendations.length > 0 ? (
              <div className="row g-3">
                {recommendations.map((rec, idx) => (
                  <div key={rec.locationId} className="col-md-4">
                    <RecommendationCard recommendation={rec} rank={idx + 1} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No recommendations available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
```

**Create `frontend/src/App.jsx`:**
```jsx
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './pages/Home';
import './App.css';

function App() {
  return <Home />;
}

export default App;
```

**Create `frontend/src/App.css`:**
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 3.4: Update Vite Config

**Edit `frontend/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
})
```

### Step 3.5: Test Frontend

```bash
# From frontend directory
npm run dev

# Frontend will be available at http://localhost:5173
```

---

## Part 4: Running the Complete Stack

### Terminal 1: Start Backend

```bash
cd c:\Users\MihaelaCiubotaru\repos\truck-spot\backend
npm run dev
# Backend running on http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
cd c:\Users\MihaelaCiubotaru\repos\truck-spot\frontend
npm run dev
# Frontend running on http://localhost:5173
```

### Expected Output

- Visit `http://localhost:5173` in your browser
- You should see:
  - TruckSpot header
  - Interactive map with 5 food truck friendly locations
  - Top 3 recommendations for today
  - Revenue predictions for each location

---

## Part 5: Next Steps - Hugging Face Integration

### Step 5.1: Create Hugging Face Service

**Create `backend/src/services/huggingFaceService.js`:**
```javascript
const axios = require('axios');

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

const analyzeEventSentiment = async (eventDescription) => {
  try {
    const response = await axios.post(
      `${HF_API_URL}/nlptown/bert-base-multilingual-uncased-sentiment`,
      { inputs: eventDescription },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return null;
  }
};

const classifyEventType = async (eventName) => {
  try {
    const response = await axios.post(
      `${HF_API_URL}/facebook/bart-large-mnli`,
      {
        inputs: eventName,
        parameters: {
          candidate_labels: ['food_festival', 'market', 'concert', 'sports', 'general']
        }
      },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Classification error:', error);
    return null;
  }
};

module.exports = {
  analyzeEventSentiment,
  classifyEventType
};
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process using port 5000 (Windows)
taskkill /PID <PID> /F
```

### Frontend won't connect to backend
- Check CORS is enabled in `backend/src/app.js`
- Verify `VITE_API_URL` in `frontend/.env`
- Check both servers are running

### API calls failing
- Ensure Hugging Face API key is set in `backend/.env`
- Check network requests in browser DevTools (Network tab)
- Review backend logs for errors

---

## Success Checklist

- [ ] Both backend and frontend are running
- [ ] Map displays 5 locations correctly
- [ ] Top 3 recommendations appear on homepage
- [ ] Revenue predictions are calculated
- [ ] Mock data is being used
- [ ] No CORS errors in console
- [ ] Recommendation scores are between 0-1

---

## Next Phase: Advanced Features

Once MVP is working:
1. Connect real weather API
2. Integrate actual HuggingFace models
3. Build agent system for complex recommendations
4. Add user authentication
5. Implement database (PostgreSQL)
6. Add real-time updates

---

**Last Updated:** April 4, 2026
**Status:** Ready for deployment
