# Mozosubz WhatsApp AI Bot

An intelligent WhatsApp bot that acts as a middleware between WhatsApp users and the Mozosubz API. The bot uses AI (Open Router - Laguna M1) to understand natural language requests and handle data purchases, cable subscriptions, electricity payments, wallet management, and more.

## Features

✨ **AI-Powered Conversations** - Natural language understanding with no commands required
📱 **WhatsApp Integration** - Seamless WhatsApp Web.js integration
💾 **Database Storage** - PostgreSQL for conversation history and audit logs
💳 **Mozosubz Services** - Full integration with all Mozosubz services:
  - Data purchases (MTN, Glo, Airtel, Etisalat)
  - Cable subscriptions (DSTV, GOTV, STARTIMES)
  - Electricity payments (IKEDC, EEDC, BEDC, AEDC, KEDCO, PHED, YEDC)
  - Wallet balance checking
  - Deposit/fund wallet
🔒 **Session Management** - Conversation context tracking for better AI responses
📊 **Audit Logging** - Complete API call logging for transactions

## Prerequisites

- Node.js 18+ with npm/pnpm
- PostgreSQL database
- Open Router API key (free tier available)
- WhatsApp account (for WhatsApp Web)

## Installation

### 1. Clone and Install Dependencies

```bash
cd bot
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mozosubz_bot

# Open Router AI (get free API key from https://openrouter.ai)
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=poolside/laguna-m.1:free

# Mozosubz API (provided)
MOZOSUBZ_API_BASE=https://api.mozosubz.xyz

# Other settings
BOT_PORT=3001
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Initialize Database

The bot will automatically create the required database schema on first run. Make sure your PostgreSQL database exists first:

```bash
psql -U postgres -c "CREATE DATABASE mozosubz_bot;"
```

## Running the Bot

### Development Mode (with auto-reload)

```bash
pnpm bot:dev
```

### Production Mode

```bash
pnpm bot:start
```

### First Run

On first run, the bot will display a QR code in the terminal. Scan it with your WhatsApp phone to authenticate.

```
[WhatsApp] Scan this QR code with your phone:

 █████████████████████
 ██ ▄▄▄▄▄ █ ██ █▄█ █
 ██ █   █ █ ▀▀ ▀█ ▀█
 ██ █▄▄▄█ █▀█ ░█░ ▀█
 ██ ▄▄▄▄▄ ▀ ▀ ░█░ ▀█
 ██ █▄█  █▀▀▀▀▄ ░░█ █
 ██ ▀ ▄ ▀█▀▀ █░ ░░ ▀
 ██ ▀▀▀▀▀ ▀ ▀ ▀░ ░░░
 █████████████████████
