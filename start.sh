#!/bin/bash

# Time Boxed Backend Startup Script

echo "🚀 Starting Time Boxed Auth Backend..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || echo "GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password
PORT=3000" > .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  Please edit .env file and add your Gmail credentials!"
    echo "   GMAIL_USER=your-email@gmail.com"
    echo "   GMAIL_APP_PASSWORD=your-app-password"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 Starting server..."
npm start
