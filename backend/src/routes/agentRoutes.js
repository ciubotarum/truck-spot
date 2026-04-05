const express = require('express');
const router = express.Router();
const AgenticOrchestrator = require('../agents/AgenticOrchestrator');
const CacheManager = require('../services/CacheManager');

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
    cachingEnabled: true,
    cachingDescription: 'Hybrid cache with TTL and data hash validation',
    apiKeyConfigured: !!apiKey,
    timestamp: new Date().toISOString()
  });
});

router.get('/cache/stats', (req, res) => {
  const stats = CacheManager.getStats();
  res.json({
    success: true,
    cacheStats: stats,
    timestamp: new Date().toISOString()
  });
});

router.post('/cache/clear', (req, res) => {
  const { date } = req.body;
  
  if (date) {
    CacheManager.clear(date);
    res.json({
      success: true,
      message: `Cache cleared for date: ${date}`,
      timestamp: new Date().toISOString()
    });
  } else {
    CacheManager.clear();
    res.json({
      success: true,
      message: 'All cache cleared',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/recommendations/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const mockData = require('../data/mockLocations.json');
    const mockLocations = Array.isArray(mockData) ? mockData : mockData.locations;

    const startTime = Date.now();
    const result = await orchestrator.analyzeWithAgenticAI(mockLocations, date);
    const duration = Date.now() - startTime;

    // Check if result came from cache
    const cachedResult = CacheManager.get(date);
    const isFromCache = cachedResult !== null;

    res.json({
      ...result,
      cached: isFromCache,
      processingTimeMs: duration
    });
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
