import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AppNavigator from './src/navigation/AppNavigator';
import { colors, fonts } from './src/constants/theme';
import { REVENUE_CAT_CONFIG } from './src/config/revenueCat';
import { RevenueCatProvider, useRevenueCatContext } from './src/contexts/RevenueCatContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { useUserStore } from './src/stores/userStore';
import { useFonts } from './src/hooks/useFonts';
import { useProfileSync } from './src/hooks/useProfileSync';

// Set default font family for all Text components
const setDefaultFonts = () => {
  console.log('🔤 Setting default fonts to:', fonts.body);
  
  const defaultProps = Text.defaultProps || {};
  Text.defaultProps = {
    ...defaultProps,
    style: [{ fontFamily: fonts.body }, defaultProps.style],
  };
  
  const defaultInputProps = TextInput.defaultProps || {};
  TextInput.defaultProps = {
    ...defaultInputProps,
    style: [{ fontFamily: fonts.body }, defaultInputProps.style],
  };
  
  console.log('✅ Default fonts applied');
};

// Inner component that uses RevenueCat context
function AppContent() {
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCatContext();
  const { profile, syncSubscriptionFromRevenueCat } = useUserStore();
  const fontsLoaded = useFonts();
  
  // Ensure user profile data is synchronized across all stores
  useProfileSync();

  // Set default fonts once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFonts();
    }
  }, [fontsLoaded]);

  // Set up RevenueCat to userStore sync callback
  useEffect(() => {
    revenueCatActions.setUserStoreCallback((subscriptionStatus) => {
      syncSubscriptionFromRevenueCat(subscriptionStatus.tier, subscriptionStatus.isActive);
    });
  }, [revenueCatActions, syncSubscriptionFromRevenueCat]);

  // ALWAYS call all hooks - RevenueCat initialization
  useEffect(() => {
    // Only initialize if fonts are loaded and RevenueCat is not already initialized
    if (fontsLoaded && !revenueCatState.isInitialized && !revenueCatState.isLoading) {
      console.log('🚀 App: Initializing RevenueCat...');
      
      // Set log level
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      revenueCatActions.initializeRevenueCat(profile?.id);
    }
  }, [fontsLoaded, revenueCatState.isInitialized, revenueCatState.isLoading, profile?.id, revenueCatActions.initializeRevenueCat]);

  // Auto-fetch offerings after initialization
  useEffect(() => {
    if (fontsLoaded && revenueCatState.isInitialized && !revenueCatState.offerings) {
      console.log('📦 App: Auto-fetching offerings...');
      revenueCatActions.getOfferings();
    }
  }, [fontsLoaded, revenueCatState.isInitialized, revenueCatState.offerings, revenueCatActions.getOfferings]);

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

  // Conditional rendering in JSX instead of early return
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor={colors.white} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RevenueCatProvider>
        <AppContent />
      </RevenueCatProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
