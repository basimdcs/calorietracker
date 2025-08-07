// Environment configuration for EAS builds
// This file handles environment variables in both development and production

import Constants from 'expo-constants';

interface EnvironmentConfig {
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  REVENUE_CAT_API_KEY_IOS: string;
  REVENUE_CAT_API_KEY_ANDROID: string;
}

// Generic environment variable accessor that works in production
const getEnvironmentVariable = (keyName: string, defaultValue: string = 'not-configured'): string => {
  // Try all possible sources in order of preference
  const sources = [
    () => process.env[keyName],
    () => Constants.expoConfig?.extra?.[keyName],
    () => (Constants.manifest as any)?.extra?.[keyName],
    () => (Constants.manifest2 as any)?.extra?.[keyName],
  ];

  for (const source of sources) {
    try {
      const key = source();
      if (key && key !== 'your-api-key-here' && key !== 'not-configured' && key.length > 5) {
        console.log(`✅ Found ${keyName} from source:`, source.name || 'unknown');
        return key;
      }
    } catch (error) {
      console.log(`❌ Error accessing ${keyName} from source:`, error);
    }
  }

  console.log(`❌ No valid ${keyName} found in any source`);
  return defaultValue;
};

// Specific accessors for each API key
const getOpenAIKey = (): string => getEnvironmentVariable('OPENAI_API_KEY', 'your-api-key-here');
const getGeminiKey = (): string => getEnvironmentVariable('GEMINI_API_KEY', 'your-gemini-api-key-here');
const getRevenueCatIOSKey = (): string => getEnvironmentVariable('REVENUE_CAT_API_KEY_IOS', 'your-ios-api-key-here');
const getRevenueCatAndroidKey = (): string => getEnvironmentVariable('REVENUE_CAT_API_KEY_ANDROID', 'your-android-api-key-here');

// Enhanced environment variable loading with multiple fallback strategies
const getEnvironmentConfig = (): EnvironmentConfig => {
  const openaiApiKey = getOpenAIKey();
  const geminiApiKey = getGeminiKey();
  const revenueCatIOSKey = getRevenueCatIOSKey();
  const revenueCatAndroidKey = getRevenueCatAndroidKey();
  
  // Enhanced debugging information
  const debugInfo = {
    hasOpenAIKey: !!openaiApiKey,
    hasGeminiKey: !!geminiApiKey,
    hasRevenueCatIOSKey: !!revenueCatIOSKey,
    hasRevenueCatAndroidKey: !!revenueCatAndroidKey,
    openaiKeyLength: openaiApiKey?.length || 0,
    geminiKeyLength: geminiApiKey?.length || 0,
    revenueCatIOSKeyLength: revenueCatIOSKey?.length || 0,
    revenueCatAndroidKeyLength: revenueCatAndroidKey?.length || 0,
    buildEnvironment: process.env.EAS_BUILD ? 'production' : 'development',
    processEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('GEMINI') || key.includes('REVENUE_CAT')),
    nodeEnv: process.env.NODE_ENV,
    platform: process.env.EAS_PLATFORM || 'unknown',
    constantsAvailable: !!Constants,
    expoConfigAvailable: !!Constants.expoConfig,
    manifestAvailable: !!Constants.manifest,
    manifest2Available: !!Constants.manifest2,
    expoConfigExtra: !!Constants.expoConfig?.extra,
    manifestExtra: !!(Constants.manifest as any)?.extra,
    manifest2Extra: !!(Constants.manifest2 as any)?.extra
  };
  
  console.log('🔍 Environment Config Debug:', debugInfo);
  
  // Log all environment variables that might contain our keys (for debugging)
  Object.keys(process.env).forEach(key => {
    if (key.includes('OPENAI') || key.includes('GEMINI') || key.includes('REVENUE_CAT') || key.includes('API')) {
      console.log(`🔑 Found env var: ${key} = ${process.env[key]?.substring(0, 10)}...`);
    }
  });

  // Log Constants information
  console.log('📱 Constants Debug:', {
    expoConfig: Constants.expoConfig ? 'Available' : 'Not available',
    manifest: Constants.manifest ? 'Available' : 'Not available',
    manifest2: Constants.manifest2 ? 'Available' : 'Not available',
    expoConfigExtra: Constants.expoConfig?.extra ? 'Available' : 'Not available',
    manifestExtra: (Constants.manifest as any)?.extra ? 'Available' : 'Not available',
    manifest2Extra: (Constants.manifest2 as any)?.extra ? 'Available' : 'Not available'
  });

  // Log the actual RevenueCat keys (first 10 chars for security)
  console.log('🔑 RevenueCat Keys Debug:', {
    iosKey: revenueCatIOSKey ? `${revenueCatIOSKey.substring(0, 10)}...` : 'NOT FOUND',
    androidKey: revenueCatAndroidKey ? `${revenueCatAndroidKey.substring(0, 10)}...` : 'NOT FOUND',
    iosKeyLength: revenueCatIOSKey?.length || 0,
    androidKeyLength: revenueCatAndroidKey?.length || 0,
    iosKeyStartsWithAppl: revenueCatIOSKey?.startsWith('appl_') || false,
    androidKeyStartsWithGoog: revenueCatAndroidKey?.startsWith('goog_') || false,
  });

  return {
    OPENAI_API_KEY: openaiApiKey,
    GEMINI_API_KEY: geminiApiKey,
    REVENUE_CAT_API_KEY_IOS: revenueCatIOSKey,
    REVENUE_CAT_API_KEY_ANDROID: revenueCatAndroidKey,
  };
};

export const env = getEnvironmentConfig(); 