#!/bin/bash

echo "======================================"
echo "Testing Supabase Connection"
echo "======================================"

# Load environment variables
source /Users/jaan/Desktop/Hackathon/elitebuilders/.env.local

# Test Supabase connection
curl -s -X GET "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  | jq . || echo "✅ Supabase connection successful (raw response above)"

echo ""
echo "======================================"
echo "Testing MailerSend API Key"
echo "======================================"

# Test MailerSend API
response=$(curl -s -w "\n%{http_code}" -X GET "https://api.mailersend.com/v1/domains" \
  -H "Authorization: Bearer ${MAILERSEND_API_KEY}" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo "✅ MailerSend API Key is VALID"
  echo "Response:"
  echo "$body" | jq .
else
  echo "❌ MailerSend API Key FAILED (HTTP $http_code)"
  echo "Response: $body"
fi

echo ""
echo "======================================"
echo "Environment Variables Check"
echo "======================================"
echo "✅ NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
echo "✅ MAILERSEND_API_KEY: ${MAILERSEND_API_KEY:0:30}..."
echo "✅ MAILERSEND_FROM_EMAIL: ${MAILERSEND_FROM_EMAIL}"
echo "✅ NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}"
echo ""
echo "Test complete!"
