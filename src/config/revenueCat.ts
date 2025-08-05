import Purchases, { PurchasesConfiguration } from 'react-native-purchases';
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
    ELITE_MONTHLY: 'calorie_tracker_elite_monthly', 
    ELITE_YEARLY: 'calorie_tracker_elite_yearly',
  },
  
  // Entitlement identifiers (these should match your RevenueCat dashboard)
  ENTITLEMENTS: {
    PRO: 'pro',
    ELITE: 'elite',
  },
} as const;

// RevenueCat initialization function
export const initializeRevenueCat = async (userID?: string): Promise<void> => {
  try {
    console.log('🚀 Initializing RevenueCat...');
    
    // Configure RevenueCat with platform-specific API key
    const apiKey = Platform.OS === 'ios' 
      ? REVENUE_CAT_CONFIG.API_KEY_IOS 
      : REVENUE_CAT_CONFIG.API_KEY_ANDROID;
    
    const configuration: PurchasesConfiguration = {
      apiKey,
      appUserID: userID, // Optional: pass undefined to use anonymous IDs
      observerMode: false, // Set to true if you handle purchases yourself
      userDefaultsSuiteName: undefined, // iOS only
      useAmazonSandbox: false, // Android only
      shouldShowInAppMessagesAutomatically: true, // iOS only
      entitlementVerificationMode: 'disabled', // For now, can enable later for additional security
    };
    
    await Purchases.configure(configuration);
    
    // Set up debug logging (remove in production)
    if (__DEV__) {
      await Purchases.setLogLevel('DEBUG');
      console.log('📊 RevenueCat debug logging enabled');
    }
    
    console.log('✅ RevenueCat initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
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
export const getProductIdForTier = (tier: 'PRO' | 'ELITE', period: 'MONTHLY' | 'YEARLY'): string => {
  const key = `${tier}_${period}` as keyof typeof REVENUE_CAT_CONFIG.PRODUCT_IDS;
  return REVENUE_CAT_CONFIG.PRODUCT_IDS[key];
};

export const getEntitlementForTier = (tier: 'PRO' | 'ELITE'): string => {
  return REVENUE_CAT_CONFIG.ENTITLEMENTS[tier];
};