#!/bin/bash

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🧹 Clearing turbo cache..."
rm -rf .turbo

echo "✅ Cache cleared!"
echo ""
echo "✨ Cache config applied:"
echo "   - Client components: Fresh data on mount"
echo "   - Server components: dynamic + revalidate = 0"
echo "   - Global: staleTimes set to 0"
echo ""
echo "🚀 Starting fresh development server..."
echo ""

npm run dev
