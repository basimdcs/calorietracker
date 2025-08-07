import Purchases, { 
  PurchasesConfiguration,
  LOG_LEVEL 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { env } from './env';

// RevenueCat configuration constants
export const REVENUE_CAT_CONFIG = {
  // API keys from environment configuration
  API_KEY_IOS: env.REVENUE_CAT_API_KEY_IOS,
  API_KEY_ANDROID: env.REVENUE_CAT_API_KEY_ANDROID,
  
  // Subscription product identifiers
  PRODUCT_IDS: {
    PRO_MONTHLY: 'calorie_tracker_pro_monthly',
    PRO_YEARLY: 'calorie_tracker_pro_yearly',
  },
  
  // Entitlement identifiers (these should match your RevenueCat dashboard)
  ENTITLEMENTS: {
    PRO: 'pro',
  },
} as const;

// Get the Purchases instance
export const getPurchasesInstance = () => {
  return Purchases;
};

// RevenueCat initialization function
export const initializeRevenueCat = async (userID?: string): Promise<void> => {
  try {
    console.log('🚀 Initializing RevenueCat...');
    
    // Get the appropriate API key for the platform
    const apiKey = Platform.OS === 'ios' 
      ? REVENUE_CAT_CONFIG.API_KEY_IOS 
      : REVENUE_CAT_CONFIG.API_KEY_ANDROID;
      
    console.log('🔑 Using RevenueCat API key:', {
      platform: Platform.OS,
      keyPreview: apiKey.substring(0, 10) + '...',
      keyLength: apiKey.length
    });
    
    // Validate API key format
    if (!apiKey || apiKey.length < 20) {
      throw new Error('Invalid RevenueCat API key: Key is too short or missing');
    }
    
    // Check if it's a valid API key format (should start with 'appl_' for iOS or 'goog_' for Android)
    const isValidFormat = Platform.OS === 'ios' 
      ? apiKey.startsWith('appl_')
      : apiKey.startsWith('goog_');
      
    if (!isValidFormat) {
      const expectedPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';
      throw new Error(
        `Invalid RevenueCat API key format for ${Platform.OS}. ` +
        `Expected ${expectedPrefix} prefix. ` +
        `Make sure you're using the PUBLIC API key from RevenueCat dashboard, not a Secret API key or Web Billing key. ` +
        `Go to Project Settings → API Keys in your RevenueCat dashboard.`
      );
    }
    
    // Use the new object-based configuration method
    const configuration: PurchasesConfiguration = {
      apiKey,
      appUserID: userID, // Optional: pass undefined to use anonymous IDs
    };
    
    // Add a small delay to ensure proper initialization order
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await Purchases.configure(configuration);
    
    // Set up debug logging (remove in production)
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      console.log('📊 RevenueCat debug logging enabled');
    }
    
    console.log('✅ RevenueCat configured successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
    
    // Provide specific guidance for common errors
    if (error instanceof Error) {
      if (error.message.includes('Web Billing or Paddle API key')) {
        throw new Error(
          '❌ WRONG API KEY TYPE DETECTED!\n\n' +
          'You are using a Web Billing or Paddle API key instead of a RevenueCat Public API key.\n\n' +
          '🔧 TO FIX:\n' +
          '1. Go to RevenueCat Dashboard → Project Settings → API Keys\n' +
          '2. Copy the PUBLIC API key (starts with "appl_" for iOS or "goog_" for Android)\n' +
          '3. Do NOT use Secret API keys (start with "sk_")\n' +
          '4. Do NOT use Web Billing or Paddle keys\n\n' +
          '📖 More info: https://docs.revenuecat.com/docs/api-keys'
        );
      } else if (error.message.includes('Invalid API key')) {
        throw new Error(
          '❌ INVALID API KEY!\n\n' +
          'Please check your RevenueCat API key configuration.\n\n' +
          '🔧 TO FIX:\n' +
          '1. Verify you\'re using the correct project in RevenueCat\n' +
          '2. Ensure your bundle ID/package name matches RevenueCat project\n' +
          '3. Use Public API keys (not Secret keys)\n' +
          '4. Check that the key starts with "appl_" (iOS) or "goog_" (Android)'
        );
      }
    }
    
    throw error;
  }
};

// Helper function to identify user (call after login/signup)
export const identifyRevenueCatUser = async (userID: string): Promise<void> => {
  try {
    console.log('👤 Identifying RevenueCat user:', userID);
    await Purchases.logIn(userID);
    console.log('✅ User identified successfully');
  } catch (error) {
    console.error('❌ Failed to identify user:', error);
    throw error;
  }
};

// Helper function to logout user
export const logoutRevenueCatUser = async (): Promise<void> => {
  try {
    console.log('👋 Logging out RevenueCat user');
    await Purchases.logOut();
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('❌ Failed to logout user:', error);
    throw error;
  }
};

// Product ID mapping helpers
export const getProductIdForTier = (tier: 'PRO', period: 'MONTHLY' | 'YEARLY'): string => {
  const key = `${tier}_${period}` as keyof typeof REVENUE_CAT_CONFIG.PRODUCT_IDS;
  return REVENUE_CAT_CONFIG.PRODUCT_IDS[key];
};

export const getEntitlementForTier = (tier: 'PRO'): string => {
  return REVENUE_CAT_CONFIG.ENTITLEMENTS[tier];
};