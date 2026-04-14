#!/bin/bash
set -e

echo "🏗️  Building Next.js static export..."

# Build Next.js with Twilio Functions URL
# Note: Set NEXT_PUBLIC_API_BASE_URL before running this script
npm run build

echo "📦 Copying static files to Twilio Assets..."
rm -rf twilio/assets/*
cp -r out/* twilio/assets/

echo "🔍 Verifying assets copied..."
if [ ! -f "twilio/assets/index.html" ]; then
  echo "❌ Error: index.html not found in twilio/assets/"
  exit 1
fi

echo "✅ Assets copied successfully"
echo ""
echo "🚀 Deploying to Twilio Serverless..."
cd twilio
twilio serverless:deploy --override-existing-project

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your dashboard should be live at the URL shown above"
echo ""
echo "Next steps:"
echo "1. Visit the URL to test the dashboard"
echo "2. Check browser console for errors"
echo "3. Test crime data loading"
echo "4. Test SMS notification flow"
