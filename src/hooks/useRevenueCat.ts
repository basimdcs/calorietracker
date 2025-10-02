import { useState, useEffect, useCallback, useRef } from 'react';
import Purchases, { 
  CustomerInfo, 
  PurchasesOfferings, 
  PurchasesOffering, 
  PurchasesPackage,
  PurchasesError,
} from 'react-native-purchases';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  resetUsageCount: () => Promise<void>;
  getAvailablePackages: () => PurchasesPackage[];
  getMonthlyPackage: () => PurchasesPackage | null;
  getYearlyPackage: () => PurchasesPackage | null;
  setUserStoreCallback: (callback: (subscriptionStatus: SubscriptionStatus) => void) => void;
  debugSubscriptionStatus: () => Promise<string>;
  forceRefreshSubscriptionStatus: () => Promise<void>;
}

const DEFAULT_USAGE_LIMITS = {
  FREE: 10,
  PRO: 300, // 300 recordings per month for Pro tier
};

// AsyncStorage keys for persistent usage tracking
const USAGE_STORAGE_KEY = 'revenue_cat_usage_info';
const LAST_RESET_KEY = 'revenue_cat_last_reset';

// Helper functions for persistent usage tracking
const saveUsageToStorage = async (usageInfo: UsageInfo) => {
  try {
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageInfo));
    await AsyncStorage.setItem(LAST_RESET_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save usage to storage:', error);
  }
};

const loadUsageFromStorage = async (): Promise<{ recordingsUsed: number; lastReset: Date } | null> => {
  try {
    const usageData = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
    const lastResetData = await AsyncStorage.getItem(LAST_RESET_KEY);
    
    if (usageData && lastResetData) {
      const parsedUsage = JSON.parse(usageData);
      const lastReset = new Date(lastResetData);
      
      // Check if we need to reset for new month
      const now = new Date();
      const isNewMonth = now.getMonth() !== lastReset.getMonth() || 
                         now.getFullYear() !== lastReset.getFullYear();
      
      if (isNewMonth) {
        console.log('🔄 New month detected - resetting usage count');
        return { recordingsUsed: 0, lastReset: now };
      }
      
      return { recordingsUsed: parsedUsage.recordingsUsed || 0, lastReset };
    }
  } catch (error) {
    console.warn('Failed to load usage from storage:', error);
  }
  
  return null;
};

const resetUsageStorage = async () => {
  try {
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify({ recordingsUsed: 0 }));
    await AsyncStorage.setItem(LAST_RESET_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to reset usage storage:', error);
  }
};

