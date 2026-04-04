const express = require('express');
const router = express.Router();
const AgenticOrchestrator = require('../agents/AgenticOrchestrator');

const apiKey = process.env.GROQ_API_KEY;
const orchestrator = new AgenticOrchestrator(apiKey);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    type: 'agentic_ai_system',
    orchestrator: 'AgenticOrchestrator',
    aiProvider: 'Groq',
    model: 'llama-3.1-8b-instant',
    agents: [
      {
        name: 'Demand Agent',
        provider: 'Groq',
        purpose: 'Analyze demand factors (foot traffic, events)',
        type: 'AI'
      },
      {
        name: 'Context Agent',
        provider: 'Groq',
        purpose: 'Analyze context factors (weather, competition)',
        type: 'AI'
      },
      {
        name: 'Revenue Calculator',
        purpose: 'Calculate revenue projections',
        type: 'Deterministic'
      },
      {
        name: 'Explanation Generator',
        purpose: 'Generate human-readable explanations',
        type: 'Deterministic'
      }
    ],
    agenticCapabilities: {
      autonomousDecisionMaking: true,
      dynamicAgentSelection: true,
      confidenceBasedCompletion: true,
      adaptivePipelineExecution: true
    },
    apiKeyConfigured: !!apiKey,
    timestamp: new Date().toISOString()
  });
});

router.get('/recommendations/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const mockData = require('../data/mockLocations.json');
    const mockLocations = Array.isArray(mockData) ? mockData : mockData.locations;

    const result = await orchestrator.analyzeWithAgenticAI(mockLocations, date);
    
    res.json(result);
  } catch (error) {
    console.error('[ROUTE ERROR] /recommendations:', error.message);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
