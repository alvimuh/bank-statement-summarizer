#!/bin/bash

echo "🚀 Starting Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set GOOGLE_API_KEY for backend"
echo "3. Test the deployed application" 