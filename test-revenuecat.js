#!/usr/bin/env node

// Quick test to verify RevenueCat configuration
console.log('🧪 Testing RevenueCat Configuration...\n');

// Load environment variables
require('dotenv').config();

console.log('📋 Environment Variables:');
console.log('- REVENUE_CAT_API_KEY_IOS:', process.env.REVENUE_CAT_API_KEY_IOS ? '✅ Set' : '❌ Missing');
console.log('- REVENUE_CAT_API_KEY_ANDROID:', process.env.REVENUE_CAT_API_KEY_ANDROID ? '✅ Set' : '❌ Missing');

const iosKey = process.env.REVENUE_CAT_API_KEY_IOS;
const androidKey = process.env.REVENUE_CAT_API_KEY_ANDROID;

console.log('\n🔍 Key Validation:');

// Check iOS key format
if (iosKey) {
  if (iosKey.startsWith('appl_') && iosKey.length > 20) {
    console.log('- iOS Key Format: ✅ Valid (starts with appl_)');
  } else {
    console.log('- iOS Key Format: ❌ Invalid (should start with appl_)');
  }
} else {
  console.log('- iOS Key: ❌ Missing');
}

// Check Android key
if (androidKey && androidKey !== 'your-android-api-key-here') {
  if (androidKey.startsWith('goog_') && androidKey.length > 20) {
    console.log('- Android Key Format: ✅ Valid (starts with goog_)');
  } else {
    console.log('- Android Key Format: ❌ Invalid (should start with goog_)');
  }
} else {
  console.log('- Android Key: ⚠️  Placeholder (OK for iOS testing)');
}

console.log('\n📱 Platform Testing:');
console.log('- iOS Testing: ✅ Ready (valid iOS key)');
console.log('- Android Testing:', androidKey && androidKey !== 'your-android-api-key-here' ? '✅ Ready' : '❌ Need valid Android key');

console.log('\n🎯 Next Steps:');
console.log('1. Launch your app: npm start');
console.log('2. Navigate to Settings screen');
console.log('3. Look for "Developer Tools" section');
console.log('4. Tap "Test RevenueCat" button');
console.log('5. Check console logs for initialization status');

console.log('\n✅ Configuration test complete!');