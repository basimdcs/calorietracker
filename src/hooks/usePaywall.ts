import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import useRevenueCat from './useRevenueCat';

export interface PaywallOptions {
  requiredEntitlement?: string;
  offering?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export const usePaywall = () => {
  const [isPresenting, setIsPresenting] = useState(false);
  const { state, actions } = useRevenueCat();

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
      const error = 'RevenueCat is not initialized yet. Please try again.';
      console.error('❌', error);
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
      const errorMsg = 'There was an error loading the paywall. Please check your internet connection and try again.';
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
      const error = 'RevenueCat is not initialized yet. Please try again.';
      console.error('❌', error);
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
      const errorMsg = 'There was an error loading the paywall. Please check your internet connection and try again.';
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
          'Welcome to CalorieTracker Pro! You now have unlimited voice recordings.',
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
            'Welcome to CalorieTracker Pro! You now have unlimited voice recordings.',
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