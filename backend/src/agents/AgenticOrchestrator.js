const Groq = require('groq-sdk');
const DemandAgent = require('./DemandAgent');
const ContextAgent = require('./ContextAgent');
const RevenueCalculator = require('../services/RevenueCalculator');
const CacheManager = require('../services/CacheManager');

class AgenticOrchestrator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.groq = new Groq({ apiKey: apiKey });
    this.model = 'llama-3.1-8b-instant';
    
    this.demandAgent = new DemandAgent(apiKey);
    this.contextAgent = new ContextAgent(apiKey);
    this.revenueCalculator = new RevenueCalculator();
    this.cacheManager = CacheManager;
  }

  async callGroqAPI(prompt, systemPrompt = null) {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.groq.chat.completions.create({
        messages,
        model: this.model,
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('Groq API Error:', error.message);
      return null;
    }
  }

  decideNextAction(location, context, previousResults) {
    const systemPrompt = `You are an intelligent orchestration agent managing a truck location analysis workflow.
Available agents:
- demand: Analyze demand factors (foot traffic, events) → returns demandScore (0-1)
- context: Analyze context factors (weather, competition) → returns contextAdjustment (0.5-1.5)
- revenue: Calculate revenue projections based on demand/context
- complete: Finish the analysis

Workflow rules:
- ALWAYS start with demand analysis
- You can SKIP agents if results are already sufficient
- Set confidence based on how certain you are (lower if data is ambiguous)
- Consider location type: business areas need demand, recreational need context
- You may request the same agent again if previous results seem unreliable (confidence < 0.6)

IMPORTANT: Your response MUST be valid JSON only, no markdown, no extra text:
{"action": "demand|context|revenue|complete", "confidence": 0.0-1.0, "reasoning": "1-2 sentence explanation"}`;

    const prompt = `Location: ${location.name} (${location.type})
Capacity: ${location.capacity}
Date: ${this.date}

Current Analysis State:
- Demand: ${previousResults.demand ? `Done (score: ${previousResults.demand.demandScore})` : 'Not analyzed'}
- Context: ${previousResults.context ? `Done (adjustment: ${previousResults.context.contextAdjustment})` : 'Not analyzed'}
- Revenue: ${previousResults.revenue ? `Done ($${previousResults.revenue.projectedDailyRevenue})` : 'Not calculated'}

What should be the next action? Return JSON.`;

    return this.callGroqAPI(prompt, systemPrompt).then(response => {
      try {
        const parsed = JSON.parse(response);
        return {
          action: parsed.action || 'complete',
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || 'AI decision'
        };
      } catch {
        const demandDone = previousResults.demand !== null;
        const contextDone = previousResults.context !== null;
        const revenueDone = previousResults.revenue !== null && Object.keys(previousResults.revenue || {}).length > 0;

        if (!demandDone) return { action: 'demand', confidence: 0.5, reasoning: 'Fallback: starting with demand' };
        if (!contextDone) return { action: 'context', confidence: 0.5, reasoning: 'Fallback: analyzing context' };
        if (!revenueDone) return { action: 'revenue', confidence: 0.5, reasoning: 'Fallback: calculating revenue' };
        return { action: 'complete', confidence: 0.5, reasoning: 'Fallback: analysis complete' };
      }
    });
  }

  async analyzeWithAgenticAI(locations, date, options = {}) {
    this.date = date;

    const cacheKey = options.cacheKey || date;
    const truckId = options.truckId || null;
    const pricing = options.pricing || null;
    const menuSummary = options.menuSummary || null;

    // ===== CACHE CHECK =====
    // Check if we have valid cached recommendations for this date
    const cachedResult = this.cacheManager.get(cacheKey);
    if (cachedResult) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(` AGENTIC AI ORCHESTRATOR - Using Cached Results`);
      console.log(`${'='.repeat(60)}\n`);
      console.log(`✓ CACHE HIT: Returning cached recommendations for ${cacheKey}`);
      console.log(`  (No data changes detected, saving Groq API calls)\n`);
      return { ...cachedResult, cached: true };
    }
    // ======================

    console.log(`\n${'='.repeat(60)}`);
    console.log(` AGENTIC AI ORCHESTRATOR - Intelligent Analysis`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`No valid cache found, running fresh analysis...\n`);

    const results = [];

    for (const location of locations) {
      console.log(`\n📍 Location: ${location.name}`);
      console.log(`${'─'.repeat(50)}`);

      const context = {
        footTraffic: this.getFootTrafficData(location.id),
        events: this.getEventsData(location.id),
        competition: this.getCompetitionData(location.id),
        weather: this.getWeatherData(date),
        truck: truckId
          ? {
            truckId,
            pricing,
            menuSummary
          }
          : null
      };

      const analysisState = {
        demand: null,
        context: null,
        revenue: null
      };

      const decision = await Promise.resolve(this.decideNextAction(location, context, analysisState));
      console.log(`  🎯 AI Decision: ${decision.action} (confidence: ${decision.confidence?.toFixed(2) || 'N/A'})`);
      console.log(`     Reasoning: ${decision.reasoning}`);

      console.log(`  ⚡ Running demand & context in parallel...`);
      const [demandResult, contextResult] = await Promise.all([
        this.demandAgent.analyzeDemand(
          location,
          context.footTraffic,
          context.events,
          context.truck
            ? {
              menuSummary: context.truck.menuSummary || [],
              avgItemPriceRON: context.truck.pricing?.avgItemPriceCents
                ? (context.truck.pricing.avgItemPriceCents / 100).toFixed(2)
                : null
            }
            : null
        ),
        this.contextAgent.analyzeContext(location, context.weather, context.competition, location.capacity)
      ]);

      analysisState.demand = demandResult;
      analysisState.context = contextResult;
      console.log(`     ✓ Demand: ${analysisState.demand.demandScore?.toFixed(2)}, Context: ${analysisState.context.contextAdjustment?.toFixed(2)}`);

      console.log(`  ⚡ Calculating revenue...`);
      const demandScore = analysisState.demand?.demandScore || 0.5;
      const contextAdjustment = analysisState.context?.contextAdjustment || 1.0;

      // Full-day estimation based on foot traffic/hour.
      const hoursOpen = Number.isFinite(options.hoursOpen) ? options.hoursOpen : 8;
      const footPerHour = Number(context.footTraffic?.current) || 100;
      const dailyFootTraffic = Math.max(0, footPerHour * hoursOpen);
      // Conversion rate derived from demandScore: 2%..20%.
      const conversionRate = Math.max(0.02, Math.min(0.2, 0.02 + (demandScore * 0.18)));
      const estimatedTransactions = Math.max(0, Math.round(dailyFootTraffic * conversionRate * contextAdjustment));

      analysisState.revenue = this.revenueCalculator.projectRevenue(
        location,
        demandScore,
        contextAdjustment,
        context.truck?.pricing
          ? {
            avgTicketCents: context.truck.pricing.avgItemPriceCents,
            currency: context.truck.pricing.currency || 'RON',
            pricingBasis: context.truck.pricing.usedDefaultPricing ? 'default' : 'menu',
            estimatedTransactions,
            assumptions: {
              hoursOpen,
              footTrafficPerHour: footPerHour,
              dailyFootTraffic,
              conversionRate
            }
          }
          : { currency: 'RON' }
      );
      console.log(`     ✓ Revenue calculated: ${analysisState.revenue.currency || 'RON'} ${analysisState.revenue.projectedDailyRevenue}`);

      const finalScore = this.calculateFinalScore(analysisState);
      const finalRecommendation = this.generateRecommendation(finalScore, analysisState);

      results.push({
        location: location,
        date: date,
        agenticAnalysis: {
          decisions: analysisState,
          iterationsUsed: 1,
          finalScore: finalScore,
          recommendation: finalRecommendation
        },
        timestamp: new Date().toISOString()
      });

      console.log(`\n  📊 Final Score: ${finalScore.toFixed(2)} | ${finalRecommendation.riskLevel} Risk`);
    }

    console.log(`\n${'='.repeat(60)}`);

    results.sort((a, b) => b.agenticAnalysis.decisions.revenue?.projectedDailyRevenue - a.agenticAnalysis.decisions.revenue?.projectedDailyRevenue);

    const responseData = {
      success: true,
      type: 'agentic_ai',
      date: date,
      orchestrator: 'AgenticOrchestrator',
      model: this.model,
      totalLocationsAnalyzed: locations.length,
      recommendations: results,
      topRecommendation: results[0],
      timestamp: new Date().toISOString(),
      cached: false
    };

    // ===== CACHE STORE =====
    // Store the fresh analysis in cache for future requests
    this.cacheManager.set(cacheKey, { ...responseData });
    // ======================

    return responseData;
  }

  calculateFinalScore(analysisState) {
    const demandScore = analysisState.demand?.demandScore || 0.5;
    const contextAdjustment = analysisState.context?.contextAdjustment || 1.0;
    return Math.round(demandScore * contextAdjustment * 100) / 100;
  }

  generateRecommendation(score, analysisState) {
    return {
      score: score,
      revenue: analysisState.revenue?.projectedDailyRevenue || 0,
      riskLevel: score > 0.75 ? 'LOW' : score > 0.50 ? 'MEDIUM' : 'HIGH'
    };
  }

  getFootTrafficData(locationId) {
    const mockData = require('../data/mockFootTraffic.json');
    const data = Array.isArray(mockData) ? mockData : mockData.footTraffic;
    const traffic = data.find(t => t.locationId === locationId);
    return traffic ? { 
      current: traffic.estimatedPedestrians, 
      peak: traffic.peakHours?.join(', ') || 'N/A' 
    } : { current: 100, peak: 'N/A' };
  }

  getEventsData(locationId) {
    const mockData = require('../data/mockEvents.json');
    const data = Array.isArray(mockData) ? mockData : mockData.events;
    return data.filter(e => e.locationId === locationId);
  }

  getCompetitionData(locationId) {
    const mockData = require('../data/mockCompetition.json');
    const data = Array.isArray(mockData) ? mockData : mockData.competitors;
    const competitors = data.filter(c => c.locationId === locationId);
    return { 
      competitors: competitors.length, 
      density: competitors.length > 3 ? 'high' : competitors.length > 1 ? 'medium' : 'low'
    };
  }

  getWeatherData(date) {
    const mockData = require('../data/weatherData.json');
    const data = Array.isArray(mockData) ? mockData : mockData.weather;
    let weather = data.find(w => w.date === date);
    return weather || {
      date: date,
      condition: 'unknown',
      trafficImpact: 1.0,
      perception: 'unknown',
      description: 'No weather data available for this date (using neutral impact).',
      missingData: true
    };
  }

  async orchestrate(locations, date) {
    return this.analyzeWithAgenticAI(locations, date);
  }
}

module.exports = AgenticOrchestrator;
