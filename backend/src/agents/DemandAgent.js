const Groq = require('groq-sdk');

/**
 * Demand Agent
 * Uses Groq Mixtral 8x7B to analyze demand factors
 * Calculates demand/opportunity scores based on location factors
 */
class DemandAgent {
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
        max_tokens: 130
      });

      if (message.choices && message.choices[0]) {
        return message.choices[0].message.content || 'Unable to analyze';
      }
      return 'Unable to analyze demand';
    } catch (error) {
      console.error('Groq Demand Agent Error:', error.message);
      throw error;
    }
  }

  /**
   * Analyze demand for a location
   */
  async analyzeDemand(location, footTraffic, events, truckContext = null) {
    try {
      const menuLine = truckContext?.menuSummary?.length
        ? `Menu (RON): ${truckContext.menuSummary.map(i => `${i.name} ${i.price}`).join(', ')}.`
        : 'Menu (RON): not provided.';

      const avgLine = truckContext?.avgItemPriceRON
        ? `Average menu price: ~${truckContext.avgItemPriceRON} RON.`
        : '';

      const prompt = `You are evaluating purchase demand for a food truck. Reply in this EXACT format — no other text:
Score: [0-100]. [One sentence on foot traffic and events.] [One sentence on how the menu price affects purchase intent.]

Location: ${location.name}
Foot traffic: ${footTraffic.current} people/hour
Nearby events: ${events.length > 0 ? events.map(e => e.name).join(', ') : 'None'}
${menuLine} ${avgLine}

Score:`;

      console.log(`[DEMAND AGENT] Analyzing demand for ${location.name} via Groq...`);

      const result = await this.callGroqAPI(prompt);
      
      // Extract score from "Score: [0-100]" label
      const scoreMatch = result.match(/Score:\s*(\d{1,3})/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.5;

      return {
        agent: 'DemandAgent',
        location: location.name,
        analysis: result,
        demandScore: Math.min(score, 1),
        reasoning: `Foot traffic: ${footTraffic.current}. Events: ${events.length}`
      };
    } catch (error) {
      console.error('Demand Agent Analysis Error:', error.message);
      return {
        agent: 'DemandAgent',
        location: location.name,
        error: error.message,
        demandScore: 0.5
      };
    }
  }
}

module.exports = DemandAgent;
