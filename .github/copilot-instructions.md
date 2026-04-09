# TruckSpot — Copilot Workspace Instructions

## Architecture (What lives where)
- `backend/`: Node.js + Express API (CommonJS). Entry: `backend/server.js` → `backend/src/app.js`.
- `backend/src/agents/`: Groq-powered multi-agent analysis.
  - `AgenticOrchestrator` coordinates calls to `DemandAgent` + `ContextAgent` in parallel and then runs `RevenueCalculator`.
  - Cache: `backend/src/services/CacheManager.js` (in-memory Map, TTL + data-hash invalidation).
- `backend/src/routes/`:
  - `/api/locations/*` → location data from JSON.
  - `/api/recommendations/*` → deterministic scoring (`backend/src/services/scoringService.js`).
  - `/api/agents/*` → agentic AI recommendations (`backend/src/agents/AgenticOrchestrator.js`).
- `backend/src/data/`: mock JSON inputs (locations, foot traffic, events, competition, weather). These files are part of cache invalidation.
- `frontend/`: Vite + React + Bootstrap + Leaflet.
  - Home page calls `/api/agents/recommendations/:date` for AI recommendations and `/api/locations` for map markers.
  - API client: `frontend/src/services/api.js` (Axios, `import.meta.env.VITE_API_URL`).

## Local setup (Known-good)
- Backend env file: `backend/.env`
  - `PORT=5000`
  - `NODE_ENV=development`
  - `GROQ_API_KEY=...` (required for agentic endpoints)
  - `CORS_ORIGIN=http://localhost:5173`
- Frontend env file: `frontend/.env`
  - `VITE_API_URL=http://localhost:5000`

## Run commands
- Backend:
  - `cd backend`
  - `npm install`
  - `npm run dev`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Key API endpoints
- Backend health: `GET /health`
- Locations:
  - `GET /api/locations`
  - `GET /api/locations/:id`
  - `GET /api/locations/nearby/:lat/:lng?radius=2`
- Deterministic recommendations:
  - `GET /api/recommendations/:date`
  - `POST /api/recommendations/analyze`
- Agentic AI recommendations:
  - `GET /api/agents/health`
  - `GET /api/agents/recommendations/:date`
  - Cache utilities: `GET /api/agents/cache/stats`, `POST /api/agents/cache/clear`

## Project conventions (Important for edits)
- Backend uses CommonJS (`require`, `module.exports`). Keep this style unless explicitly migrating.
- Frontend uses ESM (`import/export`) and Vite env vars (`import.meta.env`).
- Date inputs are expected in `YYYY-MM-DD` (see deterministic recommendations route).
- Pay-as-you-go booking payments must always use RON (Stripe currency code `ron`). Do not introduce other currencies for booking fees.
- Mock data shapes vary in the code (sometimes arrays, sometimes `{ locations: [...] }`). If you change JSON structures, update consumers consistently.
- Cache invalidation depends on the contents of the JSON files under `backend/src/data/`. If you update mock data and still see old results, clear cache or wait for TTL.

## When debugging
- If AI endpoints fail, first confirm `GROQ_API_KEY` is set and backend is running.
- If frontend requests fail, confirm `frontend/.env` points at the backend base URL and `CORS_ORIGIN` matches the frontend URL.
