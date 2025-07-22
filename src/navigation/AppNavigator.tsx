import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';
import { RootStackParamList, TabParamList } from '../types';
import { colors, fonts } from '../constants/theme';
import { CustomBottomTab } from '../components/ui/CustomBottomTab';

// Import screens (we'll create these next)
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import HomeScreen from '../screens/home/HomeScreen';
import VoiceScreen from '../screens/voice/VoiceScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

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
          headerShown: false, // We'll handle header in individual screens
        }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceScreen}
        options={{
          title: 'Voice Food Log',
          tabBarLabel: 'Voice',
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
    </Stack.Navigator>
  );
}

// Main App Navigator Component
export default function AppNavigator() {
  const { profile, isOnboardingComplete } = useUserStore();
  // Use a key that changes when auth state changes
  const navKey = `${!!profile}-${isOnboardingComplete}`;

  return (
    <NavigationContainer key={navKey}>
      <AuthGate />
    </NavigationContainer>
  );
} 