import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card, SubscriptionCard, PricingCard } from '../../components/ui';
// import { PaywallModal } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { useUser } from '../../hooks/useUser';
import { UserProfile, SUBSCRIPTION_PLANS, SubscriptionTier } from '../../types';
import useRevenueCat from '../../hooks/useRevenueCat';
import { usePaywall } from '../../hooks/usePaywall';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    profile, 
    updateProfile, 
    resetProfile, 
    upgradeSubscription,
    getUsageStats,
  } = useUserStore();
  const { userStats } = useUser();
  const { state: revenueCatState } = useRevenueCat();
  const { presentPaywallIfNeededWithAlert } = usePaywall();
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);
  const [showPricingCards, setShowPricingCards] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  const handleUpgradeSubscription = () => {
    setShowPricingCards(true);
  };

  const handleUpgradeWithPaywall = async () => {
    // Use RevenueCat's paywall if available
    if (revenueCatState.isInitialized) {
      await presentPaywallIfNeededWithAlert({
        requiredEntitlement: 'pro',
      });
    } else {
      // Fallback to modal paywall
      setShowPaywallModal(true);
    }
  };

  const handlePaywallDismiss = () => {
    setShowPaywallModal(false);
  };

  const handlePaywallSuccess = () => {
    setShowPaywallModal(false);
    Alert.alert('Success!', 'Welcome to CalorieTracker Pro!');
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === 'FREE') {
      Alert.alert(
        'Confirm Downgrade',
        'Are you sure you want to downgrade to the Free plan? You will lose access to premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Downgrade', 
            style: 'destructive',
            onPress: () => {
              upgradeSubscription(tier);
              setShowPricingCards(false);
              Alert.alert('Success', 'Your subscription has been updated.');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Upgrade Subscription',
        `You are about to upgrade to the ${tier} plan. This will redirect you to the App Store to complete your purchase.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              upgradeSubscription(tier);
              setShowPricingCards(false);
              Alert.alert('Success', 'Your subscription has been upgraded!');
            }
          }
        ]
      );
    }
  };

  const handleManageSubscription = () => {
    // Navigate to subscription management
    Alert.alert('Subscription Management', 'This would open subscription management in the App Store.');
  };

  const handleRestorePurchases = () => {
    Alert.alert('Restore Purchases', 'This would restore any previous purchases.');
  };

  const handleOpenLink = (url: string, title: string) => {
    Alert.alert(`Open ${title}`, `This would open ${title} in your browser.`);
  };

  const handleResetProfile = () => {
    Alert.alert(
      'Reset Profile',
      'Resetting your profile will permanently delete all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProfile();
            Alert.alert('Success', 'Your profile has been reset.');
          }
        }
      ]
    );
  };


  const usageStats = getUsageStats();

  if (!localProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>
                Manage your account and preferences
              </Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Subscription Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription & Usage</Text>
              <SubscriptionCard
                subscriptionStatus={{
                  isActive: localProfile.subscriptionStatus === 'active',
                  tier: localProfile.subscriptionTier || 'FREE',
                  willRenew: true,
                  isInGracePeriod: false,
                  expirationDate: localProfile.subscriptionEndDate ? new Date(localProfile.subscriptionEndDate) : undefined,
                }}
                usageInfo={{
                  recordingsUsed: usageStats.recordingsUsed,
                  recordingsLimit: usageStats.monthlyLimit,
                  recordingsRemaining: usageStats.recordingsRemaining,
                  resetDate: new Date(usageStats.resetDate),
                }}
                onUpgrade={handleUpgradeSubscription}
                onManage={handleManageSubscription}
              />
              
              {/* RevenueCat Paywall Button */}
              <TouchableOpacity 
                style={[styles.restoreButton, styles.paywallButton]} 
                onPress={handleUpgradeWithPaywall}
              >
                <MaterialIcons name="payment" size={20} color={colors.white} />
                <Text style={[styles.restoreButtonText, styles.paywallButtonText]}>Upgrade to Pro</Text>
              </TouchableOpacity>
              
              {/* Restore Purchases Button */}
              <TouchableOpacity 
                style={styles.restoreButton} 
                onPress={handleRestorePurchases}
              >
                <MaterialIcons name="restore" size={20} color={colors.primary} />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>

            {/* Pricing Cards Modal */}
            {showPricingCards && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPricingCards(false)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.pricingGrid}>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <PricingCard
                      key={plan.tier}
                      plan={plan}
                      currentTier={localProfile.subscriptionTier || 'FREE'}
                      onSelect={handleSelectPlan}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Profile Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Overview</Text>
              
              {/* Combined Profile Card with Stats */}
              <TouchableOpacity 
                style={[styles.settingsCard, styles.profileOverviewCard]}
                onPress={() => navigation.navigate('ProfileEdit' as never)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Edit Profile & Goals</Text>
                      <Text style={styles.cardSubtitle}>
                        {localProfile.name || 'Not set'} • {localProfile.age || 'Not set'} years
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {localProfile.activityLevel || 'Not set'} • {localProfile.goal || 'Not set'}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </View>
                
                {/* Inline Stats */}
                <View style={styles.inlineStatsContainer}>
                  <View style={styles.inlineStatItem}>
                    <Text style={styles.inlineStatValue}>{userStats?.bmr || '--'}</Text>
                    <Text style={styles.inlineStatLabel}>BMR</Text>
                  </View>
                  <View style={styles.inlineStatDivider} />
                  <View style={styles.inlineStatItem}>
                    <Text style={styles.inlineStatValue}>{userStats?.tdee || '--'}</Text>
                    <Text style={styles.inlineStatLabel}>TDEE</Text>
                  </View>
                  <View style={styles.inlineStatDivider} />
                  <View style={styles.inlineStatItem}>
                    <Text style={styles.inlineStatValue}>{userStats?.calorieGoal || '--'}</Text>
                    <Text style={styles.inlineStatLabel}>Daily Goal</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              
              {/* Notifications Card */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => navigation.navigate('Notifications' as never)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="notifications" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Notifications</Text>
                      <Text style={styles.cardSubtitle}>Meal reminders and goal alerts</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Support & Legal Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support & Legal</Text>
              
              {/* Privacy Policy */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => handleOpenLink('https://example.com/privacy', 'Privacy Policy')}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="privacy-tip" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Privacy Policy</Text>
                      <Text style={styles.cardSubtitle}>Read our privacy policy</Text>
                    </View>
                  </View>
                  <MaterialIcons name="open-in-new" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Terms of Service */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => handleOpenLink('https://example.com/terms', 'Terms of Service')}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="article" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Terms of Service</Text>
                      <Text style={styles.cardSubtitle}>Read our terms of service</Text>
                    </View>
                  </View>
                  <MaterialIcons name="open-in-new" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Contact Support */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => handleOpenLink('mailto:support@calorietracker.com', 'Contact Support')}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="support" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Contact Support</Text>
                      <Text style={styles.cardSubtitle}>Get help from our team</Text>
                    </View>
                  </View>
                  <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Rate the App */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => handleOpenLink('https://apps.apple.com/app/id123456789', 'Rate the App')}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="star-rate" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Rate the App</Text>
                      <Text style={styles.cardSubtitle}>Share your feedback</Text>
                    </View>
                  </View>
                  <MaterialIcons name="open-in-new" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>


            {/* Account Management Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Management</Text>
              
              {/* Reset Profile */}
              <TouchableOpacity 
                style={[styles.settingsCard, styles.dangerCard]}
                onPress={handleResetProfile}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconContainer, styles.dangerIcon]}>
                      <MaterialIcons name="warning" size={24} color={colors.error} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, styles.dangerText]}>Reset Profile</Text>
                      <Text style={[styles.cardSubtitle, styles.dangerSubtitle]}>
                        Permanently delete all data
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.error} />
                </View>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </View>
      
      {/* PaywallModal */}
      {/* <PaywallModal
        visible={showPaywallModal}
        onDismiss={handlePaywallDismiss}
        onPurchaseCompleted={handlePaywallSuccess}
        requiredEntitlement="pro"
      /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  closeButton: {
    padding: spacing.sm,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  paywallButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  paywallButtonText: {
    color: colors.white,
  },
  restoreButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.primary,
  },
  pricingGrid: {
    gap: spacing.lg,
  },
  // New styles for settings cards
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  // Profile overview card styles
  profileOverviewCard: {
    paddingBottom: spacing.lg,
  },
  inlineStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  inlineStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  inlineStatValue: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  inlineStatLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inlineStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },
  // Danger styles
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  dangerIcon: {
    backgroundColor: colors.error + '20',
  },
  dangerText: {
    color: colors.error,
  },
  dangerSubtitle: {
    color: colors.error + '80',
  },
});

export default SettingsScreen;