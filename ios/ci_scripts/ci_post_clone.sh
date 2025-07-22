#!/bin/bash

# Xcode Cloud CI Post-Clone Script
# This script runs after the repository is cloned in Xcode Cloud

set -e

echo "🚀 Starting Xcode Cloud CI setup..."

# Navigate to the project root
cd $CI_WORKSPACE

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

# Install Expo CLI globally
echo "🔧 Installing Expo CLI..."
npm install -g @expo/cli

# Install CocoaPods if not available
if ! command -v pod &> /dev/null; then
    echo "📱 Installing CocoaPods..."
    sudo gem install cocoapods
fi

# Navigate to iOS directory and install pods
echo "📱 Installing CocoaPods dependencies..."
cd ios
pod install --repo-update

echo "✅ Xcode Cloud CI setup completed successfully!" 