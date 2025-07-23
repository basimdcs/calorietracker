import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/theme';
import EnvTest from './src/components/EnvTest';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <EnvTest />
      <AppNavigator />
      <StatusBar style="dark" backgroundColor={colors.white} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
