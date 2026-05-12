# Mozosubz WhatsApp Bot - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         END USER (WhatsApp)                         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ WhatsApp Message
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WHATSAPP WEB.JS INTEGRATION                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Connects via WhatsApp Web emulation                          │ │
│  │ • Handles incoming/outgoing messages                          │ │
│  │ • QR code authentication on first run                         │ │
│  │ • Session persistence (survives restarts)                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Message Text
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGE HANDLER (bot.js)                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Validates message (ignore group, empty)                     │ │
│  │ • Extracts user WhatsApp phone number                         │ │
│  │ • Triggers processing flow                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────────────────┬─────┘
                     │                                          │
                     ▼                                          ▼
      ┌──────────────────────────┐        ┌──────────────────────────┐
      │  DATABASE (PostgreSQL)   │        │  CONVERSATION SERVICE    │
      │  ┌────────────────────┐  │        │  ┌────────────────────┐  │
      │  │ • Load user data   │  │        │  │ • Get user profile │  │
      │  │ • Get conv. history│  │        │  │ • Load message     │  │
      │  │ • Store context    │  │        │  │   history (10 msgs)│  │
      │  └────────────────────┘  │        │  │ • Format for AI    │  │
      └──────────────────────────┘        │  └────────────────────┘  │
                                          └──────────────────────────┘
                                                      │
                                                      │
                                                      ▼
                    ┌─────────────────────────────────────────────────┐
                    │    AI CLIENT (aiClient.js + systemPrompt.js)   │
                    │  ┌───────────────────────────────────────────┐  │
                    │  │ SYSTEM PROMPT:                            │  │
                    │  │ • Full Mozosubz API documentation         │  │
                    │  │ • Instructions for each service           │  │
                    │  │ • Output format specifications            │  │
                    │  │ • Error handling rules                    │  │
                    │  └───────────────────────────────────────────┘  │
                    │                                                  │
                    │  REQUEST: {                                      │
                    │    system: "Full API docs + instructions",      │
                    │    messages: [history + current message],       │
                    │    model: "poolside/laguna-m.1:free"            │
                    │  }                                               │
                    └────────────────┬─────────────────────────────────┘
                                    │
                                    │ HTTP POST
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │         OPEN ROUTER API (poolside/laguna-m.1)    │
        │  ┌─────────────────────────────────────────────┐  │
        │  │ • Understands user intent (NLU)            │  │
        │  │ • Determines required Mozosubz service     │  │
        │  │ • Generates structured API calls           │  │
        │  │ • Creates user-friendly response           │  │
        │  │ • Maintains conversation flow              │  │
        │  └─────────────────────────────────────────────┘  │
        └───────────────────┬───────────────────────────────┘
                            │
                            │ JSON Response with:
                            │ - User message
                            │ - API calls (if needed)
                            ▼
                    ┌─────────────────────────┐
                    │ PARSE AI RESPONSE       │
                    │ • Extract message       │
                    │ • Extract API calls     │
                    │ • Validate structure    │
                    └────────┬────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ MOZOSUBZ API CLIENT  │    │  SEND RESPONSE       │
    │ (mozosubzClient.js)  │    │  TO WHATSAPP         │
    │                      │    │  • Format message    │
    │ For each API call:   │    │  • Include results   │
    │ ┌──────────────────┐ │    │  • React with emoji  │
    │ │ Validate params  │ │    └──────────────────────┘
    │ │ Call Mozosubz    │ │             │
    │ │ Handle response  │ │             │
    │ │ Parse result     │ │             │
    │ │ Log to DB        │ │             │
    │ └──────────────────┘ │             │
    └──────────┬───────────┘             │
               │                         │
               │ (Results, if any)       │
               │                         │
               └──────────┬──────────────┘
                          │
                          ▼
                    ┌─────────────────┐
                    │  MESSAGE TO     │
                    │  USER           │
                    │                 │
                    │ "✅ Success!    │
                    │  Purchased      │
                    │  1GB MTN data"  │
                    └────────┬────────┘
                             │
                             │ WhatsApp Message
                             ▼
                    ┌─────────────────┐
                    │  END USER       │
                    │  (WhatsApp)     │
                    │                 │
                    │  Sees response  │
                    │  and continues  │
                    │  conversation   │
                    └─────────────────┘
```

## Data Flow for Different Services

### Data Purchase Flow

```
User: "Buy me 1GB of MTN data"
  ↓
AI determines: Need MTN data plan info
  ↓
Call: GET /api/whatsapp/data/plans (serviceID: mtn_sme)
  ↓
AI receives: Available plans with prices
  ↓
AI asks: "Which amount would you like?"
  ↓
User: "250 naira for 1GB"
  ↓
Call: POST /api/whatsapp/data/purchase
  ↓
