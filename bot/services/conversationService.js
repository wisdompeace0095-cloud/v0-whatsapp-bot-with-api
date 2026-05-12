import { query, getOne, getAll } from '../config/database.js';

const CONTEXT_HISTORY_LIMIT = 10; // Keep last 10 messages for context

/**
 * Get or create user
 */
export async function getOrCreateUser(whatsappPhone) {
  try {
    let user = await getOne(
      'SELECT * FROM users WHERE whatsapp_phone = $1',
      [whatsappPhone]
    );

    if (!user) {
      const result = await query(
        `INSERT INTO users (whatsapp_phone) VALUES ($1) RETURNING *`,
        [whatsappPhone]
      );
      user = result.rows[0];
      console.log('[DB] Created new user:', whatsappPhone);
    }

    return user;
  } catch (error) {
    console.error('[DB] Error getting or creating user:', error);
    throw error;
  }
}

/**
 * Update user profile after authentication
 */
export async function updateUserProfile(whatsappPhone, authData) {
  try {
    const result = await query(
      `UPDATE users 
       SET authenticated = true, user_id = $2, profile = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE whatsapp_phone = $1 
       RETURNING *`,
      [whatsappPhone, authData.user_id, JSON.stringify(authData.profile)]
    );

    console.log('[DB] Updated user profile:', whatsappPhone);
    return result.rows[0];
  } catch (error) {
    console.error('[DB] Error updating user profile:', error);
    throw error;
  }
}

/**
 * Save conversation message
 */
export async function saveConversation(whatsappPhone, userMessage, aiResponse, context) {
  try {
    const result = await query(
      `INSERT INTO conversations 
       (user_phone, user_message, ai_response, conversation_context, session_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        whatsappPhone,
        userMessage,
        aiResponse,
        JSON.stringify(context),
        generateSessionId()
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[DB] Error saving conversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for context
 */
export async function getConversationHistory(whatsappPhone) {
  try {
    const conversations = await getAll(
      `SELECT user_message, ai_response, created_at 
       FROM conversations 
       WHERE user_phone = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [whatsappPhone, CONTEXT_HISTORY_LIMIT]
    );

    // Reverse to get chronological order
    const history = conversations.reverse();

    // Format for AI API
    const messages = [];
    for (const conv of history) {
      messages.push({
        role: 'user',
        content: conv.user_message
      });
      messages.push({
        role: 'assistant',
        content: conv.ai_response
      });
    }

    return messages;
  } catch (error) {
    console.error('[DB] Error getting conversation history:', error);
    return [];
  }
}

/**
 * Log API call for auditing
 */
export async function logAPICall(whatsappPhone, endpoint, requestPayload, response, status, errorMessage) {
  try {
    await query(
      `INSERT INTO api_calls_log 
       (user_phone, endpoint, request_payload, response, status, error_message) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        whatsappPhone,
        endpoint,
        JSON.stringify(requestPayload),
        response ? JSON.stringify(response) : null,
        status,
        errorMessage
      ]
    );

    console.log('[DB] Logged API call:', endpoint, 'Status:', status);
  } catch (error) {
    console.error('[DB] Error logging API call:', error);
  }
}

/**
 * Get recent transactions for a user
 */
export async function getUserTransactions(whatsappPhone, limit = 10) {
  try {
    const transactions = await getAll(
      `SELECT * FROM api_calls_log 
       WHERE user_phone = $1 AND status = 'success' 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [whatsappPhone, limit]
    );

    return transactions;
  } catch (error) {
    console.error('[DB] Error getting transactions:', error);
    return [];
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  getOrCreateUser,
  updateUserProfile,
  saveConversation,
  getConversationHistory,
  logAPICall,
  getUserTransactions
};
