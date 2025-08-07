#!/bin/bash

# Xcode Cloud CI Post-Clone Script
# This script runs after the repository is cloned in Xcode Cloud

set -e

echo "🚀 Starting Xcode Cloud CI setup..."

# Navigate to the repository directory
# In Xcode Cloud, the repository is typically in /Volumes/workspace/repository
if [ -n "$CI_WORKSPACE" ]; then
    echo "📁 Using CI_WORKSPACE: $CI_WORKSPACE"
    cd "$CI_WORKSPACE"
else
    echo "📁 CI_WORKSPACE not set, navigating to repository directory..."
    # Navigate to the repository directory (up from ios/ci_scripts)
    cd /Volumes/workspace/repository
fi

echo "📁 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Check if we're in Xcode Cloud environment
if [ -n "$CI_XCODE_CLOUD" ]; then
    echo "📦 Xcode Cloud environment detected"
    
    # Install Node.js using Homebrew if not available
    if ! command -v node &> /dev/null; then
        echo "📦 Installing Node.js using Homebrew..."
        # Install Homebrew if not available
        if ! command -v brew &> /dev/null; then
            echo "📦 Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            # Add Homebrew to PATH
            export PATH="/opt/homebrew/bin:$PATH"
        fi
        brew install node
    fi
    
    # Now Node.js should be available
    if command -v node &> /dev/null; then
        echo "📦 Node.js is available, installing dependencies..."
        npm ci
        
        echo "🔧 Installing Expo CLI..."
        npm install -g @expo/cli
    else
        echo "❌ Error: Failed to install Node.js"
        exit 1
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
    echo "❌ Error: iOS directory not found in $(pwd)"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Xcode Cloud CI setup completed successfully!" 