import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import { REVENUE_CAT_CONFIG } from './src/config/revenueCat';
import { RevenueCatProvider, useRevenueCatContext } from './src/contexts/RevenueCatContext';
import { useUserStore } from './src/stores/userStore';

// Inner component that uses RevenueCat context
function AppContent() {
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCatContext();
  const { profile } = useUserStore();

  useEffect(() => {
    // SIMPLIFIED RevenueCat initialization
    if (!revenueCatState.isInitialized && !revenueCatState.isLoading) {
      console.log('🚀 App: Initializing RevenueCat...');
      
      // Set log level
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      revenueCatActions.initializeRevenueCat(profile?.id);
    }
  }, [revenueCatState.isInitialized, revenueCatState.isLoading, profile?.id, revenueCatActions.initializeRevenueCat]);

  // Auto-fetch offerings after initialization
  useEffect(() => {
    if (revenueCatState.isInitialized && !revenueCatState.offerings) {
      console.log('📦 App: Auto-fetching offerings...');
      revenueCatActions.getOfferings();
    }
  }, [revenueCatState.isInitialized, revenueCatState.offerings, revenueCatActions.getOfferings]);

  // Log RevenueCat state changes for debugging
  useEffect(() => {
    console.log('📊 App: RevenueCat state updated:', {
      isInitialized: revenueCatState.isInitialized,
      isLoading: revenueCatState.isLoading,
      hasOfferings: !!revenueCatState.offerings,
      subscriptionTier: revenueCatState.subscriptionStatus.tier,
      error: revenueCatState.error,
      recordingsRemaining: revenueCatState.usageInfo.recordingsRemaining,
    });
  }, [revenueCatState]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor={colors.white} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <RevenueCatProvider>
      <AppContent />
    </RevenueCatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
