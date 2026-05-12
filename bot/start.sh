#!/bin/bash

# Mozosubz WhatsApp Bot - Quick Start Script

echo "🤖 Mozosubz WhatsApp Bot - Setup & Run"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Navigate to bot directory
cd "$(dirname "$0")" || exit 1

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Setting up environment variables..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env with your configuration:"
        echo "   - OPENROUTER_API_KEY (get from https://openrouter.ai)"
        echo "   - DATABASE_URL (PostgreSQL connection string)"
        echo ""
        echo "Run this script again after configuring .env"
        exit 0
    else
        echo "❌ .env.example not found"
        exit 1
    fi
fi

echo "✅ .env file exists"

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting Mozosubz WhatsApp Bot..."
echo "======================================="
echo ""

# Start the bot
npm run bot:start
