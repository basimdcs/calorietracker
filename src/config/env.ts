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
        return key;
      }
    } catch (error) {
      // Silent fail
    }
  }

  return defaultValue;
};

// Enhanced environment variable getter for RevenueCat keys specifically
const getRevenueCatKey = (keyName: string): string => {
  // Try both regular and EXPO_PUBLIC prefixed versions
  const regularKey = getEnvironmentVariable(keyName, 'not-found');
  if (regularKey !== 'not-found') {
    return regularKey;
  }
  
  // Try EXPO_PUBLIC prefixed version
  const expoPublicKey = getEnvironmentVariable(`EXPO_PUBLIC_${keyName}`, 'not-found');
  if (expoPublicKey !== 'not-found') {
    return expoPublicKey;
  }
  
  return 'your-api-key-here';
};

// Specific accessors for each API key
const getOpenAIKey = (): string => getEnvironmentVariable('OPENAI_API_KEY', 'your-api-key-here');
const getGeminiKey = (): string => getEnvironmentVariable('GEMINI_API_KEY', 'your-gemini-api-key-here');
const getRevenueCatIOSKey = (): string => getRevenueCatKey('REVENUE_CAT_API_KEY_IOS');
const getRevenueCatAndroidKey = (): string => getRevenueCatKey('REVENUE_CAT_API_KEY_ANDROID');

// Enhanced environment variable loading with multiple fallback strategies
const getEnvironmentConfig = (): EnvironmentConfig => {
  const openaiApiKey = getOpenAIKey();
  const geminiApiKey = getGeminiKey();
  const revenueCatIOSKey = getRevenueCatIOSKey();
  const revenueCatAndroidKey = getRevenueCatAndroidKey();

  return {
    OPENAI_API_KEY: openaiApiKey,
    GEMINI_API_KEY: geminiApiKey,
    REVENUE_CAT_API_KEY_IOS: revenueCatIOSKey,
    REVENUE_CAT_API_KEY_ANDROID: revenueCatAndroidKey,
  };
};

export const env = getEnvironmentConfig(); 