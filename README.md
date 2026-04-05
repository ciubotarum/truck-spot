# TruckSpot - AI-Powered Location Recommendation System

An intelligent location recommendation system for food trucks, powered by multi-agent AI architecture.

## Tech Stack

- **Frontend**: React + Vite + Bootstrap 5 + Leaflet (maps)
- **Backend**: Node.js + Express
- **AI**: Groq API (Llama 3.1 8B Instant)
- **Data**: Mock JSON files (locations, weather, events, etc.)

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Groq API key (get one at https://console.groq.com)

### 1. Clone the Project

```bash
git clone <repository-url>
cd truck-spot
```

### 2. Configure Environment Variables

Before starting the app, you need to set up your environment configuration.

**Create a `.env` file in the `backend/` directory:**

```bash
cd backend
```

**Add the following environment variables to `backend/.env`:**

```env
PORT=5000
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGIN=http://localhost:5173
```

- `GROQ_API_KEY`: Your API key from https://console.groq.com (required for AI agents to work)

### 3. Setup and Start Backend

```bash
# Navigate to backend (if not already there)
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

The backend will run at http://localhost:5000

### 4. Setup and Start Frontend

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at http://localhost:5173

### 5. Verify Setup

1. Backend should be running at http://localhost:5000
2. Frontend should be running at http://localhost:5173
3. Visit http://localhost:5000/api/agents/health to verify AI agents are configured

## Multi-Agent AI System Architecture

### How the Agents Work Together

![AI Agent Workflow Diagram](./out/docs/agentic-ai-flow/agentic-ai-flow.png)

## Agent Descriptions

### 1. AgenticOrchestrator
- **Type**: Agentic AI (AI-driven decision making)
- **Model**: Groq Llama 3.1 8B Instant
- **Role**: Coordinates the entire workflow
  - Decides which agents to call using LLM reasoning
  - Manages parallel execution of agents
  - Aggregates results and sorts by revenue

### 2. DemandAgent
- **Type**: AI Agent
- **Model**: Groq Llama 3.1 8B Instant
- **Inputs**: Location, foot traffic, events
- **Output**: Demand score (0-1) + AI reasoning text
- **Example Prompt**:
  ```
  Analyze location demand. Location: University Square.
  Foot traffic: 1200 people/hour.
  Events: University Career Fair.
  Rate demand on scale 0-100 and explain your reasoning:
  ```

### 3. ContextAgent
- **Type**: AI Agent
- **Model**: Groq Llama 3.1 8B Instant
- **Inputs**: Location, weather, competition, capacity
- **Output**: Context adjustment (0.5-1.5) + AI reasoning text
- **Example Prompt**:
  ```
  Context analysis for food truck location.
  Weather: sunny, Impact multiplier: 1.1x.
  Competition density: low.
  Location capacity: very_high.
  Rate risk adjustment factor (0.5-1.5) and explain:
  ```

## API Endpoints

### Health Check
```
GET /api/agents/health
```
Returns AI system status, configured agents, and capabilities.

### AI Recommendations
```
GET /api/agents/recommendations/:date
```
Returns AI-analyzed location recommendations sorted by revenue.

**Response Structure**:
```json
{
  "success": true,
  "type": "agentic_ai",
  "date": "2026-04-04",
  "orchestrator": "AgenticOrchestrator",
  "model": "llama-3.1-8b-instant",
  "totalLocationsAnalyzed": 5,
  "recommendations": [
    {
      "location": { ... },
      "agenticAnalysis": {
        "decisions": {
          "demand": {
            "agent": "DemandAgent",
            "analysis": "LLM reasoning text...",
            "demandScore": 0.95
          },
          "context": {
            "agent": "ContextAgent",
            "analysis": "LLM reasoning text...",
            "contextAdjustment": 1.2
          },
          "revenue": {
            "projectedDailyRevenue": 864
          }
        },
        "recommendation": {
          "riskLevel": "LOW",
          "revenue": 864
        }
      }
    }
  ]
}