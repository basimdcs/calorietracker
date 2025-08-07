import { useState, useEffect, useCallback, useRef } from 'react';
import Purchases, { 
  CustomerInfo, 
  PurchasesOfferings, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesError,
} from 'react-native-purchases';
import { Alert } from 'react-native';
import { REVENUE_CAT_CONFIG, getPurchasesInstance } from '../config/revenueCat';

// Types for our subscription system
export interface SubscriptionStatus {
  isActive: boolean;
  tier: 'FREE' | 'PRO';
  expirationDate?: Date;
  willRenew: boolean;
  isInGracePeriod: boolean;
  productIdentifier?: string;
}

export interface UsageInfo {
  recordingsUsed: number;
  recordingsLimit: number | null; // null means unlimited
  recordingsRemaining: number | null;
  resetDate: Date;
}

export interface RevenueCatState {
  isInitialized: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  subscriptionStatus: SubscriptionStatus;
  usageInfo: UsageInfo;
  error: string | null;
}

export interface RevenueCatActions {
  initializeRevenueCat: (userID?: string) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getOfferings: () => Promise<void>;
  identifyUser: (userID: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  resetInitialization: () => void;
  updateUsageCount: (increment?: number) => void;
}

const DEFAULT_USAGE_LIMITS = {
  FREE: 10,
  PRO: null, // unlimited for Pro tier
};

const useRevenueCat = () => {
  // Refs to prevent re-initialization and track listener state
  const hasInitializedRef = useRef(false);
  const hasListenerRef = useRef(false);
  const currentUserIdRef = useRef<string | undefined>(undefined);
  const initializationAttemptsRef = useRef(0);
  const maxInitializationAttempts = 3;
  
  const [state, setState] = useState<RevenueCatState>({
    isInitialized: false,
    isLoading: false,
    customerInfo: null,
    offerings: null,
    subscriptionStatus: {
      isActive: false,
      tier: 'FREE',
      willRenew: false,
      isInGracePeriod: false,
    },
    usageInfo: {
      recordingsUsed: 0,
      recordingsLimit: DEFAULT_USAGE_LIMITS.FREE,
      recordingsRemaining: DEFAULT_USAGE_LIMITS.FREE,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
    error: null,
  });

  // Helper function to parse subscription status from CustomerInfo
  const parseSubscriptionStatus = useCallback((customerInfo: CustomerInfo): SubscriptionStatus => {
    console.log('📊 Parsing subscription status from CustomerInfo');
    
    // Check for active entitlements
    const entitlements = customerInfo.entitlements.active;
    
    if (entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO]) {
      const entitlement = entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO];
      return {
        isActive: true,
        tier: 'PRO',
        expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined,
        willRenew: entitlement.willRenew,
        isInGracePeriod: false, // Grace period not directly available in current API
        productIdentifier: entitlement.productIdentifier,
      };
    }
    
    // Default to FREE tier
    return {
      isActive: false,
      tier: 'FREE',
      willRenew: false,
      isInGracePeriod: false,
    };
  }, []);

