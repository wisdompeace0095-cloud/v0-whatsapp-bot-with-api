# Render Deployment Guide

This guide walks you through deploying the Mozosubz WhatsApp Bot to Render.

## Prerequisites

- ✅ Code pushed to GitHub
- ✅ Open Router API key (from https://openrouter.ai)
- ✅ Render account (https://render.com)

## Deployment Steps

### Step 1: Create PostgreSQL Database on Render

You have two options:

#### Option A: Using Render Dashboard (Recommended for first-time setup)

1. Go to https://dashboard.render.com
2. Click "Create +" → "PostgreSQL"
3. Fill in details:
   - Name: `mozosubz-postgres`
   - Database: `mozosubz_bot`
   - Username: `postgres` (or your choice)
   - Region: Choose closest to your location
4. Click "Create Database"
5. Copy the connection string from the "Connections" section
6. Save this for Step 2

#### Option B: Using Render MCP Tool

```javascript
// After connecting GitHub, the MCP tool can provision the database
// Contact support for assistance
```

### Step 2: Create Web Service on Render

#### Option A: Using Render Dashboard

1. Go to https://dashboard.render.com
2. Click "Create +" → "Web Service"
3. Connect GitHub repository (authorize if needed)
4. Select the repository containing the bot
5. Fill in configuration:
   - **Name**: `mozosubz-whatsapp-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run bot:start`
   - **Plan**: Free (or upgrade as needed)
6. Click "Create Web Service"

#### Option B: Using Render MCP Tool

You can use the provided MCP tool to automate this:

```bash
# The Render MCP provides: Render_create_web_service
# This tool is available in the v0 environment for programmatic deployment
```

### Step 3: Configure Environment Variables

In Render Dashboard:

1. Go to your Web Service
2. Click "Environment"
3. Add these variables:

```
NODE_ENV = production
BOT_PORT = 3001
OPENROUTER_API_KEY = your_api_key_from_step_1
MOZOSUBZ_API_BASE = https://api.mozosubz.xyz
DATABASE_URL = your_postgres_connection_string_from_database_creation
WHATSAPP_SESSION_NAME = mozosubz-bot-render
LOG_LEVEL = info
```

**Important**: Get your DATABASE_URL from the PostgreSQL database created in Step 1

### Step 4: Connect Database to Web Service

1. In your Web Service, go to "Connect database"
2. Select the PostgreSQL database created in Step 1
3. Confirm the connection

### Step 5: Deploy

1. Push your code to GitHub (bot directory included)
2. Render automatically deploys on push, OR
3. Manually deploy:
   - Go to Web Service dashboard
   - Click "Manual Deploy" → "Deploy latest commit"

### Step 6: Verify Deployment

1. Check deployment logs:
   - Go to Web Service
   - Click "Logs" tab
   - Look for messages like:
   ```
   [WhatsApp] Bot initialization started
   [Server] Bot server running on port 3001
   ```

2. Test health endpoint:
   ```bash
   curl https://your-service.onrender.com/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-15T10:30:00Z",
     "service": "Mozosubz WhatsApp Bot"
   }
   ```

## WhatsApp Authentication on Render

When the bot first runs on Render, it will need WhatsApp authentication:

1. View the service logs
2. Look for QR code output
3. Copy the QR code text
4. Use a tool to convert text to QR code or wait for the bot to display it
5. Scan with your phone
6. Bot will be authenticated and ready

**Note**: The bot will automatically save the session. Subsequent restarts won't require re-scanning.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `BOT_PORT` | Port number | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pwd@host:5432/db` |
| `OPENROUTER_API_KEY` | Open Router API key | Get from openrouter.ai |
| `MOZOSUBZ_API_BASE` | Mozosubz API base URL | `https://api.mozosubz.xyz` |
| `WHATSAPP_SESSION_NAME` | Session identifier | `mozosubz-bot-render` |
| `LOG_LEVEL` | Logging level | `info`, `debug`, `error` |

## Monitoring & Debugging

### View Logs
```bash
# In Render Dashboard:
1. Go to Web Service
2. Click "Logs" tab
3. View real-time logs
```

### Check Service Status
```bash
curl https://your-service.onrender.com/api/bot/status
```

### Restart Service
```bash
# In Render Dashboard:
1. Go to Web Service
2. Click "Manual Deploy" → "Restart instance"
```

## Troubleshooting

### Bot crashes on deploy
- Check logs for error messages
- Verify all environment variables are set
- Ensure DATABASE_URL is correct
- Check OPENROUTER_API_KEY is valid

### "WhatsApp authentication failed"
- The bot may need the QR code scanned again
- Check logs for QR code output
- Restart the service

### "Database connection error"
- Verify DATABASE_URL is correct
- Check database is running
- Ensure credentials are correct

### "API rate limit exceeded"
- Open Router free tier has usage limits
- Upgrade plan if needed
- Or use a different AI provider

## Costs

**Free Tier**:
- Web Service: Free (with sleep after 15 min inactivity)
- PostgreSQL: Free (max 90 days)
- Open Router: Free tier with usage limits

**Recommended for Production**:
- Upgrade Web Service to Starter plan ($7/month)
- Upgrade PostgreSQL to Starter plan ($15/month)
- Upgrade Open Router to paid plan as needed

## Using Render MCP Tools (Advanced)

The Render MCP provides these tools for automation:

```javascript
// These tools are available but require GitHub connection
Render_create_web_service
Render_create_postgres
Render_update_environment_variables
Render_list_services
Render_get_service
Render_list_deploys
Render_get_deploy
```

Example usage would be handled through the v0 environment with proper authorization.

## Support

- **Render Docs**: https://render.com/docs
- **Mozosubz API**: See bot/README.md
- **Open Router**: https://openrouter.ai/docs
- **WhatsApp Web.js**: https://github.com/pedrosans/whatsapp-web.js

## Next Steps After Deployment

1. ✅ Verify bot is running
2. ✅ Authenticate with WhatsApp
3. ✅ Test with a message: "What's my balance?"
4. ✅ Monitor logs for any errors
5. ✅ Set up monitoring/alerts (optional)
6. ✅ Share bot with users

---

**Deployment Complete!** Your Mozosubz WhatsApp Bot is now live on Render.
