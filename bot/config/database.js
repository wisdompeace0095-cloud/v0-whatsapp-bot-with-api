import dotenv from 'dotenv';

dotenv.config();

// In-memory database for sandbox testing
const database = {
  users: [],
  conversations: [],
  api_calls_log: []
};

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  try {
    console.log('[DB] Initializing in-memory database...');
    console.log('[DB] Database schema initialized successfully');
  } catch (err) {
    console.error('[DB] Error initializing database:', err);
    throw err;
  }
}

/**
 * Execute a query (simplified for in-memory)
 */
export async function query(sql, params) {
  try {
    // Parse simple INSERT queries
    if (sql.includes('INSERT INTO users')) {
      const user = {
        id: database.users.length + 1,
        whatsapp_phone: params[0],
        authenticated: params[1] || 0,
        user_id: params[2] || null,
        profile: params[3] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      database.users.push(user);
      return { rows: [user] };
    }
    
    if (sql.includes('INSERT INTO conversations')) {
      const conversation = {
        id: database.conversations.length + 1,
        user_phone: params[0],
        session_id: params[1] || null,
        user_message: params[2] || null,
        ai_response: params[3] || null,
        conversation_context: params[4] || '{}',
        created_at: new Date().toISOString()
      };
      database.conversations.push(conversation);
      return { rows: [conversation] };
    }

    if (sql.includes('INSERT INTO api_calls_log')) {
      const log = {
        id: database.api_calls_log.length + 1,
        user_phone: params[0],
        endpoint: params[1],
        request_payload: params[2],
        response: params[3],
        status: params[4],
        error_message: params[5] || null,
        created_at: new Date().toISOString()
      };
      database.api_calls_log.push(log);
      return { rows: [log] };
    }

    return { rows: [] };
  } catch (err) {
    console.error('[DB] Query error:', err);
    throw err;
  }
}

/**
 * Get a single row
 */
export async function getOne(sql, params) {
  try {
    if (sql.includes('SELECT * FROM users WHERE whatsapp_phone')) {
      const user = database.users.find(u => u.whatsapp_phone === params[0]);
      return user || null;
    }
    return null;
  } catch (err) {
    console.error('[DB] Get one error:', err);
    throw err;
  }
}

/**
 * Get all rows
 */
export async function getAll(sql, params = []) {
  try {
    if (sql.includes('SELECT * FROM conversations WHERE user_phone')) {
      return database.conversations.filter(c => c.user_phone === params[0]) || [];
    }
    return [];
  } catch (err) {
    console.error('[DB] Get all error:', err);
    throw err;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  console.log('[DB] In-memory database closed');
}

export default database;
