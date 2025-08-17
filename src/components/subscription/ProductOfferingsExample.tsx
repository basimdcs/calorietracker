import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../ui/Card';

/**
 * Example component showing how to use RevenueCat with product offerings
 * This demonstrates the enhanced initialization and product access
 */
export const ProductOfferingsExample: React.FC = () => {
  const { state, actions } = useRevenueCatContext();

  const handlePurchaseMonthly = async () => {
    const monthlyPackage = actions.getMonthlyPackage();
    if (!monthlyPackage) {
      Alert.alert('Error', 'Monthly subscription not available');
      return;
    }

    const success = await actions.purchasePackage(monthlyPackage);
    if (success) {
      Alert.alert('Success', 'Purchase completed successfully!');
    }
  };

  const handlePurchaseYearly = async () => {
    const yearlyPackage = actions.getYearlyPackage();
    if (!yearlyPackage) {
      Alert.alert('Error', 'Yearly subscription not available');
      return;
    }

    const success = await actions.purchasePackage(yearlyPackage);
    if (success) {
      Alert.alert('Success', 'Purchase completed successfully!');
    }
  };

  const handleRestorePurchases = async () => {
    const success = await actions.restorePurchases();
    if (success) {
      Alert.alert('Success', 'Purchases restored successfully!');
    } else {
      Alert.alert('Info', 'No purchases to restore');
    }
  };

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscriptions...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <Card style={styles.errorCard}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Subscription Error</Text>
        <Text style={styles.errorText}>{state.error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => actions.resetInitialization()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  if (!state.offerings?.current) {
    return (
      <Card style={styles.noOfferingsCard}>
        <MaterialIcons name="shopping-cart" size={48} color={colors.textSecondary} />
        <Text style={styles.noOfferingsTitle}>No Products Available</Text>
        <Text style={styles.noOfferingsText}>
          Subscription products are not available at this time.
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={actions.getOfferings}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  const monthlyPackage = actions.getMonthlyPackage();
  const yearlyPackage = actions.getYearlyPackage();
  const availablePackages = actions.getAvailablePackages();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Plans</Text>
      
      {/* Current subscription status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <MaterialIcons 
            name={state.subscriptionStatus.tier === 'PRO' ? 'stars' : 'person'} 
            size={24} 
            color={state.subscriptionStatus.tier === 'PRO' ? colors.warning : colors.textSecondary} 
          />
          <Text style={styles.statusTitle}>
            Current Plan: {state.subscriptionStatus.tier}
          </Text>
        </View>
        <Text style={styles.statusText}>
          Recordings Used: {state.usageInfo.recordingsUsed}
          {state.usageInfo.recordingsLimit && ` / ${state.usageInfo.recordingsLimit}`}
        </Text>
      </Card>

      {/* Monthly Package */}
      {monthlyPackage && (
        <Card style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>Monthly Pro</Text>
            <Text style={styles.packagePrice}>{monthlyPackage.product.priceString}</Text>
          </View>
          <Text style={styles.packageDescription}>
            300 recordings per month, advanced features
          </Text>
          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={handlePurchaseMonthly}
            disabled={state.isLoading}
          >
            <Text style={styles.purchaseButtonText}>Subscribe Monthly</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Yearly Package */}
      {yearlyPackage && (
        <Card style={[styles.packageCard, styles.popularPackage]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>Yearly Pro</Text>
            <Text style={styles.packagePrice}>{yearlyPackage.product.priceString}</Text>
          </View>
          <Text style={styles.packageDescription}>
            Save money with yearly billing
          </Text>
          <TouchableOpacity 
            style={[styles.purchaseButton, styles.popularButton]}
            onPress={handlePurchaseYearly}
            disabled={state.isLoading}
          >
            <Text style={styles.purchaseButtonText}>Subscribe Yearly</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Debug information */}
      {__DEV__ && (
        <Card style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            Available Packages: {availablePackages.length}
          </Text>
          <Text style={styles.debugText}>
            Offerings ID: {state.offerings.current?.identifier}
          </Text>
          <Text style={styles.debugText}>
            Customer ID: {state.customerInfo?.originalAppUserId || 'Anonymous'}
          </Text>
        </Card>
      )}

      {/* Restore purchases button */}
      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={handleRestorePurchases}
        disabled={state.isLoading}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fonts.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  errorCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  noOfferingsCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noOfferingsTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noOfferingsText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  refreshButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  statusCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.blue50,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  packageCard: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  popularPackage: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.lg,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  popularText: {
    fontSize: fonts.xs,
    color: colors.white,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packageTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  packagePrice: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  packageDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: colors.warning,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: fonts.base,
    fontWeight: 'bold',
  },
  debugCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.gray50,
  },
  debugTitle: {
    fontSize: fonts.sm,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  restoreButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: fonts.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});