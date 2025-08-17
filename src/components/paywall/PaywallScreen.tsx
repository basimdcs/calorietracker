import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';

interface PaywallScreenProps {
  onDismiss?: () => void;
  onPurchaseCompleted?: () => void;
  requiredEntitlement?: string;
  offering?: string;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onDismiss,
  onPurchaseCompleted,
  requiredEntitlement = 'pro',
  offering,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { state, actions } = useRevenueCatContext();

  useEffect(() => {
    // Check if user already has the required entitlement
    if (state.subscriptionStatus.tier === 'PRO' && state.subscriptionStatus.isActive) {
      onPurchaseCompleted?.();
      return;
    }
    
    // Show paywall for free users
    if (state.isInitialized && !state.isLoading) {
      setShowPaywall(true);
    }
  }, [state.isInitialized, state.isLoading, state.subscriptionStatus]);

  const presentPaywall = async () => {
    if (!state.isInitialized) {
      Alert.alert('Error', 'RevenueCat is not initialized yet. Please try again.');
      return;
    }

    setIsLoading(true);
    
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
          Alert.alert(
            'Purchase Successful!',
            'Welcome to CalorieTracker Pro! You now have 300 voice recordings per month.',
            [{ text: 'OK', onPress: onPurchaseCompleted }]
          );
          break;
          
        case PAYWALL_RESULT.CANCELLED:
          console.log('❌ Purchase cancelled by user');
          onDismiss?.();
          break;
          
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('ℹ️ Paywall not presented (user may already have entitlement)');
          onDismiss?.();
          break;
          
        case PAYWALL_RESULT.ERROR:
          console.error('❌ Error presenting paywall');
          Alert.alert('Error', 'There was an error processing your purchase. Please try again.');
          onDismiss?.();
          break;
          
        case PAYWALL_RESULT.RESTORED:
          console.log('🔄 Purchases restored successfully');
          await actions.refreshCustomerInfo();
          Alert.alert(
            'Purchases Restored!',
            'Your previous purchases have been restored.',
            [{ text: 'OK', onPress: onPurchaseCompleted }]
          );
          break;
          
        default:
          console.log('🤷 Unknown paywall result:', paywallResult);
          onDismiss?.();
          break;
      }
    } catch (error) {
      console.error('❌ Error presenting paywall:', error);
      Alert.alert(
        'Error',
        'There was an error loading the paywall. Please check your internet connection and try again.'
      );
      onDismiss?.();
    } finally {
      setIsLoading(false);
    }
  };

  const presentPaywallIfNeeded = async () => {
    if (!state.isInitialized) {
      Alert.alert('Error', 'RevenueCat is not initialized yet. Please try again.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🎬 Presenting paywall if needed for entitlement:', requiredEntitlement);
      
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlement,
        offering: offering,
      });

      console.log('💳 Paywall if needed result:', paywallResult);

      // Handle the same way as regular paywall
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          await actions.refreshCustomerInfo();
          Alert.alert(
            'Purchase Successful!',
            'Welcome to CalorieTracker Pro! You now have 300 voice recordings per month.',
            [{ text: 'OK', onPress: onPurchaseCompleted }]
          );
          break;
          
        case PAYWALL_RESULT.CANCELLED:
          onDismiss?.();
          break;
          
        case PAYWALL_RESULT.NOT_PRESENTED:
          // User already has entitlement, proceed
          onPurchaseCompleted?.();
          break;
          
        case PAYWALL_RESULT.ERROR:
          Alert.alert('Error', 'There was an error processing your purchase. Please try again.');
          onDismiss?.();
          break;
          
        case PAYWALL_RESULT.RESTORED:
          await actions.refreshCustomerInfo();
          Alert.alert(
            'Purchases Restored!',
            'Your previous purchases have been restored.',
            [{ text: 'OK', onPress: onPurchaseCompleted }]
          );
          break;
          
        default:
          onDismiss?.();
          break;
      }
    } catch (error) {
      console.error('❌ Error presenting paywall if needed:', error);
      Alert.alert(
        'Error',
        'There was an error loading the paywall. Please check your internet connection and try again.'
      );
      onDismiss?.();
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (state.isLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Subscription Options</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <Button
            title="Try Again"
            onPress={presentPaywall}
            style={styles.retryButton}
          />
          <Button
            title="Cancel"
            onPress={onDismiss}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Already has Pro subscription
  if (state.subscriptionStatus.tier === 'PRO' && state.subscriptionStatus.isActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>You're All Set! 🎉</Text>
          <Text style={styles.successMessage}>
            You already have CalorieTracker Pro with 300 voice recordings per month.
          </Text>
          <Button
            title="Continue"
            onPress={onPurchaseCompleted}
            style={styles.continueButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main paywall presentation options
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          Get 300 voice recordings per month and premium features
        </Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featureItem}>✨ 300 voice recordings per month</Text>
          <Text style={styles.featureItem}>📊 Advanced nutrition insights</Text>
          <Text style={styles.featureItem}>📈 Detailed progress tracking</Text>
          <Text style={styles.featureItem}>💾 Export your data</Text>
          <Text style={styles.featureItem}>🎯 Priority support</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="Show Pro Plans"
            onPress={presentPaywall}
            style={styles.upgradeButton}
          />
          
          <Button
            title="Upgrade If Needed"
            onPress={presentPaywallIfNeeded}
            variant="outline"
            style={styles.conditionalButton}
          />
          
          <Button
            title="Maybe Later"
            onPress={onDismiss}
            variant="ghost"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    marginBottom: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successTitle: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successMessage: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  continueButton: {
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featureItem: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
  },
  conditionalButton: {
    borderColor: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});