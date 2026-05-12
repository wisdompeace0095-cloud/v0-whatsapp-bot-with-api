import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  try {
    console.log('[DB] Initializing database schema...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        whatsapp_phone VARCHAR(20) UNIQUE NOT NULL,
        authenticated BOOLEAN DEFAULT false,
        user_id VARCHAR(100),
        profile JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_phone VARCHAR(20) NOT NULL,
        session_id VARCHAR(100),
        user_message TEXT,
        ai_response TEXT,
        conversation_context JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_phone) REFERENCES users(whatsapp_phone)
      );
    `);

    // Create API calls log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_calls_log (
        id SERIAL PRIMARY KEY,
        user_phone VARCHAR(20) NOT NULL,
        endpoint VARCHAR(255),
        request_payload JSONB,
        response JSONB,
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_phone) REFERENCES users(whatsapp_phone)
      );
    `);

    console.log('[DB] Database schema initialized successfully');
  } catch (err) {
    console.error('[DB] Error initializing database:', err);
    throw err;
  }
}

/**
 * Execute a query
 */
export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('[DB] Query error:', err);
    throw err;
  }
}

/**
 * Get a single row
 */
export async function getOne(text, params) {
  try {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[DB] Get one error:', err);
    throw err;
  }
}

/**
 * Get all rows
 */
export async function getAll(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (err) {
    console.error('[DB] Get all error:', err);
    throw err;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  await pool.end();
}

export default pool;
