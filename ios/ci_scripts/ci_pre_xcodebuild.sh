#!/bin/bash

# Xcode Cloud CI Pre-Build Script
# This script runs before the Xcode build starts

set -e

echo "🔨 Starting pre-build setup..."

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

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are we in the right directory?"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

# Verify iOS directory exists
if [ ! -d "ios" ]; then
    echo "❌ Error: iOS directory not found."
    exit 1
fi

# Navigate to iOS directory
cd ios

# Verify Podfile exists
if [ ! -f "Podfile" ]; then
    echo "❌ Error: Podfile not found in ios directory."
    exit 1
fi

# Verify Pods directory exists
if [ ! -d "Pods" ]; then
    echo "⚠️  Warning: Pods directory not found. Running pod install..."
    pod install
fi

# Verify the specific configuration file exists
if [ ! -f "Pods/Target Support Files/Pods-CalorieTracker/Pods-CalorieTracker.release.xcconfig" ]; then
    echo "⚠️  Warning: Pods configuration file not found. Running pod install..."
    pod install
fi

echo "✅ Pre-build setup completed successfully!" 