const useRevenueCat = () => {
  // Simplified refs
  const isInitializingRef = useRef(false);
  const hasListenerRef = useRef(false);
  const currentUserIdRef = useRef<string | undefined>();
  const userStoreCallbackRef = useRef<((subscriptionStatus: SubscriptionStatus) => void) | null>(null);
  
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

  // Helper function to notify userStore of subscription changes
  const notifyUserStore = useCallback((subscriptionStatus: SubscriptionStatus) => {
    if (userStoreCallbackRef.current) {
      console.log('📞 Notifying userStore of subscription change:', subscriptionStatus.tier);
      userStoreCallbackRef.current(subscriptionStatus);
    }
  }, []);

  // Helper function to parse subscription status from CustomerInfo
  const parseSubscriptionStatus = useCallback((customerInfo: CustomerInfo): SubscriptionStatus => {
    console.log('📊 Parsing subscription status from CustomerInfo');
    console.log('🔍 Raw CustomerInfo:', {
      originalAppUserId: customerInfo.originalAppUserId,
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions || {}),
      allPurchasedProducts: customerInfo.allPurchasedProductIdentifiers || [],
      latestExpirationDate: customerInfo.latestExpirationDate,
    });
    
    // Check for active entitlements with comprehensive logging
    const entitlements = customerInfo.entitlements.active;
    console.log('🔍 Active entitlements object:', entitlements);
    console.log('🔍 All entitlement keys:', Object.keys(entitlements || {}));
    
    // Try multiple approaches to find Pro entitlement
    let proEntitlement = null;
    
    // Method 1: Exact match (lowercase 'pro')
    proEntitlement = entitlements[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO];
    console.log('🔍 Method 1 - Exact match "pro":', proEntitlement ? 'FOUND' : 'NOT FOUND');
    
    // Method 2: Case-insensitive search if exact match fails
    if (!proEntitlement) {
      const entitlementKeys = Object.keys(entitlements || {});
      const proKey = entitlementKeys.find(key => 
        key.toLowerCase() === REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO.toLowerCase()
      );
      if (proKey) {
        proEntitlement = entitlements[proKey];
        console.log('🔍 Method 2 - Case-insensitive match:', proKey, proEntitlement ? 'FOUND' : 'NOT FOUND');
      }
    }
    
    // Method 3: Fallback - check if any entitlement contains 'pro'
    if (!proEntitlement) {
      const entitlementKeys = Object.keys(entitlements || {});
      const proKey = entitlementKeys.find(key => 
        key.toLowerCase().includes('pro')
      );
      if (proKey) {
        proEntitlement = entitlements[proKey];
        console.log('🔍 Method 3 - Contains "pro" match:', proKey, proEntitlement ? 'FOUND' : 'NOT FOUND');
      }
    }
    
    // Method 4: Ultimate fallback - check purchased products directly
    let hasProProduct = false;
    if (!proEntitlement) {
      const purchasedProducts = customerInfo.allPurchasedProductIdentifiers || [];
      const expectedProducts = [
        REVENUE_CAT_CONFIG.PRODUCT_IDS.PRO_MONTHLY,
        REVENUE_CAT_CONFIG.PRODUCT_IDS.PRO_YEARLY
      ];
      
      hasProProduct = expectedProducts.some(productId => 
        purchasedProducts.includes(productId)
      );
      console.log('🔍 Method 4 - Direct product check:', hasProProduct ? 'HAS PRO PRODUCT' : 'NO PRO PRODUCT');
      console.log('🔍 Purchased products:', purchasedProducts);
      console.log('🔍 Expected products:', expectedProducts);
    }
    
    // Log the found entitlement details
    if (proEntitlement) {
      console.log('✅ Found Pro entitlement:', {
        identifier: proEntitlement.identifier,
        productIdentifier: proEntitlement.productIdentifier,
        isActive: proEntitlement.isActive,
        willRenew: proEntitlement.willRenew,
        expirationDate: proEntitlement.expirationDate,
        periodType: proEntitlement.periodType,
        store: proEntitlement.store,
      });
    }
    
    // Create subscription status - consider both entitlement and direct product purchase
    const isProActive = (proEntitlement && proEntitlement.isActive) || hasProProduct;
    
    const subscriptionStatus = isProActive ? {
      isActive: true,
      tier: 'PRO' as const,
      expirationDate: proEntitlement?.expirationDate ? 
        new Date(proEntitlement.expirationDate) : undefined,
      willRenew: proEntitlement?.willRenew || false,
      isInGracePeriod: false, // Grace period not directly available in current API
      productIdentifier: proEntitlement?.productIdentifier,
    } : {
      isActive: false,
      tier: 'FREE' as const,
      willRenew: false,
      isInGracePeriod: false,
    };

    console.log('📊 Final subscription status:', {
      tier: subscriptionStatus.tier,
      isActive: subscriptionStatus.isActive,
      productIdentifier: subscriptionStatus.productIdentifier,
      foundViaEntitlement: !!proEntitlement,
      foundViaProduct: hasProProduct,
    });
    
    // Notify userStore of changes
    notifyUserStore(subscriptionStatus);
    
    return subscriptionStatus;
  }, [notifyUserStore]);

  // Helper function to calculate usage info - stable, no dependencies
  const calculateUsageInfo = useCallback((subscriptionStatus: SubscriptionStatus, currentUsage: number = 0): UsageInfo => {
    const limit = DEFAULT_USAGE_LIMITS[subscriptionStatus.tier];
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1); // First day of next month
    resetDate.setHours(0, 0, 0, 0);
    
    const usageInfo = {
      recordingsUsed: currentUsage,
      recordingsLimit: limit,
      recordingsRemaining: Math.max(0, limit - currentUsage),
      resetDate,
    };

    // Save to storage whenever we calculate usage info
    saveUsageToStorage(usageInfo).catch(console.warn);
    
    return usageInfo;
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
      console.log('🚀 RevenueCat: Starting initialization with persistent usage...');
      
      // Import and initialize
      const { initializeRevenueCat: initRC } = await import('../config/revenueCat');
      await initRC(userID);
      
      // Get customer info
      const PurchasesInstance = getPurchasesInstance();
      const customerInfo = await PurchasesInstance.getCustomerInfo();
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      // Load persistent usage data or start fresh
      const persistedUsage = await loadUsageFromStorage();
      const currentUsage = persistedUsage?.recordingsUsed || 0;
      const usageInfo = calculateUsageInfo(subscriptionStatus, currentUsage);
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        customerInfo,
        subscriptionStatus,
        usageInfo,
        error: null,
      }));
      
      console.log('✅ RevenueCat: Initialized successfully with usage:', currentUsage);
      
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
      
      // Log basic subscription info
      console.log('🔍 Customer info refreshed:', {
        userId: customerInfo.originalAppUserId,
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions || {}),
        activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
      });

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

  // Reset usage count (for testing/debugging)
  const resetUsageCount = useCallback(async () => {
    try {
      console.log('🔄 Resetting usage count to 0...');
      await resetUsageStorage();

      setState(prev => {
        const usageInfo = calculateUsageInfo(prev.subscriptionStatus, 0);
        console.log('✅ Usage count reset successfully');
        return {
          ...prev,
          usageInfo,
        };
      });
    } catch (error) {
      console.error('❌ Failed to reset usage count:', error);
    }
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

  // Set callback for userStore sync
  const setUserStoreCallback = useCallback((callback: (subscriptionStatus: SubscriptionStatus) => void) => {
    console.log('🔗 Setting userStore callback for subscription sync');
    userStoreCallbackRef.current = callback;
  }, []);

  // Debug function to force subscription status check and return info for UI display
  const debugSubscriptionStatus = useCallback(async (): Promise<string> => {
    try {
      const PurchasesInstance = getPurchasesInstance();
      const customerInfo = await PurchasesInstance.getCustomerInfo();
      
      // Collect debug information for UI display
      const debugInfo = {
        // Basic customer info
        originalAppUserId: customerInfo.originalAppUserId,
        activeSubscriptions: Object.keys(customerInfo.activeSubscriptions || {}),
        allPurchasedProducts: customerInfo.allPurchasedProductIdentifiers || [],
        latestExpirationDate: customerInfo.latestExpirationDate,
        
        // Entitlements (what we're checking for subscription status)
        activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
        allEntitlements: Object.keys(customerInfo.entitlements?.all || {}),
        
        // Raw entitlement objects for detailed inspection
        rawActiveEntitlements: customerInfo.entitlements?.active || {},
        rawAllEntitlements: customerInfo.entitlements?.all || {},
        
        // What we're looking for
        expectedEntitlement: REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO,
        expectedProducts: [
          REVENUE_CAT_CONFIG.PRODUCT_IDS.PRO_MONTHLY,
          REVENUE_CAT_CONFIG.PRODUCT_IDS.PRO_YEARLY
        ],
        
        // Current app state
        currentTier: state.subscriptionStatus.tier,
        isActive: state.subscriptionStatus.isActive,
        isInitialized: state.isInitialized,
        hasError: !!state.error,
        error: state.error,
      };
      
      // Check if we have the expected entitlement (exact match)
      let hasProEntitlement = customerInfo.entitlements?.active?.[REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO];
      let foundEntitlementKey = REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO;
      
      // If exact match fails, try case-insensitive search
      if (!hasProEntitlement) {
        const activeEntitlements = customerInfo.entitlements?.active || {};
        const entitlementKeys = Object.keys(activeEntitlements);
        
        // Try case-insensitive match
        foundEntitlementKey = entitlementKeys.find(key => 
          key.toLowerCase() === REVENUE_CAT_CONFIG.ENTITLEMENTS.PRO.toLowerCase()
        ) || '';
        
        if (foundEntitlementKey) {
          hasProEntitlement = activeEntitlements[foundEntitlementKey];
        } else {
          // Try partial match
          foundEntitlementKey = entitlementKeys.find(key => 
            key.toLowerCase().includes('pro')
          ) || '';
          
          if (foundEntitlementKey) {
            hasProEntitlement = activeEntitlements[foundEntitlementKey];
          }
        }
      }
      
      // Format detailed entitlement info
      let entitlementDetails = '';
      if (hasProEntitlement) {
        entitlementDetails = `
FOUND ENTITLEMENT DETAILS:
• Key: "${foundEntitlementKey}"
• Identifier: ${hasProEntitlement.identifier || 'N/A'}
• Product ID: ${hasProEntitlement.productIdentifier || 'N/A'}
• Is Active: ${hasProEntitlement.isActive ? 'YES' : 'NO'}
• Will Renew: ${hasProEntitlement.willRenew ? 'YES' : 'NO'}
• Store: ${hasProEntitlement.store || 'N/A'}
• Period Type: ${hasProEntitlement.periodType || 'N/A'}
• Expiration: ${hasProEntitlement.expirationDate ? new Date(hasProEntitlement.expirationDate).toLocaleDateString() : 'None'}`;
      }
      
      // Check purchased products as backup
      const hasProProduct = debugInfo.expectedProducts.some(productId => 
        debugInfo.allPurchasedProducts.includes(productId)
      );
      
      // Force a new subscription status parse to test our fix
      console.log('🔄 Testing enhanced subscription parsing...');
      const testSubscriptionStatus = parseSubscriptionStatus(customerInfo);
      console.log('🔄 Test parse result:', testSubscriptionStatus);
      
      // Format debug info for display
      const debugText = `ENHANCED REVENUECAT DEBUG RESULTS

USER INFO:
• User ID: ${debugInfo.originalAppUserId || 'Anonymous'}
• Latest Expiration: ${debugInfo.latestExpirationDate ? new Date(debugInfo.latestExpirationDate).toLocaleDateString() : 'None'}

ACTIVE SUBSCRIPTIONS:
• Found: ${debugInfo.activeSubscriptions.length > 0 ? debugInfo.activeSubscriptions.join(', ') : 'None'}
• Expected: ${debugInfo.expectedProducts.join(', ')}

ENTITLEMENTS:
• Active Keys: ${debugInfo.activeEntitlements.join(', ') || 'None'}
• All Keys: ${debugInfo.allEntitlements.join(', ') || 'None'}
• Looking for: "${debugInfo.expectedEntitlement}"
• Has Pro: ${hasProEntitlement ? 'YES ✅' : 'NO ❌'}${entitlementDetails}

PURCHASED PRODUCTS:
• All Products: ${debugInfo.allPurchasedProducts.length > 0 ? debugInfo.allPurchasedProducts.join(', ') : 'None'}
• Has Pro Product: ${hasProProduct ? 'YES ✅' : 'NO ❌'}

CURRENT APP STATE:
• Tier: ${debugInfo.currentTier}
• Active: ${debugInfo.isActive ? 'YES' : 'NO'}
• Initialized: ${debugInfo.isInitialized ? 'YES' : 'NO'}
• Error: ${debugInfo.error || 'None'}

TEST PARSE RESULTS:
• Test Tier: ${testSubscriptionStatus.tier}
• Test Active: ${testSubscriptionStatus.isActive ? 'YES' : 'NO'}

RAW ENTITLEMENT KEYS:
${Object.keys(debugInfo.rawActiveEntitlements).map(key => `• "${key}"`).join('\n') || '• None'}

${hasProEntitlement ? 
  `✅ ENTITLEMENT FOUND! 
${testSubscriptionStatus.tier === 'PRO' ? 
  '✅ PARSING SUCCESSFUL - Pro status detected!' : 
  '❌ PARSING FAILED - Pro entitlement found but not recognized by parser'}` : 
  `❌ NO ACTIVE PRO ENTITLEMENT FOUND
${hasProProduct ? '• Has Pro product but no entitlement' : '• No Pro product or entitlement'}

POSSIBLE CAUSES:
• Entitlement name mismatch in RevenueCat dashboard
• Case sensitivity issue with entitlement keys
• Subscription not properly configured in RevenueCat`
}`;
      
      return debugText;
      
    } catch (error) {
      return `❌ ENHANCED DEBUG FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, [parseSubscriptionStatus, state]);

  // Force refresh subscription status - useful for testing fixes
  const forceRefreshSubscriptionStatus = useCallback(async () => {
    try {
      console.log('🔄 Force refreshing subscription status...');
      
      const PurchasesInstance = getPurchasesInstance();
      
      // Force get fresh customer info from RevenueCat servers (not cache)
      const customerInfo = await PurchasesInstance.getCustomerInfo();
      
      console.log('🔄 Received fresh customer info, parsing subscription status...');
      const subscriptionStatus = parseSubscriptionStatus(customerInfo);
      
      setState(prev => {
        const usageInfo = calculateUsageInfo(subscriptionStatus, prev.usageInfo.recordingsUsed);
        
        console.log('🔄 Updated state with new subscription status:', {
          tier: subscriptionStatus.tier,
          isActive: subscriptionStatus.isActive,
          productIdentifier: subscriptionStatus.productIdentifier,
        });
        
        return {
          ...prev,
          customerInfo,
          subscriptionStatus,
          usageInfo,
          error: null,
        };
      });
      
      console.log('✅ Force refresh completed successfully');
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Force refresh failed',
      }));
    }
  }, [parseSubscriptionStatus, calculateUsageInfo]);

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
    resetUsageCount,
    getAvailablePackages,
    getMonthlyPackage,
    getYearlyPackage,
    setUserStoreCallback,
    debugSubscriptionStatus,
    forceRefreshSubscriptionStatus,
  };

  return {
    state,
    actions,
  };
};

export default useRevenueCat;