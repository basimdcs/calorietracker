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
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../stores/userStore';
import { useUser } from '../../hooks/useUser';
import { UserProfile } from '../../types';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';
import { usePaywall } from '../../hooks/usePaywall';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    profile, 
    resetProfile,
    getUsageStats,
  } = useUserStore();
  const { userStats } = useUser();
  const { state: revenueCatState } = useRevenueCatContext();
  const { presentPaywallIfNeededWithAlert } = usePaywall();

  const handleUpgradeWithPaywall = async () => {
    if (revenueCatState.isInitialized) {
      await presentPaywallIfNeededWithAlert({
        requiredEntitlement: 'pro',
      });
    } else {
      // Enhanced error message for different scenarios
      let title = 'Subscription Service Unavailable';
      let message = 'Subscription service is not available at the moment. Please try again later.';
      
      if (revenueCatState.error) {
        if (revenueCatState.error.includes('TestFlight')) {
          title = 'TestFlight Limitations';
          message = 'This is a TestFlight build. Subscriptions may not be available until the app is fully approved by Apple.\n\nThe app will work in free mode for testing purposes.';
        } else if (revenueCatState.error.includes('API key')) {
          title = 'Configuration Issue';
          message = 'There is a configuration issue with the subscription service. Please check back later or contact support.';
        } else {
          message = `Subscription service error: ${revenueCatState.error}\n\nPlease try again later.`;
        }
      }
      
      Alert.alert(title, message, [
        { text: 'OK' },
        revenueCatState.error?.includes('TestFlight') ? { 
          text: 'Debug Info', 
          onPress: () => showRevenueCatDebugInfo() 
        } : undefined
      ].filter(Boolean));
    }
  };

  const showRevenueCatDebugInfo = () => {
    const debugInfo = [
      `• Initialized: ${revenueCatState.isInitialized}`,
      `• Loading: ${revenueCatState.isLoading}`,
      `• Error: ${revenueCatState.error || 'None'}`,
      `• Subscription Tier: ${revenueCatState.subscriptionStatus.tier}`,
      `• Build Environment: ${process.env.NODE_ENV}`,
      `• Has Customer Info: ${!!revenueCatState.customerInfo}`,
    ].join('\n');

    Alert.alert(
      'RevenueCat Debug Info',
      debugInfo,
      [
        { text: 'Copy to Clipboard', onPress: () => {
          // In a real app, you'd copy to clipboard here
          console.log('Debug info:', debugInfo);
        }},
        { text: 'Retry Initialization', onPress: () => {
          revenueCatActions.resetInitialization();
          revenueCatActions.initializeRevenueCat(profile?.id);
        }},
        { text: 'Close' }
      ]
    );
  };

  const handleManageSubscription = () => {
    Alert.alert('Subscription Management', 'This would open subscription management in the App Store.');
  };

  const { actions: revenueCatActions } = useRevenueCatContext();
  
  const handleRestorePurchases = async () => {
    if (revenueCatState.isInitialized) {
      const success = await revenueCatActions.restorePurchases();
      if (success) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } else {
      Alert.alert('Service Unavailable', 'Restore purchases is not available at the moment.');
    }
  };

  const handleOpenLink = (title: string) => {
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

  if (!profile) {
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
            
            {/* Pro Banner */}
            {(!revenueCatState.subscriptionStatus.isActive || revenueCatState.subscriptionStatus.tier === 'FREE') && (
              <View style={styles.section}>
                <LinearGradient
                  colors={[colors.primary, '#45A049']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proBanner}
                >
                  <View style={styles.proBannerContent}>
                    <View style={styles.proIconContainer}>
                      <MaterialIcons name="auto-awesome" size={32} color={colors.white} />
                    </View>
                    <View style={styles.proBannerText}>
                      <Text style={styles.proBannerTitle}>Unlock Kam Calorie Pro</Text>
                      <Text style={styles.proBannerSubtitle}>
                        300 recordings/month • Advanced insights • Priority support
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.proUpgradeButton}
                    onPress={handleUpgradeWithPaywall}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.proUpgradeButtonText}>Get Pro</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  
                  {/* Usage Progress */}
                  <View style={styles.usageProgressContainer}>
                    <View style={styles.usageProgressHeader}>
                      <Text style={styles.usageProgressLabel}>Monthly Usage</Text>
                      <Text style={styles.usageProgressText}>
                        {usageStats.recordingsUsed} / {usageStats.monthlyLimit || '∞'}
                      </Text>
                    </View>
                    <View style={styles.usageProgressBar}>
                      <View 
                        style={[
                          styles.usageProgressFill,
                          { width: `${Math.min(100, usageStats.usagePercentage)}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}
            
            {/* Current Subscription Status - Only show if Pro */}
            {revenueCatState.subscriptionStatus.isActive && revenueCatState.subscriptionStatus.tier === 'PRO' && (
              <View style={styles.section}>
                <View style={styles.proStatusCard}>
                  <View style={styles.proStatusHeader}>
                    <View style={styles.proStatusIconContainer}>
                      <MaterialIcons name="verified" size={24} color={colors.success} />
                    </View>
                    <View style={styles.proStatusText}>
                      <Text style={styles.proStatusTitle}>Pro Member</Text>
                      <Text style={styles.proStatusSubtitle}>300 recordings/month & premium features</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={handleManageSubscription}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Restore Purchases - Always show for support */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.restoreButton}
                onPress={handleRestorePurchases}
              >
                <MaterialIcons name="restore" size={20} color={colors.primary} />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>

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
                        {profile.name || 'Not set'} • {profile.age || 'Not set'} years
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.activityLevel || 'Not set'} • {profile.goal || 'Not set'}
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
                onPress={() => handleOpenLink('Privacy Policy')}
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
                onPress={() => handleOpenLink('Terms of Service')}
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
                onPress={() => handleOpenLink('Contact Support')}
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
                onPress={() => handleOpenLink('Rate the App')}
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
  // Pro Banner Styles
  proBanner: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  proBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  proIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  proBannerText: {
    flex: 1,
  },
  proBannerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  proBannerSubtitle: {
    fontSize: fonts.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  proUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proUpgradeButtonText: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.primary,
  },
  usageProgressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: spacing.md,
  },
  usageProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  usageProgressLabel: {
    fontSize: fonts.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  usageProgressText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: 'bold',
  },
  usageProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  // Pro Status Card (for existing Pro users)
  proStatusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.success + '20',
  },
  proStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  proStatusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  proStatusText: {
    flex: 1,
  },
  proStatusTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  proStatusSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  manageButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  manageButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Restore Button
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  restoreButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.primary,
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