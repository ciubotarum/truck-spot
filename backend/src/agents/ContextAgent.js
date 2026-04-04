const Groq = require('groq-sdk');

/**
 * Context Agent
 * Uses Groq Mixtral 8x7B to analyze context factors
 * Determines adjustment multiplier based on contextual factors
 */
class ContextAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.model = 'llama-3.1-8b-instant';
    this.groq = new Groq({ apiKey: apiKey });
  }

  async callGroqAPI(prompt) {
    try {
      const message = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 100
      });

      if (message.choices && message.choices[0]) {
        return message.choices[0].message.content || 'Unable to analyze';
      }
      return 'Unable to analyze context';
    } catch (error) {
      console.error('Groq Context Agent Error:', error.message);
      throw error;
    }
  }

  /**
   * Analyze context and return adjustment multiplier
   */
  async analyzeContext(location, weather, competition, capacity) {
    try {
      const prompt = `Context analysis for food truck location.
      Weather: ${weather.condition}, Impact multiplier: ${weather.trafficImpact}x.
      Competition density: ${competition.density}. 
      Location capacity: ${capacity}.
      Rate risk adjustment factor (0.5-1.5) and explain in 1-2 sentences:`;

      console.log(`[CONTEXT AGENT] Analyzing context for ${location.name} via Groq...`);

      const result = await this.callGroqAPI(prompt);
      
      // Extract multiplier from response
      const scoreMatch = result.match(/\d+\.?\d*/);
      const multiplier = scoreMatch ? parseFloat(scoreMatch[0]) : 1.0;
      const adjustment = Math.max(0.5, Math.min(multiplier, 1.5)); // Clamp between 0.5-1.5

      return {
        agent: 'ContextAgent',
        location: location.name,
        analysis: result,
        contextAdjustment: adjustment,
        factors: {
          weather: weather.condition,
          competition: competition.density,
          capacity: capacity
        }
      };
    } catch (error) {
      console.error('Context Agent Analysis Error:', error.message);
      return {
        agent: 'ContextAgent',
        location: location.name,
        error: error.message,
        contextAdjustment: 1.0
      };
    }
  }
}

module.exports = ContextAgent;
