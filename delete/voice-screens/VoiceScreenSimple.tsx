import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';

const VoiceScreenSimple: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Voice Food Log</Text>
        <Text style={styles.subtitle}>
          Voice functionality temporarily disabled while fixing native module issues.
        </Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🎤</Text>
          <Text style={styles.placeholderSubtext}>Coming back soon!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  placeholder: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.gray50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  placeholderSubtext: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default VoiceScreenSimple;