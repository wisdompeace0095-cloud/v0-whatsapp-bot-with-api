import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import { sendToAI } from '../ai/aiClient.js';
import * as mozosubz from '../api/mozosubzClient.js';
import * as conversationService from '../services/conversationService.js';
import { displayQRCode } from './qr-generator.js';

let whatsappClient;

/**
 * Check if running in demo mode
 */
function isDemoMode() {
  return process.env.DEMO_MODE === 'true' || !process.env.NODE_ENV || process.env.NODE_ENV === 'sandbox' || process.env.NODE_ENV === 'development';
}

/**
 * Initialize WhatsApp bot
 */
export async function initializeBot() {
  try {
    console.log(chalk.blue('[WhatsApp] Initializing WhatsApp bot...'));

    // Always try to initialize real WhatsApp client, but fall back to demo if Chrome is not available
    try {
      whatsappClient = new Client();

      // QR Code handler for authentication
      whatsappClient.on('qr', (qr) => {
        console.log(chalk.yellow('\n[WhatsApp] Scan this QR code with your phone:\n'));
        qrcode.generate(qr, { small: true });
        displayQRCode(qr);
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

    } catch (browserError) {
      console.error(chalk.yellow('[WhatsApp] Chrome/Browser error:', browserError.message));
      console.log(chalk.yellow('[WhatsApp] Falling back to demo mode (no browser available)'));
      
      // Fall back to demo mode - show demo QR code
      const demoQRData = 'https://api.whatsapp.com/send?phone=1234567890&text=Hello';
      await displayQRCode(demoQRData);
      console.log(chalk.green('[WhatsApp] Bot ready in DEMO MODE'));
    }

  } catch (error) {
    console.error(chalk.red('[WhatsApp] Initialization error:', error.message));
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
    const aiResponse = await sendToAI(userMessage, conversationHistory, whatsappPhone);

    // Get AI response message
    let responseText = aiResponse.message;
    if (!responseText || responseText.length === 0) {
      responseText = "I'm processing your request. Let me know if you need anything else!";
    }

    // Log tool results if any
    if (aiResponse.toolResults && aiResponse.toolResults.length > 0) {
      console.log(`[Tools] AI executed ${aiResponse.toolResults.length} tools`);
      
      for (const toolResult of aiResponse.toolResults) {
        // Log all tool calls
        await conversationService.logAPICall(
          whatsappPhone,
          `tool:${toolResult.tool}`,
          {},
          toolResult.result,
          toolResult.status,
          toolResult.status === 'error' ? toolResult.result : null
        );
      }
    }

    // Save conversation to database
    await conversationService.saveConversation(
      whatsappPhone,
      userMessage,
      responseText,
      { 
        timestamp: new Date(), 
        success: true,
        toolCount: aiResponse.toolCount || 0
      }
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
