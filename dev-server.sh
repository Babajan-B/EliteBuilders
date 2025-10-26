#!/bin/bash

# EliteBuilders Development Server
echo "🚀 Starting EliteBuilders Development Server..."
pkill -f "next dev" 2>/dev/null
sleep 2
cd elitebuilders && npm run dev
