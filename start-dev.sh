#!/bin/bash

# Start Development Servers Script

echo "🚀 Starting Online Auction Platform..."
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "Please create it: cd backend && cp .env.example .env"
    echo ""
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found!"
    echo "Please create it: cd frontend && cp .env.example .env"
    echo ""
    exit 1
fi

# Check if MongoDB is running
echo "📦 Checking MongoDB connection..."
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo "⚠️  MongoDB is not running!"
    echo "Please start MongoDB first. See MONGODB_SETUP.md for instructions."
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

# Start Backend
echo ""
echo "🔧 Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "📍 Backend:  http://localhost:5000"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
