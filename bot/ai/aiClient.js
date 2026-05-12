import axios from 'axios';
import SYSTEM_PROMPT from './systemPrompt.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'poolside/laguna-m.1:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Send message to AI and get response
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} - { message: string, apiCalls: Array }
 */
export async function sendToAI(userMessage, conversationHistory = []) {
  try {
    // Build messages array with conversation history
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('[AI] Sending request to Open Router:', {
      model: OPENROUTER_MODEL,
      messages: messages.length,
      user_message_length: userMessage.length
    });

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          ...messages
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://mozosubz.bot',
          'X-Title': 'Mozosubz WhatsApp Bot',
        },
        timeout: 30000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log('[AI] Received response from AI');

    // Parse API calls from response if present
    const apiCalls = extractAPICallsFromResponse(aiResponse);

    return {
      message: removeAPICallsFromMessage(aiResponse),
      apiCalls: apiCalls,
      raw: aiResponse
    };
  } catch (error) {
    console.error('[AI] Error communicating with Open Router:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API key for Open Router');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limited by Open Router. Please try again later.');
    }
    
    throw new Error(`AI Error: ${error.message}`);
  }
}

/**
 * Extract API calls from AI response
 * Looks for ---API_CALL_START--- ... ---API_CALL_END--- blocks
 */
function extractAPICallsFromResponse(response) {
  const apiCalls = [];
  const regex = /---API_CALL_START---([\s\S]*?)---API_CALL_END---/g;
  
  let match;
  while ((match = regex.exec(response)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const apiCall = JSON.parse(jsonStr);
      apiCalls.push(apiCall);
    } catch (error) {
      console.error('[AI] Error parsing API call:', error.message);
    }
  }

  return apiCalls;
}

/**
 * Remove API call blocks from message (clean up response for user)
 */
function removeAPICallsFromMessage(response) {
  return response
    .replace(/---API_CALL_START---([\s\S]*?)---API_CALL_END---/g, '')
    .trim();
}

export default {
  sendToAI,
  extractAPICallsFromResponse,
  removeAPICallsFromMessage
};
