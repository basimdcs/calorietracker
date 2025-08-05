import { useState, useEffect, useCallback, useRef } from 'react';
import Purchases, { 
  CustomerInfo, 
  Offerings, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesError,
} from 'react-native-purchases';
import { Alert } from 'react-native';
import { REVENUE_CAT_CONFIG } from '../config/revenueCat';

// Types for our subscription system
export interface SubscriptionStatus {
  isActive: boolean;
  tier: 'FREE' | 'PRO' | 'ELITE';
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
  offerings: Offerings | null;
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
  PRO: 300,
  ELITE: null, // unlimited
};

const useRevenueCat = () => {
  // Refs to prevent re-initialization and track listener state
  const hasInitializedRef = useRef(false);
  const hasListenerRef = useRef(false);
  const currentUserIdRef = useRef<string | undefined>();
  
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
      resetDate: new Date(),
    },
    error: null,
  });

  // Helper function to parse subscription status from CustomerInfo
  const parseSubscriptionStatus = useCallback((customerInfo: CustomerInfo): SubscriptionStatus => {
    console.log('📊 Parsing subscription status from CustomerInfo');
    
    // Check for active entitlements
    const entitlements = customerInfo.entitlements.active;
    
    if (entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.ELITE]) {
      const entitlement = entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.ELITE];
      return {
        isActive: true,
        tier: 'ELITE',
        expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined,
        willRenew: entitlement.willRenew,
        isInGracePeriod: entitlement.isInGracePeriod,
        productIdentifier: entitlement.productIdentifier,
      };
    }
    
    if (entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO]) {
      const entitlement = entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO];
      return {
        isActive: true,
        tier: 'PRO',
        expirationDate: entitlement.expirationDate ? new Date(entitlement.expirationDate) : undefined,
        willRenew: entitlement.willRenew,
        isInGracePeriod: entitlement.isInGracePeriod,
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
    
    hasInitializedRef.current = true;
    currentUserIdRef.current = userID;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🚀 Initializing RevenueCat...');
      
      const { initializeRevenueCat: initRC } = await import('../config/revenueCat');
      await initRC(userID);
      
      // Get initial customer info
      const customerInfo = await Purchases.getCustomerInfo();
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
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
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      hasInitializedRef.current = false; // Reset on error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize RevenueCat',
      }));
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

  // Refresh customer info - use functional state updates to avoid dependency
  const refreshCustomerInfo = useCallback(async () => {
    try {
      console.log('🔄 Refreshing customer info...');
      const customerInfo = await Purchases.getCustomerInfo();
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
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
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
      if (error instanceof PurchasesError) {
        // Handle specific RevenueCat errors
        switch (error.code) {
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
            errorMessage = error.message || 'Purchase failed';
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
      
      const customerInfo = await Purchases.restorePurchases();
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
      const offerings = await Purchases.getOfferings();
      
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
      const { customerInfo } = await Purchases.logIn(userID);
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
      const { customerInfo } = await Purchases.logOut();
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

    // Add listener
    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up RevenueCat listeners...');
      hasListenerRef.current = false;
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, [state.isInitialized, parseSubscriptionStatus, calculateUsageInfo]);

  // Reset initialization state (useful for testing or error recovery)
  const resetInitialization = useCallback(() => {
    console.log('🔄 Resetting RevenueCat initialization state...');
    hasInitializedRef.current = false;
    hasListenerRef.current = false;
    currentUserIdRef.current = undefined;
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