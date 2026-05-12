import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { initializeDatabase } from './config/database.js';
import { initializeBot, destroyBot } from './whatsapp/bot.js';
import { generateQRCodeDataURL } from './generate-real-qr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from bot directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.BOT_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(chalk.gray(`[${new Date().toISOString()}] ${req.method} ${req.path}`));
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mozosubz WhatsApp Bot'
  });
});

/**
 * Bot status endpoint
 */
app.get('/api/bot/status', (req, res) => {
  res.json({
    status: 'running',
    service: 'Mozosubz WhatsApp Bot',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get QR code endpoint
 */
app.get('/api/qr-code', async (req, res) => {
  try {
    const qrData = 'https://api.whatsapp.com/send?phone=1234567890';
    const dataURL = await generateQRCodeDataURL(qrData);
    
    res.json({
      qrCode: dataURL,
      instructions: {
        step1: 'Open WhatsApp on your phone',
        step2: 'Go to Settings → Linked Devices',
        step3: 'Tap "Link a Device"',
        step4: 'Point camera at the QR code image',
        step5: 'Confirm by tapping "Link" on your phone'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║     Mozosubz WhatsApp AI Bot - Starting Up             ║'));
    console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

    // Validate environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set. Please configure it in your .env file');
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Please configure it in your .env file');
    }

    console.log(chalk.yellow('[Setup] Initializing database...'));
    await initializeDatabase();
    console.log(chalk.green('[Setup] Database initialized successfully'));

    console.log(chalk.yellow('[Setup] Initializing WhatsApp bot...'));
    await initializeBot();
    console.log(chalk.green('[Setup] WhatsApp bot initialization started'));

    // Start Express server
    app.listen(PORT, () => {
      console.log(chalk.green(`\n[Server] Bot server running on port ${PORT}`));
      console.log(chalk.cyan(`[Server] Health check: http://localhost:${PORT}/health`));
      console.log(chalk.cyan(`[Server] Bot status: http://localhost:${PORT}/api/bot/status\n`));
    });

  } catch (error) {
    console.error(chalk.red('[Error] Failed to start server:'), error.message);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n[Shutdown] Received SIGINT, gracefully shutting down...'));
  try {
    await destroyBot();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('[Shutdown] Error during shutdown:', error));
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n[Shutdown] Received SIGTERM, gracefully shutting down...'));
  try {
    await destroyBot();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('[Shutdown] Error during shutdown:', error));
    process.exit(1);
  }
});

// Start the server
startServer().catch((error) => {
  console.error(chalk.red('[Fatal Error]'), error);
  process.exit(1);
});

export default app;
