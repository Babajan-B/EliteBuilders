#!/bin/bash

# Send Invitation Email Script
# This script uses Supabase Admin API to send invitation emails

EMAIL="b.babajaan@gmail.com"
ROLE="sponsor"
NAME="Test Sponsor User"

echo "📧 Sending invitation email to: $EMAIL as $ROLE"
echo ""

# Get Supabase Service Role Key from env
if [ -f "/Users/jaan/Desktop/Hackathon/elitebuilders/.env.local" ]; then
    source /Users/jaan/Desktop/Hackathon/elitebuilders/.env.local
else
    echo "❌ Error: .env.local file not found"
    exit 1
fi

# Check if server is running
if ! curl -s http://localhost:3000/api/health/db > /dev/null 2>&1; then
    echo "❌ Error: Server not running on port 3000"
    echo "   Please start the server first with: ./START_SERVER.sh"
    exit 1
fi

echo "✅ Server is running"
echo ""

# First, we need to login as admin to get session
# Since we can't easily get cookies from curl, we'll need to use a different approach
# Let's check if there's an admin user and use the service role key directly

echo "🔑 Attempting to send invitation via API..."
echo ""

# Try to call the API
response=$(curl -s -X POST http://localhost:3000/api/admin/invite \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"role\": \"$ROLE\",
    \"name\": \"$NAME\"
  }")

echo "Response: $response"
echo ""

# Check if it worked
if echo "$response" | grep -q "ok.*true"; then
    echo "✅ Success! Invitation sent to $EMAIL"
    echo ""
    echo "Check your email inbox for the invitation with login credentials."
else
    echo "❌ Error sending invitation"
    echo ""
    echo "This API endpoint requires admin authentication."
    echo "Please login as admin in the browser first, then retry."
    echo ""
    echo "Admin credentials:"
    echo "  Email: babajan@bioinformaticsbb.com"
    echo "  Password: proteins123"
fi

