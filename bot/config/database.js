import pkg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pkg;
let pool;
let sqliteDb;

// Initialize appropriate database based on environment
if (process.env.DATABASE_TYPE === 'sqlite') {
  sqliteDb = new sqlite3.Database(
    path.resolve(__dirname, '../', process.env.DATABASE_URL),
    (err) => {
      if (err) {
        console.error('[DB] SQLite connection error:', err);
      } else {
        console.log('[DB] SQLite database connected');
      }
    }
  );
  sqliteDb.configure('busyTimeout', 5000);
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client', err);
  });
}

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  try {
    console.log('[DB] Initializing database schema...');

    if (process.env.DATABASE_TYPE === 'sqlite') {
      // SQLite schema
      await runAsync(sqliteDb, `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          whatsapp_phone TEXT UNIQUE NOT NULL,
          authenticated INTEGER DEFAULT 0,
          user_id TEXT,
          profile TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await runAsync(sqliteDb, `
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_phone TEXT NOT NULL,
          session_id TEXT,
          user_message TEXT,
          ai_response TEXT,
          conversation_context TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_phone) REFERENCES users(whatsapp_phone)
        );
      `);

      await runAsync(sqliteDb, `
        CREATE TABLE IF NOT EXISTS api_calls_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_phone TEXT NOT NULL,
          endpoint TEXT,
          request_payload TEXT,
          response TEXT,
          status TEXT,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_phone) REFERENCES users(whatsapp_phone)
        );
      `);
    } else {
      // PostgreSQL schema
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
    }

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
    if (process.env.DATABASE_TYPE === 'sqlite') {
      return new Promise((resolve, reject) => {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      });
    } else {
      const result = await pool.query(text, params);
      return result;
    }
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
    if (process.env.DATABASE_TYPE === 'sqlite') {
      return new Promise((resolve, reject) => {
        sqliteDb.get(text, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    } else {
      const result = await pool.query(text, params);
      return result.rows[0] || null;
    }
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
    if (process.env.DATABASE_TYPE === 'sqlite') {
      return new Promise((resolve, reject) => {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    } else {
      const result = await pool.query(text, params);
      return result.rows;
    }
  } catch (err) {
    console.error('[DB] Get all error:', err);
    throw err;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  if (process.env.DATABASE_TYPE === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } else {
    await pool.end();
  }
}

/**
 * SQLite async helper
 */
function runAsync(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export default process.env.DATABASE_TYPE === 'sqlite' ? sqliteDb : pool;