  // Helper function to calculate usage info - stable, no dependencies
  const calculateUsageInfo = useCallback((subscriptionStatus: SubscriptionStatus, currentUsage: number = 0): UsageInfo => {
    const limit = DEFAULT_USAGE_LIMITS[subscriptionStatus.tier];
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1); // First day of next month
    resetDate.setHours(0, 0, 0, 0);
    
    return {
      recordingsUsed: currentUsage,
      recordingsLimit: limit,
      recordingsRemaining: limit ? Math.max(0, limit - currentUsage) : null,
      resetDate,
    };
  }, []);

  // Initialize RevenueCat - with initialization guard
  const initializeRevenueCat = useCallback(async (userID?: string) => {
    // Prevent re-initialization
    if (hasInitializedRef.current || state.isInitialized) {
      console.log('⏭️ RevenueCat already initialized, skipping...');
      return;
    }
    
    // Check if already loading
    if (state.isLoading) {
      console.log('⏳ RevenueCat initialization already in progress...');
      return;
    }
    
    // More lenient attempt limits for TestFlight
    const { isTestFlightBuild } = await import('../config/revenueCat');
    const maxAttempts = isTestFlightBuild() ? 5 : maxInitializationAttempts;
    
    // Prevent too many initialization attempts
    if (initializationAttemptsRef.current >= maxAttempts) {
      console.log(`⏭️ RevenueCat initialization blocked - too many attempts (${initializationAttemptsRef.current}/${maxAttempts})`);
      
      // For TestFlight, set a fallback mode
      if (isTestFlightBuild()) {
        console.log('🧪 TestFlight: Setting fallback mode without RevenueCat');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'TestFlight mode: RevenueCat unavailable (subscriptions may not be approved yet)',
        }));
      }
      return;
    }
    
    // For TestFlight, be more lenient with API key errors
    if (state.error && state.error.includes('Invalid API key') && !isTestFlightBuild()) {
      console.log('⏭️ RevenueCat initialization blocked due to API key error');
      return;
    }
    
    initializationAttemptsRef.current += 1;
    hasInitializedRef.current = true;
    currentUserIdRef.current = userID;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🚀 Initializing RevenueCat... (attempt', initializationAttemptsRef.current, '/', maxAttempts, ')');
      
      // Check if API keys are configured
      const { env } = await import('../config/env');
      console.log('🔍 RevenueCat API Key Check:', {
        hasIOSKey: !!env.REVENUE_CAT_API_KEY_IOS,
        keyLength: env.REVENUE_CAT_API_KEY_IOS?.length,
        keyPreview: env.REVENUE_CAT_API_KEY_IOS?.substring(0, 10) + '...',
        isPlaceholder: env.REVENUE_CAT_API_KEY_IOS === 'your-ios-api-key-here',
        isTestFlight: isTestFlightBuild(),
        buildEnvironment: process.env.NODE_ENV
      });
      
      if (!env.REVENUE_CAT_API_KEY_IOS || env.REVENUE_CAT_API_KEY_IOS === 'your-ios-api-key-here') {
        const errorMsg = `RevenueCat API key not configured. Found: "${env.REVENUE_CAT_API_KEY_IOS}". Please add REVENUE_CAT_API_KEY_IOS to your .env file.`;
        
        // For TestFlight, set fallback mode instead of failing
        if (isTestFlightBuild()) {
          console.warn('⚠️ TestFlight build detected with missing API key - using fallback mode');
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'TestFlight mode: API key not properly configured',
            subscriptionStatus: { ...prev.subscriptionStatus, tier: 'FREE' }
          }));
          return;
        }
        
        throw new Error(errorMsg);
      }
      
      const { initializeRevenueCat: initRC } = await import('../config/revenueCat');
      await initRC(userID);
      
      // Get initial customer info with timeout for TestFlight
      const PurchasesInstance = getPurchasesInstance();
      
      let customerInfo;
      try {
        // Use a shorter timeout for TestFlight
        const timeout = isTestFlightBuild() ? 10000 : 30000;
        customerInfo = await Promise.race([
          PurchasesInstance.getCustomerInfo(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Customer info fetch timeout')), timeout)
          )
        ]) as any;
      } catch (customerError) {
        console.warn('⚠️ Failed to fetch initial customer info:', customerError);
        
        if (isTestFlightBuild()) {
          // For TestFlight, continue without customer info
          console.log('🧪 TestFlight: Continuing without initial customer info');
          customerInfo = null;
        } else {
          throw customerError;
        }
      }
      
      const subscriptionStatus = customerInfo ? parseSubscriptionStatus(customerInfo) : {
        isActive: false,
        tier: 'FREE' as const,
        willRenew: false,
        isInGracePeriod: false,
      };
      
      const usageInfo = calculateUsageInfo(subscriptionStatus);
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        customerInfo,
        subscriptionStatus,
        usageInfo,
        error: null,
      }));
      
      console.log('✅ RevenueCat initialized successfully');
      
      // For TestFlight, add additional warnings
      if (isTestFlightBuild()) {
        console.log('🧪 TestFlight build - subscriptions may not work until approved by Apple');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      hasInitializedRef.current = false; // Reset on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize RevenueCat';
      
      // Enhanced error handling for TestFlight
      let finalError = errorMessage;
      if (isTestFlightBuild()) {
        finalError = `TestFlight mode: ${errorMessage}\n\nThis is likely due to subscriptions not being approved yet. The app will work in free mode.`;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: finalError,
        subscriptionStatus: {
          isActive: false,
          tier: 'FREE',
          willRenew: false,
          isInGracePeriod: false,
        },
      }));
      
      // Don't throw error, just log it so app continues to work
      console.log('🔄 App will continue without RevenueCat integration');
    }
  }, [parseSubscriptionStatus, calculateUsageInfo, state.isInitialized, state.isLoading, state.error]);

  // Refresh customer info - use functional state updates to avoid dependency
  const refreshCustomerInfo = useCallback(async () => {
    try {
      console.log('🔄 Refreshing customer info...');
      const PurchasesInstance = getPurchasesInstance();
      const customerInfo = await PurchasesInstance.getCustomerInfo();
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        return {
          ...prev,
          customerInfo,
          subscriptionStatus,
          usageInfo,
          error: null,
        };
      });
      
      console.log('✅ Customer info refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh customer info:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh customer info',
      }));
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Purchase a package - use functional state updates
  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('💳 Attempting purchase:', packageToPurchase.identifier);
      
      const PurchasesInstance = getPurchasesInstance();
      const { customerInfo } = await PurchasesInstance.purchasePackage(packageToPurchase);
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        return {
          ...prev,
          isLoading: false,
          customerInfo,
          subscriptionStatus,
          usageInfo,
          error: null,
        };
      });
      
      console.log('✅ Purchase successful');
      return true;
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      let errorMessage = 'Purchase failed';
      if (error && typeof error === 'object' && 'code' in error) {
        // Handle specific RevenueCat errors
        switch ((error as any).code) {
          case 'PURCHASE_CANCELLED':
            errorMessage = 'Purchase was cancelled';
            break;
          case 'PAYMENT_PENDING':
            errorMessage = 'Payment is pending approval';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = (error as any).message || 'Purchase failed';
        }
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      return false;
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Restore purchases - use functional state updates
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🔄 Restoring purchases...');
      
      const PurchasesInstance = getPurchasesInstance();
      const customerInfo = await PurchasesInstance.restorePurchases();
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        return {
          ...prev,
          isLoading: false,
          customerInfo,
          subscriptionStatus,
          usageInfo,
          error: null,
        };
      });
      
      console.log('✅ Purchases restored successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to restore purchases',
      }));
      return false;
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Get offerings
  const getOfferings = useCallback(async () => {
    try {
      console.log('📦 Fetching offerings...');
      const PurchasesInstance = getPurchasesInstance();
      const offerings = await PurchasesInstance.getOfferings();
      
      setState(prev => ({
        ...prev,
        offerings,
        error: null,
      }));
      
      console.log('✅ Offerings fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch offerings:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch offerings',
      }));
    }
  }, []);

  // Identify user - use functional state updates
  const identifyUser = useCallback(async (userID: string) => {
    try {
      console.log('👤 Identifying user:', userID);
      currentUserIdRef.current = userID;
      const PurchasesInstance = getPurchasesInstance();
      const { customerInfo } = await PurchasesInstance.logIn(userID);
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        return {
          ...prev,
          customerInfo,
          subscriptionStatus,
          usageInfo,
          error: null,
        };
      });
      
      console.log('✅ User identified successfully');
    } catch (error) {
      console.error('❌ Failed to identify user:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to identify user',
      }));
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Logout user
  const logoutUser = useCallback(async () => {
    try {
      console.log('👋 Logging out user...');
      const PurchasesInstance = getPurchasesInstance();
      // logOut returns CustomerInfo directly in v9, not an object with customerInfo
      const customerInfo = await PurchasesInstance.logOut();
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      const usageInfo = calculateUsageInfo(subscriptionStatus);
      
      setState(prev => ({
        ...prev,
        customerInfo,
        subscriptionStatus,
        usageInfo,
        error: null,
      }));
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout user:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to logout user',
      }));
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Set up listeners for purchase updates - optimized to prevent re-renders
  useEffect(() => {
    if (!state.isInitialized || hasListenerRef.current) return;

    console.log('🔗 Setting up RevenueCat listeners...');
    hasListenerRef.current = true;
    
    const customerInfoListener = (customerInfo: CustomerInfo) => {
      console.log('📡 Customer info updated');
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      // Use functional state update to avoid dependency on current state
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        return {
          ...prev,
          customerInfo,
          subscriptionStatus,
          usageInfo,
        };
      });
    };

    const PurchasesInstance = getPurchasesInstance();
    
    // Add listener
    PurchasesInstance.addCustomerInfoUpdateListener(customerInfoListener);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up RevenueCat listeners...');
      hasListenerRef.current = false;
      try {
        PurchasesInstance.removeCustomerInfoUpdateListener(customerInfoListener);
      } catch (error) {
        console.warn('⚠️ Error removing RevenueCat listener:', error);
      }
    };
  }, [state.isInitialized, parseSubscriptionStatus, calculateUsageInfo]);

  // Reset initialization state (useful for testing or error recovery)
  const resetInitialization = useCallback(() => {
    console.log('🔄 Resetting RevenueCat initialization state...');
    hasInitializedRef.current = false;
    hasListenerRef.current = false;
    currentUserIdRef.current = undefined;
    initializationAttemptsRef.current = 0;
    setState(prev => ({
      ...prev,
      isInitialized: false,
      isLoading: false,
      error: null,
    }));
  }, []);

  // Update usage count (call this when user makes a recording)
  const updateUsageCount = useCallback((increment: number = 1) => {
    setState(prev => {
      const newUsed = prev.usageInfo.recordingsUsed + increment;
      const usageInfo = calculateUsageInfo(prev.subscriptionStatus, newUsed);
      return {
        ...prev,
        usageInfo,
      };
    });
  }, [calculateUsageInfo]);

  const actions: RevenueCatActions = {
    initializeRevenueCat,
    refreshCustomerInfo,
    purchasePackage,
    restorePurchases,
    getOfferings,
    identifyUser,
    logoutUser,
    resetInitialization,
    updateUsageCount,
  };

  return {
    state,
    actions,
  };
};

export default useRevenueCat;