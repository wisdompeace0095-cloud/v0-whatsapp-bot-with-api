# Mozosubz WhatsApp Bot - Quick Reference

## Start the Bot

```bash
cd bot
npm install
npm run bot:start
```

## Environment Variables (.env)

```
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENROUTER_API_KEY=sk-or-xxx

# Optional (defaults work fine)
NODE_ENV=production
BOT_PORT=3001
MOZOSUBZ_API_BASE=https://api.mozosubz.xyz
```

## First Run

1. Bot displays QR code
2. Scan with phone running WhatsApp
3. Bot is ready to use

## Send Test Message

To a contact with your WhatsApp number:
- "What's my balance?"
- "I want to buy MTN data"
- "Subscribe me to DSTV"

## Check Bot Status

```bash
# Health check
curl http://localhost:3001/health

# Bot status
curl http://localhost:3001/api/bot/status
```

## View Database

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# List users
SELECT * FROM users;

# View conversations
SELECT * FROM conversations LIMIT 10;

# Check API logs
SELECT * FROM api_calls_log ORDER BY created_at DESC;
```

## Development Commands

```bash
# Development with auto-reload
npm run bot:dev

# Production
npm run bot:start
```

## Deploy to Render

```bash
1. Create PostgreSQL database on Render
2. Create Web Service on Render
3. Set environment variables
4. Push to GitHub
5. Done - Render auto-deploys
```

See DEPLOYMENT.md for detailed steps.

## Troubleshooting

**QR code not showing**: Try different terminal
**Database error**: Check DATABASE_URL
**API error**: Check OPENROUTER_API_KEY
**Bot not responding**: Check logs with `npm run bot:dev`

## Key Files

- `bot/server.js` - Main entry point
- `bot/ai/systemPrompt.js` - AI instructions
- `bot/whatsapp/bot.js` - WhatsApp handler
- `bot/api/mozosubzClient.js` - Mozosubz API
- `bot/config/database.js` - Database setup

## Documentation

- Full docs: `bot/README.md`
- Deployment: `DEPLOYMENT.md`
- Project info: `BOT_PROJECT_SUMMARY.md`

## Mozosubz Services

✓ Data (MTN, Glo, Airtel, Etisalat)
✓ Cable (DSTV, GOTV, STARTIMES)
✓ Electricity (All DISCOs)
✓ Balance check
✓ Deposits/Fund wallet

## Get Help

1. Check logs: `npm run bot:dev`
2. Read README: `bot/README.md`
3. Check DEPLOYMENT.md for deployment issues
