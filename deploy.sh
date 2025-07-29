#!/bin/bash

echo "🚀 Trinity APML Visualiser - Production Deployment"
echo "================================================="

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
npm run build

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build successful! dist/ directory created"
    echo "📊 Build size:"
    du -sh dist/
    echo "📁 Build contents:"
    ls -la dist/
else
    echo "❌ Build failed! No dist/ directory found"
    exit 1
fi

# Check API function
if [ -f "api/index.js" ]; then
    echo "✅ Serverless API function ready"
else
    echo "❌ API function missing"
    exit 1
fi

# Check Vercel config
if [ -f "vercel.json" ]; then
    echo "✅ Vercel configuration ready"
else
    echo "❌ Vercel configuration missing"
    exit 1
fi

echo ""
echo "🎯 Deployment Ready!"
echo "===================="
echo "✅ Frontend built to dist/"
echo "✅ API serverless function: api/index.js"
echo "✅ Vercel config: vercel.json"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m \"Production build for deployment\""
echo "3. git push origin main"
echo "4. Deploy to Vercel or connect to GitHub for auto-deploy"
echo ""
echo "🔗 The chat-based feedback system with CR export is ready!"