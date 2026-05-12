import axios from 'axios';
import SYSTEM_PROMPT from './systemPrompt.js';
import * as mozosubz from '../api/mozosubzClient.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'poolside/laguna-m.1:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Define all available tools/functions that AI can call
 */
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_data_plans',
      description: 'Get available data plans for a specific provider (MTN, Glo, Airtel, Etisalat)',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['mtn_sme', 'mtn_datashare', 'mtn_gifting', 'mtn_awoof', 'glo_data', 'glo_sme', 'airtel_sme', 'airtel_gifting', 'etisalat_data'],
            description: 'Data provider service ID'
          }
        },
        required: ['provider']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'purchase_data',
      description: 'Purchase data for a customer phone number',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            description: 'Data provider service ID'
          },
          phone: {
            type: 'string',
            description: 'Customer phone number'
          },
          plan_id: {
            type: 'string',
            description: 'Plan ID to purchase'
          },
          amount: {
            type: 'number',
            description: 'Amount in Naira'
          }
        },
        required: ['provider', 'phone', 'plan_id', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cable_plans',
      description: 'Get available cable TV plans for a provider (DSTV, GOTV, STARTIMES)',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            enum: ['dstv', 'gotv', 'startimes'],
            description: 'Cable provider name'
          }
        },
        required: ['provider']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'purchase_cable',
      description: 'Subscribe to a cable TV plan',
      parameters: {
        type: 'object',
        properties: {
          provider: {
            type: 'string',
            description: 'Cable provider (dstv, gotv, startimes)'
          },
          decoder_number: {
            type: 'string',
            description: 'Decoder/Smart card number'
          },
          plan_id: {
            type: 'string',
            description: 'Plan ID to subscribe to'
          },
          amount: {
            type: 'number',
            description: 'Amount in Naira'
          }
        },
        required: ['provider', 'decoder_number', 'plan_id', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_electricity_plans',
      description: 'Get available electricity plans for a DISCO (power company)',
      parameters: {
        type: 'object',
        properties: {
          disco: {
            type: 'string',
            enum: ['ikedc', 'eedc', 'bedc', 'aedc', 'kedco', 'phed', 'yedc'],
            description: 'Electricity Distribution Company'
          }
        },
        required: ['disco']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'purchase_electricity',
      description: 'Purchase electricity units',
      parameters: {
        type: 'object',
        properties: {
          disco: {
            type: 'string',
            description: 'Electricity provider DISCO'
          },
          meter_number: {
            type: 'string',
            description: 'Customer meter number'
          },
          amount: {
            type: 'number',
            description: 'Amount in Naira (500-50000)'
          }
        },
        required: ['disco', 'meter_number', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_balance',
      description: 'Check wallet balance for a customer',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'initiate_deposit',
      description: 'Initiate a deposit to wallet',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to deposit in Naira'
          }
        },
        required: ['amount']
      }
    }
  }
];

/**
 * Execute tool calls - maps tool names to actual functions
 */
async function executeTool(toolName, toolInput, userPhone) {
  console.log(`[AI] Executing tool: ${toolName}`, toolInput);
  
  try {
    switch (toolName) {
      case 'get_data_plans':
        return await mozosubz.getDataPlans(toolInput.provider, userPhone);
      
      case 'purchase_data':
        return await mozosubz.purchaseData(
          toolInput.provider,
          toolInput.phone || userPhone,
          toolInput.plan_id,
          toolInput.amount,
          userPhone
        );
      
      case 'get_cable_plans':
        return await mozosubz.getCablePlans(toolInput.provider, userPhone);
      
      case 'purchase_cable':
        return await mozosubz.purchaseCable(
          toolInput.provider,
          toolInput.decoder_number,
          toolInput.plan_id,
          toolInput.amount,
          userPhone
        );
      
      case 'get_electricity_plans':
        return await mozosubz.getElectricityPlans(toolInput.disco, userPhone);
      
      case 'purchase_electricity':
        return await mozosubz.purchaseElectricity(
          toolInput.disco,
          toolInput.meter_number,
          toolInput.amount,
          userPhone
        );
      
      case 'check_balance':
        return await mozosubz.checkBalance(userPhone);
      
      case 'initiate_deposit':
        return await mozosubz.initiateDeposit(toolInput.amount, userPhone);
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`[AI] Tool execution error for ${toolName}:`, error.message);
    throw error;
  }
}

/**
 * Send message to AI with function calling support
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} userPhone - User's WhatsApp phone number
 * @returns {Object} - { message: string, toolResults: Array }
 */
export async function sendToAI(userMessage, conversationHistory = [], userPhone = 'unknown') {
  try {
    // Build messages array with conversation history
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('[AI] Sending request to Open Router with tool calling:', {
      model: OPENROUTER_MODEL,
      messages: messages.length,
      tools: TOOLS.length
    });

    let response = await axios.post(
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
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2048,
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

    const assistantMessage = response.data.choices[0].message;
    console.log('[AI] Received response from AI');

    // Add assistant response to conversation history
    const updatedMessages = [
      ...messages,
      assistantMessage
    ];

    // Handle tool calls if any
    let toolResults = [];
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`[AI] AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
      
      for (const toolCall of assistantMessage.tool_calls) {
        try {
          const toolResult = await executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments), userPhone);
          
          toolResults.push({
            tool: toolCall.function.name,
            result: toolResult,
            status: 'success'
          });

          // Add tool result to messages for final response
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        } catch (error) {
          console.error(`[AI] Tool call failed for ${toolCall.function.name}:`, error.message);
          toolResults.push({
            tool: toolCall.function.name,
            result: error.message,
            status: 'error'
          });

          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }

      // Get final response from AI with tool results
      console.log('[AI] Getting final response after tool execution');
      response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: OPENROUTER_MODEL,
          messages: updatedMessages,
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
    }

    const finalMessage = response.data.choices[0].message.content;

    return {
      message: finalMessage,
      toolResults: toolResults,
      toolCount: assistantMessage.tool_calls?.length || 0
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

export default {
  sendToAI,
  TOOLS
};
