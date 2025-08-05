import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';
import { RootStackParamList, TabParamList } from '../types';
import { colors, fonts } from '../constants/theme';
import { CustomBottomTab } from '../components/ui/CustomBottomTab';
import useRevenueCat from '../hooks/useRevenueCat';

// Import screens (we'll create these next)
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import HomeScreen from '../screens/home/HomeScreen';
import VoiceScreen from '../screens/voice/VoiceScreenProduction';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileEditScreen from '../screens/settings/ProfileEditScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray200,
        },
        headerTitleStyle: {
          fontWeight: fonts.bold,
          fontSize: fonts.lg,
          color: colors.textPrimary,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceScreen}
        options={{
          title: 'Record Food',
          tabBarLabel: 'Record',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: 'Food History',
          tabBarLabel: 'History',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// AuthGate component to handle conditional rendering
function AuthGate() {
  const { profile, isOnboardingComplete } = useUserStore();
  console.log('AuthGate:', { profile, isOnboardingComplete });

  // If no profile or onboarding not complete, show onboarding
  if (!profile || !isOnboardingComplete) {
    console.log('AuthGate: Rendering ONBOARDING');
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  console.log('AuthGate: Rendering MAIN APP');
  // If profile exists and onboarding is complete, show main app
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator Component
export default function AppNavigator() {
  const { profile, isOnboardingComplete } = useUserStore();
  const { state: revenueCatState, actions: revenueCatActions } = useRevenueCat();
  
  // Initialize RevenueCat when profile is available - using stable dependencies
  useEffect(() => {
    console.log('🔍 AppNavigator useEffect triggered:', {
      hasProfile: !!profile,
      profileId: profile?.id,
      isInitialized: revenueCatState.isInitialized,
      isLoading: revenueCatState.isLoading,
      error: revenueCatState.error,
    });
    
    // Only initialize if we have a profile and RevenueCat isn't already initialized or loading
    if (profile && !revenueCatState.isInitialized && !revenueCatState.isLoading) {
      console.log('🚀 Initializing RevenueCat in AppNavigator...');
      
      // Use profile ID for RevenueCat user identification
      revenueCatActions.initializeRevenueCat(profile.id).catch((error) => {
        console.error('❌ Failed to initialize RevenueCat:', error);
        // Don't block app startup if RevenueCat fails
      });
    } else {
      console.log('⏭️ Skipping RevenueCat initialization:', {
        reason: !profile ? 'No profile' : 
                revenueCatState.isInitialized ? 'Already initialized' :
                revenueCatState.isLoading ? 'Currently loading' : 'Unknown'
      });
    }
  }, [profile?.id, revenueCatState.isInitialized, revenueCatState.isLoading]); // Include state dependencies
  
  // Use a key that changes when auth state changes to force navigation reset
  const navKey = `${!!profile}-${isOnboardingComplete}`;

  return (
    <NavigationContainer key={navKey}>
      <AuthGate />
    </NavigationContainer>
  );
} 