```

After scanning, the bot will be ready to receive messages.

## How It Works

1. **User sends a WhatsApp message** → Bot receives via whatsapp-web.js
2. **Load conversation history** → Database retrieves previous messages for context
3. **Send to AI** → Message + history + system prompt sent to Open Router
4. **AI interprets request** → Determines what Mozosubz service user needs
5. **Execute API calls** → Bot calls relevant Mozosubz endpoints if needed
6. **Save to database** → Conversation and API calls logged
7. **Send response** → AI-generated response sent back to WhatsApp user

## Example Conversations

### Data Purchase

**User**: "I want to buy 1GB of MTN data for 09056458312"

**Bot**: "I'll help you buy 1GB MTN data. Let me check the current plans and process your request..."
*[Fetches available plans, purchases data]*
"✅ Success! You've purchased 1GB of MTN data for ₦250. The data should be activated shortly."

### Check Balance

**User**: "What's my balance?"

**Bot**: "Let me check your wallet balance..."
"Your current balance is ₦15,000.00"

### Cable Subscription

**User**: "I want to subscribe to DSTV with my decoder 12345678"

**Bot**: "Sure! Let me show you the available DSTV plans..."
*[Shows plans]*
"Which plan would you like? Available plans: Starter (₦2,000), Compact (₦4,500), etc."

## Architecture

```
bot/
├── config/
│   └── database.js          # PostgreSQL configuration & schema
├── whatsapp/
│   └── bot.js               # WhatsApp Web.js handler
├── ai/
│   ├── aiClient.js          # Open Router integration
│   └── systemPrompt.js      # AI system prompt with Mozosubz docs
├── api/
│   └── mozosubzClient.js    # Mozosubz API wrapper
├── services/
│   └── conversationService.js # Conversation & user management
├── server.js                # Express server & entry point
├── .env.example             # Environment variables template
└── render.yaml              # Render deployment config
```

## Database Schema

### users
- `id` - Primary key
- `whatsapp_phone` - User's WhatsApp number (unique)
- `authenticated` - Whether user is authenticated with Mozosubz
- `user_id` - Mozosubz user ID
- `profile` - User profile from Mozosubz API (JSON)
- `created_at` - Account creation time
- `updated_at` - Last update time

### conversations
- `id` - Primary key
- `user_phone` - User's WhatsApp number
- `session_id` - Conversation session ID
- `user_message` - User's message
- `ai_response` - AI-generated response
- `conversation_context` - Context JSON for AI
- `created_at` - Message timestamp

### api_calls_log
- `id` - Primary key
- `user_phone` - User who made the call
- `endpoint` - API endpoint called
- `request_payload` - Request data (JSON)
- `response` - API response (JSON)
- `status` - success/failed
- `error_message` - Error details if failed
- `created_at` - Call timestamp

## Deploying to Render

### Using Render MCP Tools

The bot can be deployed to Render using the provided MCP tools. Configuration is in `render.yaml`.

### Manual Setup

1. **Create Web Service**
   - Connect GitHub repository
   - Set start command: `npm run bot:start`
   - Set environment variables

2. **Create PostgreSQL Database**
   - Use Render's managed PostgreSQL
   - Set `DATABASE_URL` environment variable

3. **Deploy**
   - Push to GitHub
   - Render will automatically deploy

### Environment Variables on Render

Set these in your Render project settings:

```
OPENROUTER_API_KEY=your_api_key
DATABASE_URL=provided_by_render
NODE_ENV=production
MOZOSUBZ_API_BASE=https://api.mozosubz.xyz
```

## API Endpoints

The bot exposes these health check endpoints:

- `GET /health` - Health check
- `GET /api/bot/status` - Bot status and info

## Troubleshooting

### "QR Code not showing"
- Make sure you're running in a terminal that supports output
- Try using a different terminal emulator

### "Database connection failed"
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Make sure the database exists

### "OPENROUTER_API_KEY is not set"
- Add your API key to `.env`
- Get a free key from https://openrouter.ai

### "WhatsApp authentication failed"
- Scan the QR code again with your phone
- Make sure WhatsApp is installed on your phone
- Try logging out from other WhatsApp Web sessions

### Bot not responding
- Check logs for errors
- Verify Mozosubz API is accessible
- Ensure all environment variables are set
- Check database connection

## Security Notes

🔐 **API Keys**: Never commit `.env` file with real API keys
🔐 **Database**: Use strong passwords for PostgreSQL
🔐 **Mozosubz**: Only WhatsApp numbers linked by users can authenticate
🔐 **Audit Trail**: All API calls are logged to database for compliance

## Support & Documentation

- **Mozosubz API Docs**: See `docs/mozosubz-api.md`
- **Open Router**: https://openrouter.ai
- **WhatsApp Web.js**: https://github.com/pedrosans/whatsapp-web.js

## License

This project is provided as-is for integration with Mozosubz services.

## Next Steps

1. Set up your environment variables in `.env`
2. Create your PostgreSQL database
3. Get a free Open Router API key
4. Run the bot locally to test
5. Deploy to Render using the provided configuration
