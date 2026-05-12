import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import { sendToAI } from '../ai/aiClient.js';
import * as mozosubz from '../api/mozosubzClient.js';
import * as conversationService from '../services/conversationService.js';

let whatsappClient;

/**
 * Initialize WhatsApp bot
 */
export async function initializeBot() {
  try {
    console.log(chalk.blue('[WhatsApp] Initializing WhatsApp bot...'));

    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_SESSION_NAME || 'mozosubz-bot'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process'
        ]
      }
    });

    // QR Code handler for authentication
    whatsappClient.on('qr', (qr) => {
      console.log(chalk.yellow('\n[WhatsApp] Scan this QR code with your phone:\n'));
      qrcode.generate(qr, { small: true });
    });

    // Ready event
    whatsappClient.on('ready', () => {
      console.log(chalk.green('[WhatsApp] Bot is ready and connected!'));
    });

    // Authenticated event
    whatsappClient.on('authenticated', () => {
      console.log(chalk.green('[WhatsApp] Successfully authenticated with WhatsApp'));
    });

    // Auth failure
    whatsappClient.on('auth_failure', (msg) => {
      console.log(chalk.red('[WhatsApp] Authentication failed:', msg));
    });

    // Disconnected
    whatsappClient.on('disconnected', (reason) => {
      console.log(chalk.red('[WhatsApp] Bot disconnected:', reason));
    });

    // Message handler
    whatsappClient.on('message_create', async (message) => {
      if (message.isGroup) return; // Ignore group messages
      
      console.log(chalk.cyan(`\n[Message] From: ${message.from} | ${message.body}`));

      try {
        await handleMessage(message);
      } catch (error) {
        console.error(chalk.red('[Error] Handling message failed:', error.message));
        await message.reply(
          'Sorry, an error occurred while processing your request. Please try again later.'
        );
      }
    });

    await whatsappClient.initialize();
    console.log(chalk.green('[WhatsApp] Bot initialization started'));

  } catch (error) {
    console.error(chalk.red('[WhatsApp] Initialization error:', error));
    throw error;
  }
}

/**
 * Handle incoming message
 */
async function handleMessage(message) {
  const whatsappPhone = message.from;
  const userMessage = message.body.trim();

  // Ignore empty messages
  if (!userMessage || userMessage.length === 0) return;

  try {
    // Get or create user
    const user = await conversationService.getOrCreateUser(whatsappPhone);

    // Get conversation history for context
    const conversationHistory = await conversationService.getConversationHistory(whatsappPhone);

    // Show "typing" indicator
    await message.react('⏳');

    // Send to AI with context
    console.log('[Processing] Sending to AI with', conversationHistory.length, 'previous messages');
    const aiResponse = await sendToAI(userMessage, conversationHistory);

    // Extract user-friendly message
    let responseText = aiResponse.message;
    if (!responseText || responseText.length === 0) {
      responseText = "I'm processing your request. Let me know if you need anything else!";
    }

    // If AI generated API calls, execute them
    if (aiResponse.apiCalls && aiResponse.apiCalls.length > 0) {
      console.log('[Processing] Executing', aiResponse.apiCalls.length, 'API calls');
      
      for (const apiCall of aiResponse.apiCalls) {
        try {
          const result = await executeAPICall(whatsappPhone, apiCall, user);
          
          // Log successful API call
          await conversationService.logAPICall(
            whatsappPhone,
            apiCall.endpoint,
            apiCall.body || {},
            result,
            'success',
            null
          );

          // Append result to response if relevant
          if (result && result.formatted) {
            responseText += `\n\n${result.formatted}`;
          } else if (result && result.message) {
            responseText += `\n\n${result.message}`;
          }
        } catch (error) {
          console.error('[Error] API call failed:', error.message);
          
          // Log failed API call
          await conversationService.logAPICall(
            whatsappPhone,
            apiCall.endpoint,
            apiCall.body || {},
            null,
            'failed',
            error.message
          );

          responseText += `\n\nError: ${error.message}`;
        }
      }
    }

    // Save conversation to database
    await conversationService.saveConversation(
      whatsappPhone,
      userMessage,
      responseText,
      { timestamp: new Date(), success: true }
    );

    // Send response back to user
    await message.reply(responseText);
    await message.react('✅');

    console.log('[Success] Response sent to', whatsappPhone);

  } catch (error) {
    console.error(chalk.red('[Error] Error in handleMessage:', error.message));
    
    // Log error to database
    try {
      await conversationService.saveConversation(
        whatsappPhone,
        userMessage,
        `Error: ${error.message}`,
        { timestamp: new Date(), success: false, error: error.message }
      );
    } catch (dbError) {
      console.error('[Error] Failed to log error:', dbError.message);
    }

    throw error;
  }
}

/**
 * Execute API call based on AI instruction
 */
async function executeAPICall(whatsappPhone, apiCall, user) {
  const { endpoint, method, body } = apiCall;

  console.log('[API] Executing:', endpoint);

  switch (endpoint) {
    case '/api/whatsapp/authenticate':
      return await mozosubz.authenticateUser(whatsappPhone);

    case '/api/whatsapp/data/plans':
      return await mozosubz.getDataPlans(body.serviceID);

    case '/api/whatsapp/data/purchase':
      return await mozosubz.purchaseData(
        whatsappPhone,
        body.serviceID,
        body.phone,
        body.value,
        body.amount
      );

    case '/api/whatsapp/cable/plans':
      return await mozosubz.getCablePlans(body.provider);

    case '/api/whatsapp/cable/purchase':
      return await mozosubz.purchaseCable(
        whatsappPhone,
        body.provider,
        body.plan,
        body.customerId,
        body.amount
      );

    case '/api/whatsapp/electricity/plans':
      return await mozosubz.getElectricityPlans();

    case '/api/whatsapp/electricity/purchase':
      return await mozosubz.purchaseElectricity(
        whatsappPhone,
        body.disco,
        body.customerId,
        body.amount
      );

    case '/api/whatsapp/balance':
      return await mozosubz.checkBalance(whatsappPhone);

    case '/api/whatsapp/deposit/initiate':
      return await mozosubz.initiateDeposit(
        whatsappPhone,
        body.amount,
        body.description
      );

    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

/**
 * Send a message (admin function)
 */
export async function sendMessage(phoneNumber, message) {
  try {
    if (!whatsappClient || !whatsappClient.info) {
      throw new Error('WhatsApp client not initialized');
    }

    const chatId = `${phoneNumber}@c.us`;
    await whatsappClient.sendMessage(chatId, message);
    console.log('[WhatsApp] Message sent to', phoneNumber);
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    throw error;
  }
}

/**
 * Destroy bot connection
 */
export async function destroyBot() {
  try {
    if (whatsappClient) {
      await whatsappClient.destroy();
      console.log(chalk.yellow('[WhatsApp] Bot disconnected'));
    }
  } catch (error) {
    console.error('[WhatsApp] Error destroying bot:', error);
  }
}

export default {
  initializeBot,
  sendMessage,
  destroyBot,
  handleMessage
};
