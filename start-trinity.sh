#!/bin/bash

# Trinity APML Visualiser Startup Script
# Beautiful simulator aesthetics with real-time APML validation

echo "🎨 Starting Trinity APML Visualiser..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Build the application
echo "🔨 Building Trinity APML Visualiser..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build completed successfully"

# Check for APML files
apml_count=$(ls -1 *.apml 2>/dev/null | wc -l)
if [ $apml_count -eq 0 ]; then
    echo "⚠️  No APML files found in current directory"
    echo "💡 Create some .apml files to see beautiful visualizations!"
else
    echo "📁 Found $apml_count APML file(s) ready for visualization"
fi

# Display startup information
echo ""
echo "🚀 Starting Trinity APML Visualiser with beautiful simulator aesthetics..."
echo ""
echo "✨ Features enabled:"
echo "   📱 Beautiful iPhone simulator with dark theme"
echo "   🗺️  Interactive Mermaid flow diagrams"
echo "   🔍 Real-time APML validation"
echo "   💬 Trinity assistant chat"
echo "   🔄 Live file watching and updates"
echo "   🎨 Railway-inspired design aesthetics"
echo ""
echo "🌐 Server will be available at:"
echo "   Local:   http://localhost:3000"
echo "   Network: http://0.0.0.0:3000"
echo ""
echo "📋 Available routes:"
echo "   📝 Input:           http://localhost:3000/#/"
echo "   📊 Dashboard:       http://localhost:3000/#/dashboard"
echo "   ✨ Trinity:         http://localhost:3000/#/trinity"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
node server.js

# Cleanup message
echo ""
echo "✨ Trinity APML Visualiser stopped gracefully"
echo "🙏 Thank you for using Trinity with beautiful simulator aesthetics!"