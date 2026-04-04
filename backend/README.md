# TruckSpot Backend

Node.js + Express REST API server for TruckSpot - Intelligent location recommendation system for food trucks.

## Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

```bash
# From the backend directory
npm install
```

### Configuration

```bash
# Copy the example env file and update with your values
cp .env.example .env
```

Edit `.env` with:
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
HUGGING_FACE_API_KEY=your_key_here
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

---

## Project Structure

```
backend/
├── src/
│   ├── routes/           # API route definitions
│   ├── controllers/       # Route handlers
│   ├── services/         # Business logic (scoring, AI)
│   ├── agents/           # AI agents (future)
│   ├── data/             # Mock JSON data
│   ├── middleware/       # Express middleware
│   ├── utils/            # Helper functions & constants
│   └── app.js            # Express app config
├── server.js             # Server entry point
├── package.json
└── .env.example
```

---

## API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", service: "TruckSpot Backend" }
```

### Locations
```
GET /api/locations                    # Get all locations
GET /api/locations/:id                # Get location by ID
GET /api/locations/nearby/:lat/:lng?radius=2  # Get nearby locations
```

**Example:**
```bash
curl http://localhost:5000/api/locations
curl http://localhost:5000/api/locations/loc_downtown_high_street
curl "http://localhost:5000/api/locations/nearby/44.4268/26.1025?radius=2"
```

### Recommendations
```
GET /api/recommendations/:date             # Get daily recommendations
POST /api/recommendations/analyze          # Custom analysis
```

**Example:**
```bash
curl http://localhost:5000/api/recommendations/2026-04-04
curl -X POST http://localhost:5000/api/recommendations/analyze \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-04-04", "foodTruckType": "pizza"}'
```

---

## Mock Data

All data is in JSON format in `src/data/`:

- **mockLocations.json** - 5 food truck-friendly zones
- **mockFootTraffic.json** - Pedestrian volume by location/time
- **mockEvents.json** - Local events with impact data
- **mockCompetition.json** - Competitors at each location
- **weatherData.json** - Weather conditions and impact

### Adding More Data

Simply edit the JSON files or add new ones:

```json
// Example: Add new location to mockLocations.json
{
  "locations": [
    {
      "id": "loc_new_area",
      "name": "New Area Name",
      "lat": 44.4268,
      "lng": 26.1025,
      "zone": "new_zone",
      "capacity": "high",
      "baseScore": 0.80,
      "parkingSpots": 15
    }
  ]
}
```

---

## Scoring Algorithm

Location scores are calculated from:

- **Traffic (35%)** - Pedestrian volume
- **Events (30%)** - Local events and relevance
- **Competition (20%)** - Number and rating of competitors
- **Base Score (10%)** - Location quality baseline
- **Weather (5%)** - Weather conditions impact

Final score: 0-1 (higher is better)

Risk levels:
- **Low Risk** - Score > 0.7
- **Medium Risk** - Score 0.5-0.7
- **High Risk** - Score < 0.5

---

## Services

### Scoring Service
```javascript
const { scoreAllLocations } = require('./services/scoringService');

// Score all locations for a date
const recommendations = await scoreAllLocations('2026-04-04', 'pizza');
```

### Hugging Face Integration (Optional)
```javascript
const { analyzeEventSentiment } = require('./services/huggingFaceService');

// Analyze event sentiment
const result = await analyzeEventSentiment('Great outdoor festival!');
```

---

## Testing Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get all locations
curl http://localhost:5000/api/locations

# Get recommendations
curl http://localhost:5000/api/recommendations/2026-04-04

# Custom analysis
curl -X POST http://localhost:5000/api/recommendations/analyze \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-04-04","foodTruckType":"pizza"}'
```

### Using Postman/Thunder Client

1. Import the endpoints above
2. Set `BASE_URL = http://localhost:5000`
3. Send requests

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | Environment (development/production) |
| `CORS_ORIGIN` | No | Frontend URL for CORS |
| `HUGGING_FACE_API_KEY` | No | For AI features (optional) |

---

## Performance Tips

1. **Cache Results** - Cache scoring results for same date
2. **Batch Requests** - Get all locations at once instead of individual calls
3. **Limit Distance** - Use reasonable radius values for nearby searches

---

## Future Enhancements

- [ ] Database integration (PostgreSQL)
- [ ] Real API connections (weather, events, maps)
- [ ] Advanced ML models via Hugging Face
- [ ] WebSocket for real-time updates
- [ ] User authentication
- [ ] Historical analytics

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Errors
Check `.env` - `CORS_ORIGIN` should match frontend URL

### API Key Issues
Set `HUGGING_FACE_API_KEY` in `.env` for AI features

## Support

For issues or questions, check the main [README.md](../README.md)

---

**Version**: 1.0.0  
**Last Updated**: April 4, 2026
