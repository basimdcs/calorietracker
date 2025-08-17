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
  recordingsLimit: number; // Monthly recording limit
  recordingsRemaining: number;
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
  getAvailablePackages: () => PurchasesPackage[];
  getMonthlyPackage: () => PurchasesPackage | null;
  getYearlyPackage: () => PurchasesPackage | null;
}

const DEFAULT_USAGE_LIMITS = {
  FREE: 10,
  PRO: 300, // 300 recordings per month for Pro tier
};

const useRevenueCat = () => {
  // Simplified refs
  const isInitializingRef = useRef(false);
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
      recordingsRemaining: Math.max(0, limit - currentUsage),
      resetDate,
    };
  }, []);

  // SIMPLIFIED RevenueCat initialization - no complex retry logic
  const initializeRevenueCat = useCallback(async (userID?: string) => {
    // Simple guard - only allow one initialization at a time
    if (isInitializingRef.current) {
      console.log('⏭️ RevenueCat init skipped - already in progress');
      return;
    }
    
    if (state.isInitialized) {
      console.log('⏭️ RevenueCat init skipped - already initialized');
      return;
    }
    
    isInitializingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('🚀 RevenueCat: Starting simple initialization...');
      
      // Import and initialize
      const { initializeRevenueCat: initRC } = await import('../config/revenueCat');
      await initRC(userID);
      
      // Get customer info
      const PurchasesInstance = getPurchasesInstance();
      const customerInfo = await PurchasesInstance.getCustomerInfo();
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
      
      console.log('✅ RevenueCat: Initialized successfully');
      
    } catch (error) {
      console.error('❌ RevenueCat: Initialization failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
        subscriptionStatus: {
          isActive: false,
          tier: 'FREE',
          willRenew: false,
          isInGracePeriod: false,
        },
      }));
    } finally {
      isInitializingRef.current = false;
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

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

  // SIMPLIFIED offerings fetch 
  const getOfferings = useCallback(async () => {
    try {
      console.log('📦 RevenueCat: Fetching offerings...');
      const PurchasesInstance = getPurchasesInstance();
      const offerings = await PurchasesInstance.getOfferings();
      
      setState(prev => ({
        ...prev,
        offerings,
      }));
      
      console.log('✅ RevenueCat: Offerings fetched');
    } catch (error: any) {
      console.warn('⚠️ RevenueCat: Offerings fetch failed (Error 23 expected in simulator)');
      // Don't set error state for offerings failure - let paywall still work
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

  // SIMPLIFIED reset 
  const resetInitialization = useCallback(() => {
    console.log('🔄 RevenueCat: Resetting...');
    isInitializingRef.current = false;
    hasListenerRef.current = false;
    setState(prev => ({
      ...prev,
      isInitialized: false,
      isLoading: false,
      error: null,
      subscriptionStatus: {
        isActive: false,
        tier: 'FREE',
        willRenew: false,
        isInGracePeriod: false,
      },
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

  // Helper functions to easily access product packages
  const getAvailablePackages = useCallback((): PurchasesPackage[] => {
    return state.offerings?.current?.availablePackages || [];
  }, [state.offerings]);

  const getMonthlyPackage = useCallback((): PurchasesPackage | null => {
    return state.offerings?.current?.monthly || null;
  }, [state.offerings]);

  const getYearlyPackage = useCallback((): PurchasesPackage | null => {
    return state.offerings?.current?.annual || null;
  }, [state.offerings]);

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
    getAvailablePackages,
    getMonthlyPackage,
    getYearlyPackage,
  };

  return {
    state,
    actions,
  };
};

export default useRevenueCat;