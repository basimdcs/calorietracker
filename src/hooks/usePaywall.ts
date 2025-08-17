import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useRevenueCatContext } from '../contexts/RevenueCatContext';

export interface PaywallOptions {
  requiredEntitlement?: string;
  offering?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export const usePaywall = () => {
  const [isPresenting, setIsPresenting] = useState(false);
  const { state, actions } = useRevenueCatContext();

  /**
   * Check if user needs to see paywall for a specific entitlement
   */
  const needsPaywall = useCallback((entitlement: string = 'pro'): boolean => {
    if (!state.isInitialized) return false;
    
    // Check if user has the required entitlement
    switch (entitlement) {
      case 'pro':
        return !(state.subscriptionStatus.tier === 'PRO' && state.subscriptionStatus.isActive);
      default:
        return true; // Unknown entitlement, show paywall
    }
  }, [state.isInitialized, state.subscriptionStatus]);

  /**
   * Present paywall using RevenueCat's UI
   */
  const presentPaywall = useCallback(async (options: PaywallOptions = {}) => {
    const { requiredEntitlement = 'pro', offering, onSuccess, onError, onCancel } = options;

    if (!state.isInitialized) {
      // Enhanced error with more debugging info
      const error = `RevenueCat is not initialized yet. State: ${JSON.stringify({
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
        error: state.error,
        tier: state.subscriptionStatus.tier
      })}`;
      console.error('❌ Paywall initialization check failed:', error);
      
      // Try to initialize if not already loading
      if (!state.isLoading && !state.error) {
        console.log('🔄 Attempting to initialize RevenueCat before paywall...');
        try {
          await actions.initializeRevenueCat();
          // Wait a moment for state to update then recurse
          setTimeout(() => presentPaywall(options), 500);
          return false;
        } catch (initError) {
          console.error('❌ Failed to initialize RevenueCat:', initError);
        }
      }
      
      onError?.(error);
      return false;
    }

    if (isPresenting) {
      console.log('⏳ Paywall is already being presented');
      return false;
    }

    setIsPresenting(true);

    try {
      console.log('🎬 Presenting RevenueCat paywall...');
      
      const paywallResult = await RevenueCatUI.presentPaywall({
        offering: offering,
      });

      console.log('💳 Paywall result:', paywallResult);

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          console.log('✅ Purchase completed successfully');
          // Refresh customer info to get updated subscription status
          await actions.refreshCustomerInfo();
          onSuccess?.();
          return true;
          
        case PAYWALL_RESULT.CANCELLED:
          console.log('❌ Purchase cancelled by user');
          onCancel?.();
          return false;
          
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('ℹ️ Paywall not presented (user may already have entitlement)');
          onCancel?.();
          return false;
          
        case PAYWALL_RESULT.ERROR:
          console.error('❌ Error presenting paywall');
          const errorMsg = 'There was an error processing your purchase. Please try again.';
          onError?.(errorMsg);
          return false;
          
        case PAYWALL_RESULT.RESTORED:
          console.log('🔄 Purchases restored successfully');
          await actions.refreshCustomerInfo();
          onSuccess?.();
          return true;
          
        default:
          console.log('🤷 Unknown paywall result:', paywallResult);
          onCancel?.();
          return false;
      }
    } catch (error) {
      // Enhanced error handling for specific RevenueCat errors
      let errorMsg = 'There was an error loading the paywall. Please check your internet connection and try again.';
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        console.error('❌ Detailed paywall error:', {
          message: errorObj.message,
          code: errorObj.code,
          userInfo: errorObj.userInfo,
          fullError: error
        });
        
        // Handle specific error codes
        if (errorObj.code === 23 || errorObj.message?.includes('configuration')) {
          errorMsg = `Configuration Error (${errorObj.code || '23'})\n\n` +
            'This usually means:\n' +
            '• App Store Connect agreements need to be signed\n' +
            '• Products not in "Ready to Submit" status\n' +
            '• Banking/tax info incomplete\n' +
            '• Changes still propagating (wait 24hrs)\n\n' +
            'For TestFlight: Check App Store Connect agreements and product status.';
        } else if (errorObj.code === 7 || errorObj.message?.includes('network')) {
          errorMsg = 'Network error. Please check your internet connection and try again.';
        } else if (errorObj.message) {
          errorMsg = `RevenueCat Error: ${errorObj.message}`;
        }
      }
      
      console.error('❌ Error presenting paywall:', error);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsPresenting(false);
    }
  }, [state.isInitialized, isPresenting, actions]);

  /**
   * Present paywall only if user doesn't have required entitlement
   */
  const presentPaywallIfNeeded = useCallback(async (options: PaywallOptions = {}) => {
    const { requiredEntitlement = 'pro', offering, onSuccess, onError, onCancel } = options;

    if (!state.isInitialized) {
      // Enhanced error with more debugging info
      const error = `RevenueCat is not initialized yet. State: ${JSON.stringify({
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
        error: state.error,
        tier: state.subscriptionStatus.tier
      })}`;
      console.error('❌ PaywallIfNeeded initialization check failed:', error);
      
      // Try to initialize if not already loading
      if (!state.isLoading && !state.error) {
        console.log('🔄 Attempting to initialize RevenueCat before paywall...');
        try {
          await actions.initializeRevenueCat();
          // Wait a moment for state to update then recurse
          setTimeout(() => presentPaywallIfNeeded(options), 500);
          return false;
        } catch (initError) {
          console.error('❌ Failed to initialize RevenueCat:', initError);
        }
      }
      
      onError?.(error);
      return false;
    }

    if (isPresenting) {
      console.log('⏳ Paywall is already being presented');
      return false;
    }

    setIsPresenting(true);

    try {
      console.log('🎬 Presenting paywall if needed for entitlement:', requiredEntitlement);
      
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlement,
        offering: offering,
      });

      console.log('💳 Paywall if needed result:', paywallResult);

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          console.log('✅ Purchase completed successfully');
          await actions.refreshCustomerInfo();
          onSuccess?.();
          return true;
          
        case PAYWALL_RESULT.CANCELLED:
          console.log('❌ Purchase cancelled by user');
          onCancel?.();
          return false;
          
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('ℹ️ Paywall not presented - user already has entitlement');
          // User already has entitlement, this is actually success
          onSuccess?.();
          return true;
          
        case PAYWALL_RESULT.ERROR:
          console.error('❌ Error presenting paywall');
          const errorMsg = 'There was an error processing your purchase. Please try again.';
          onError?.(errorMsg);
          return false;
          
        case PAYWALL_RESULT.RESTORED:
          console.log('🔄 Purchases restored successfully');
          await actions.refreshCustomerInfo();
          onSuccess?.();
          return true;
          
        default:
          console.log('🤷 Unknown paywall result:', paywallResult);
          onCancel?.();
          return false;
      }
    } catch (error) {
      // Enhanced error handling for specific RevenueCat errors
      let errorMsg = 'There was an error loading the paywall. Please check your internet connection and try again.';
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        console.error('❌ Detailed paywall if needed error:', {
          message: errorObj.message,
          code: errorObj.code,
          userInfo: errorObj.userInfo,
          fullError: error
        });
        
        // Handle specific error codes
        if (errorObj.code === 23 || errorObj.message?.includes('configuration')) {
          errorMsg = `Configuration Error (${errorObj.code || '23'})\n\n` +
            'This usually means:\n' +
            '• App Store Connect agreements need to be signed\n' +
            '• Products not in "Ready to Submit" status\n' +
            '• Banking/tax info incomplete\n' +
            '• Changes still propagating (wait 24hrs)\n\n' +
            'For TestFlight: Check App Store Connect agreements and product status.';
        } else if (errorObj.code === 7 || errorObj.message?.includes('network')) {
          errorMsg = 'Network error. Please check your internet connection and try again.';
        } else if (errorObj.message) {
          errorMsg = `RevenueCat Error: ${errorObj.message}`;
        }
      }
      
      console.error('❌ Error presenting paywall if needed:', error);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsPresenting(false);
    }
  }, [state.isInitialized, isPresenting, actions]);

  /**
   * Present paywall with simple Alert-based feedback
   */
  const presentPaywallWithAlert = useCallback(async (options: Omit<PaywallOptions, 'onSuccess' | 'onError' | 'onCancel'> = {}) => {
    return await presentPaywall({
      ...options,
      onSuccess: () => {
        Alert.alert(
          'Purchase Successful!',
          'Welcome to CalorieTracker Pro! You now have 300 voice recordings per month.',
        );
      },
      onError: (error) => {
        Alert.alert('Error', error);
      },
      onCancel: () => {
        // Silent cancel, no alert needed
      },
    });
  }, [presentPaywall]);

  /**
   * Present paywall if needed with simple Alert-based feedback
   */
  const presentPaywallIfNeededWithAlert = useCallback(async (options: Omit<PaywallOptions, 'onSuccess' | 'onError' | 'onCancel'> = {}) => {
    return await presentPaywallIfNeeded({
      ...options,
      onSuccess: () => {
        // Only show success alert if purchase was actually made
        if (needsPaywall(options.requiredEntitlement)) {
          Alert.alert(
            'Purchase Successful!',
            'Welcome to CalorieTracker Pro! You now have 300 voice recordings per month.',
          );
        }
      },
      onError: (error) => {
        Alert.alert('Error', error);
      },
      onCancel: () => {
        // Silent cancel, no alert needed
      },
    });
  }, [presentPaywallIfNeeded, needsPaywall]);

  return {
    // State
    isPresenting,
    needsPaywall,
    
    // Methods
    presentPaywall,
    presentPaywallIfNeeded,
    presentPaywallWithAlert,
    presentPaywallIfNeededWithAlert,
  };
};