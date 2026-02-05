#!/bin/bash

# VyOS Web UI Development Startup Script

echo "Starting VyOS Web UI Development Environment..."

# Create necessary directories
mkdir -p backend/data
mkdir -p frontend/public

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build the backend
echo "Building backend..."
cd backend
cargo build

echo ""
echo "Setup complete!"
echo ""
echo "To start the development servers:"
echo "1. Terminal 1: cd backend && cargo run"
echo "2. Terminal 2: cd frontend && npm run dev"
echo ""
echo "The backend will run on http://localhost:8080"
echo "The frontend will run on http://localhost:3000"