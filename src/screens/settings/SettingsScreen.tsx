import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../stores/userStore';
import { useFoodStore } from '../../stores/foodStore';
import { useUser } from '../../hooks/useUser';
import { useRevenueCatContext } from '../../contexts/RevenueCatContext';
import { usePaywall } from '../../hooks/usePaywall';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    profile,
    resetProfile,
  } = useUserStore();
  const { clearAllData: clearFoodData } = useFoodStore();
  const { userStats } = useUser();
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCatContext();
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
        ...(revenueCatState.error?.includes('TestFlight') ? [{ 
          text: 'Debug Info', 
          onPress: () => showRevenueCatDebugInfo() 
        }] : [])
      ]);
    }
  };

  const showRevenueCatDebugInfo = async () => {
    try {
      const debugInfo = await revenueCatActions.debugSubscriptionStatus();
      
      Alert.alert(
        'Enhanced RevenueCat Debug Info',
        debugInfo,
        [
          { text: 'Force Refresh', onPress: async () => {
            try {
              await revenueCatActions.forceRefreshSubscriptionStatus();
              Alert.alert('Success', 'Subscription status refreshed! Check if Pro status is now recognized.');
            } catch (error) {
              Alert.alert('Error', `Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }},
          { text: 'Copy to Clipboard', onPress: () => {
            console.log('Enhanced Debug info:', debugInfo);
          }},
          { text: 'Close' }
        ]
      );
    } catch (error) {
      Alert.alert('Debug Error', `Failed to get debug info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert('Subscription Management', 'This would open subscription management in the App Store.');
  };
  
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

  const handleOpenLink = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Unable to open ${title}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${title}`);
    }
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
          onPress: async () => {
            resetProfile();
            clearFoodData();
            await revenueCatActions.resetUsageCount();
            Alert.alert('Success', 'Your profile has been reset.');
          }
        }
      ]
    );
  };


  // Get usage stats from RevenueCat (single source of truth)
  const usageStats = {
    recordingsUsed: revenueCatState.usageInfo.recordingsUsed,
    recordingsRemaining: revenueCatState.usageInfo.recordingsRemaining,
    monthlyLimit: revenueCatState.usageInfo.recordingsLimit,
    resetDate: revenueCatState.usageInfo.resetDate.toISOString(),
    usagePercentage: revenueCatState.usageInfo.recordingsLimit 
      ? Math.min(100, (revenueCatState.usageInfo.recordingsUsed / revenueCatState.usageInfo.recordingsLimit) * 100) 
      : 0,
  };

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
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proBannerCard}
                >
                  <View style={styles.sparkleContainer}>
                    <View style={styles.sparkle1} />
                    <View style={styles.sparkle2} />
                    <View style={styles.sparkle3} />
                  </View>
                  
                  <View style={styles.proHeader}>
                    <View style={styles.proIconBadge}>
                      <MaterialIcons name="auto-awesome" size={24} color="#FFD700" />
                    </View>
                    <View style={styles.proTitleSection}>
                      <Text style={styles.proTitle}>Upgrade to Pro</Text>
                      <Text style={styles.proSubtitle}>Unlock your full potential</Text>
                    </View>
                  </View>
                  
                  <View style={styles.proFeatures}>
                    <View style={styles.proFeatureRow}>
                      <View style={styles.checkIconContainer}>
                        <MaterialIcons name="check" size={14} color={colors.white} />
                      </View>
                      <Text style={styles.proFeatureText}>300 voice recordings monthly</Text>
                    </View>
                    <View style={styles.proFeatureRow}>
                      <View style={styles.checkIconContainer}>
                        <MaterialIcons name="check" size={14} color={colors.white} />
                      </View>
                      <Text style={styles.proFeatureText}>Advanced nutrition insights</Text>
                    </View>
                    <View style={styles.proFeatureRow}>
                      <View style={styles.checkIconContainer}>
                        <MaterialIcons name="check" size={14} color={colors.white} />
                      </View>
                      <Text style={styles.proFeatureText}>Priority customer support</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={handleUpgradeWithPaywall}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.upgradeButtonGradient}
                    >
                      <Text style={styles.upgradeButtonText}>Get Pro Now</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#2D1B69" />
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
            )}
              
            {/* Usage Progress */}
            {(!revenueCatState.subscriptionStatus.isActive || revenueCatState.subscriptionStatus.tier === 'FREE') && (
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
              <Text style={styles.sectionTitle}>👤 Profile</Text>
              
              {/* Basic Profile Information */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => navigation.navigate('ProfileEdit' as never)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="person" size={24} color={colors.brandOuterSkin} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Personal Information</Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.name || 'Not set'} • {profile.gender || 'Not set'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.age || '--'} years • {profile.height || '--'}cm • {profile.weight || '--'}kg
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Goal Management */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Goals & Nutrition</Text>
              
              {/* Activity Level Card */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => navigation.navigate('ActivityLevelEdit' as never)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="directions-run" size={24} color={colors.brandOuterSkin} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Activity Level</Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.activityLevel ? 
                          profile.activityLevel.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ') : 'Not set'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        Affects your daily calorie calculation
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              {/* Weight Goal Card */}
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={() => navigation.navigate('WeightGoalEdit' as never)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons 
                        name={profile.goal === 'lose' ? 'trending-down' : 
                              profile.goal === 'gain' ? 'trending-up' : 'trending-flat'} 
                        size={24} 
                        color={colors.brandOuterSkin} 
                      />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>Weight Goals & Calorie Target</Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.goal === 'lose' ? 'Lose Weight' :
                         profile.goal === 'gain' ? 'Gain Weight' : 'Maintain Weight'}
                        {profile.weeklyWeightGoal && profile.goal !== 'maintain' && 
                          ` • ${Math.abs(profile.weeklyWeightGoal).toFixed(1)} lbs/week`
                        }
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {profile.customCalorieGoal 
                          ? `Custom: ${profile.customCalorieGoal} cal/day`
                          : `Auto: ${userStats?.dailyCalorieGoal || userStats?.tdee || '--'} cal/day`
                        }
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
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
                onPress={() => handleOpenLink('https://www.kamcalorie.app/privacy', 'Privacy Policy')}
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
                onPress={() => handleOpenLink('https://www.kamcalorie.app/terms', 'Terms of Service')}
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
                onPress={() => handleOpenLink('https://www.kamcalorie.app/support', 'Contact Support')}
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

              {/* Rate the App - Hidden for production */}
              {/* <TouchableOpacity
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
              </TouchableOpacity> */}
            </View>


            {/* Account Management Section - Hidden for production */}
            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Management</Text>

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
            </View> */}

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
    fontFamily: fonts.heading,
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
  proBannerCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sparkle1: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: '15%',
    right: '20%',
  },
  sparkle2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    top: '70%',
    right: '30%',
  },
  sparkle3: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    top: '40%',
    left: '15%',
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  proIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  proTitleSection: {
    flex: 1,
  },
  proTitle: {
    fontSize: fonts.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: fonts.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  proFeatures: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    position: 'relative',
    zIndex: 1,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  proFeatureText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
    flex: 1,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    zIndex: 1,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  upgradeButtonText: {
    fontSize: fonts.base,
    fontWeight: '700',
    color: '#2D1B69',
  },
  usageProgressContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usageProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  usageProgressLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  usageProgressText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  usageProgressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
    borderColor: colors.brandOuterSkin,
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
    color: colors.brandOuterSkin,
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
    backgroundColor: colors.brandFlesh + '40',
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
    color: colors.brandOuterSkin,
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