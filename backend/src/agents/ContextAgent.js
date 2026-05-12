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
      const prompt = `You are evaluating external conditions for a food truck. Reply with ONLY a decimal multiplier between 0.5 and 1.5, then one sentence of reasoning.

Scale reference:
0.5 = terrible (storm or heavy rain AND very high competition)
0.7 = poor (rainy or windy AND high competition)
0.9 = below average (cloudy OR medium competition)
1.0 = neutral conditions
1.1 = good (partly cloudy AND low competition)
1.3 = very good (sunny AND low competition)
1.5 = excellent (sunny AND event nearby AND no competition)

Location: ${location.name}, capacity: ${capacity}
Weather: ${weather.condition} (traffic impact ${weather.trafficImpact}x)
Competition density: ${competition.density}

Multiplier:`;

      console.log(`[CONTEXT AGENT] Analyzing context for ${location.name} via Groq...`);

      const result = await this.callGroqAPI(prompt);

      // Extract the first decimal or integer in the valid range from the response.
      const scoreMatch = result.match(/\b([01]\.\d+|0|1|2)\b/);
      const multiplier = scoreMatch ? parseFloat(scoreMatch[0]) : 1.0;
      const adjustment = Math.max(0.5, Math.min(multiplier, 1.5));

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