Result: Transaction ID TXN_123456
  ↓
Response: "✅ You bought 1GB MTN data for ₦250"
```

### Cable Subscription Flow

```
User: "Subscribe me to DSTV"
  ↓
AI determines: Need DSTV subscription
  ↓
Call: GET /api/whatsapp/cable/plans (provider: DSTV)
  ↓
AI: "What's your decoder number?"
  ↓
User: "12345678"
  ↓
AI: "Which plan? Starter (₦2,000), Compact (₦4,500)..."
  ↓
User: "Starter"
  ↓
Call: POST /api/whatsapp/cable/purchase
  ↓
Response: "✅ DSTV Starter activated for decoder 12345678"
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS TABLE                             │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ whatsapp_phone (UNIQUE) ──┐                                 │
│ authenticated             │                                 │
│ user_id                   │                                 │
│ profile (JSON)            │                                 │
│ created_at                │                                 │
│ updated_at                │                                 │
└─────────────────────────────────────────────────────────────┘
           ▲                 │                  ▲
           │                 │                  │
           │ (FK)            │ (FK)             │ (FK)
           │                 ▼                  │
    ┌──────────────────┐   ┌──────────────────────┐
    │ CONVERSATIONS    │   │  API_CALLS_LOG       │
    ├──────────────────┤   ├──────────────────────┤
    │ id (PK)          │   │ id (PK)              │
    │ user_phone ──────┼───┼─────► user_phone     │
    │ session_id       │   │ endpoint             │
    │ user_message     │   │ request_payload      │
    │ ai_response      │   │ response             │
    │ context (JSON)   │   │ status               │
    │ created_at       │   │ error_message        │
    └──────────────────┘   │ created_at           │
                           └──────────────────────┘
```

## Component Dependencies

```
server.js
├── database.js (config)
├── bot.js (whatsapp)
│   ├── aiClient.js (ai)
│   │   ├── systemPrompt.js (ai)
│   │   └── [OPEN ROUTER API]
│   ├── mozosubzClient.js (api)
│   │   └── [MOZOSUBZ API]
│   └── conversationService.js (services)
│       └── database.js (config)
└── [EXPRESS SERVER]
    ├── /health endpoint
    └── /api/bot/status endpoint
```

## Deployment Architecture (Render)

```
┌────────────────────────────────────────────────────────────┐
│                    RENDER.COM                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  WEB SERVICE (Mozosubz Bot)                         │ │
│  │  • Node.js runtime                                  │ │
│  │  • Auto-deploys on GitHub push                      │ │
│  │  • Health checks enabled                            │ │
│  │  • Environment variables configured                 │ │
│  │                                                     │ │
│  │  Endpoints:                                         │ │
│  │  • GET /health                                      │ │
│  │  • GET /api/bot/status                              │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                                │
│                           │ connects to                     │
│                           ▼                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  PostgreSQL DATABASE                                │ │
│  │  • users table                                      │ │
│  │  • conversations table                              │ │
│  │  • api_calls_log table                              │ │
│  │                                                     │ │
│  │  Backups: Automatic                                 │ │
│  │  Storage: Managed by Render                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
           │                           │
           │                           │
     connects to:                  stores logs in:
           │                           │
           ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │ GITHUB REPO  │          │ DATABASE     │
    │              │          │              │
    │ bot/         │          │ users        │
    │ ├─ server.js │          │ conv...      │
    │ ├─ config/   │          │ api_calls... │
    │ ├─ whatsapp/ │          └──────────────┘
    │ ├─ ai/       │
    │ ├─ api/      │
    │ └─ services/ │
    │              │
    │ push → auto  │
    │ deploy       │
    └──────────────┘
```

## External Services

```
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ OPEN ROUTER API (poolside/laguna-m.1:free)          │   │
│  │ • Free tier available                               │   │
│  │ • AI/LLM inference                                  │   │
│  │ • Rate: ~100 requests per hour                      │   │
│  │ • Response time: 2-5 seconds                        │   │
│  │ • https://openrouter.ai                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ MOZOSUBZ API (api.mozosubz.xyz)                     │   │
│  │ • Data, Cable, Electricity services                │   │
│  │ • Balance & Deposit endpoints                       │   │
│  │ • Response time: 1-3 seconds                        │   │
│  │ • WhatsApp phone authentication                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WHATSAPP WEB                                        │   │
│  │ • WhatsApp Web.js library integration               │   │
│  │ • Uses emulated browser connection                  │   │
│  │ • Requires QR code auth on first run                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

This architecture ensures:
- **Scalability**: Each component can be scaled independently
- **Reliability**: Fallbacks and error handling at each layer
- **Maintainability**: Clear separation of concerns
- **Monitoring**: Comprehensive logging at every stage
- **Security**: API keys in environment variables only
