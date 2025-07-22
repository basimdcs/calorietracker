#!/bin/bash

# Xcode Cloud CI Post-Clone Script
# This script runs after the repository is cloned in Xcode Cloud

set -e

echo "🚀 Starting Xcode Cloud CI setup..."

# Navigate to the project root (go up two levels from ios/ci_scripts)
cd $CI_WORKSPACE

# Check if we're in Xcode Cloud environment
if [ -n "$CI_XCODE_CLOUD" ]; then
    echo "📦 Xcode Cloud environment detected"
    
    # Use the Node.js version that comes with Xcode Cloud
    # If Node.js is not available, we'll skip npm commands for now
    if command -v node &> /dev/null; then
        echo "📦 Node.js is available, installing dependencies..."
        npm ci
        
        echo "🔧 Installing Expo CLI..."
        npm install -g @expo/cli
    else
        echo "⚠️ Node.js not available in Xcode Cloud environment"
        echo "📦 Skipping Node.js dependency installation"
    fi
else
    echo "📦 Local environment detected"
    npm ci
    npm install -g @expo/cli
fi

# Install CocoaPods if not available
if ! command -v pod &> /dev/null; then
    echo "📱 Installing CocoaPods..."
    sudo gem install cocoapods
fi

# Navigate to iOS directory and install pods
echo "📱 Installing CocoaPods dependencies..."
if [ -d "ios" ]; then
    cd ios
    pod install --repo-update
else
    echo "❌ Error: iOS directory not found in $CI_WORKSPACE"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Xcode Cloud CI setup completed successfully!" 