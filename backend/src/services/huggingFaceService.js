const axios = require('axios');

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

/**
 * Analyze sentiment of event description using Hugging Face API
 * @param {string} eventDescription - Description to analyze
 * @returns {Promise} Sentiment analysis result
 */
const analyzeEventSentiment = async (eventDescription) => {
  try {
    if (!HF_API_KEY) {
      console.warn('Warning: HUGGING_FACE_API_KEY not set. Skipping sentiment analysis.');
      return null;
    }

    const response = await axios.post(
      `${HF_API_URL}/nlptown/bert-base-multilingual-uncased-sentiment`,
      { inputs: eventDescription },
      {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return null;
  }
};

/**
 * Classify event type using Hugging Face API
 * @param {string} eventName - Event name to classify
 * @returns {Promise} Classification result
 */
const classifyEventType = async (eventName) => {
  try {
    if (!HF_API_KEY) {
      console.warn('Warning: HUGGING_FACE_API_KEY not set. Skipping event classification.');
      return null;
    }

    const response = await axios.post(
      `${HF_API_URL}/facebook/bart-large-mnli`,
      {
        inputs: eventName,
        parameters: {
          candidate_labels: ['food_festival', 'market', 'concert', 'sports', 'general']
        }
      },
      {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Classification error:', error.message);
    return null;
  }
};

/**
 * Generate summary of event using Hugging Face API
 * @param {string} eventDescription - Description to summarize
 * @returns {Promise} Summary result
 */
const summarizeEvent = async (eventDescription) => {
  try {
    if (!HF_API_KEY) {
      console.warn('Warning: HUGGING_FACE_API_KEY not set. Skipping summarization.');
      return null;
    }

    const response = await axios.post(
      `${HF_API_URL}/facebook/bart-large-cnn`,
      { inputs: eventDescription },
      {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Summarization error:', error.message);
    return null;
  }
};

module.exports = {
  analyzeEventSentiment,
  classifyEventType,
  summarizeEvent
};
