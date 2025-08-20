import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradients.onboarding}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView style={styles.safeContainer}>
        {/* Decorative elements */}
        <View style={styles.decorativeContainer}>
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />
          <View style={[styles.decorativeCircle, styles.circle3]} />
        </View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* App Icon/Logo Area */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              style={styles.logoGradient}
            >
              <MaterialIcons name="eco" size={64} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.appName}>CalorieTracker</Text>
            <Text style={styles.subtitle}>
              Your personal nutrition companion powered by AI voice recognition
            </Text>
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialIcons name="mic" size={20} color={colors.brandOuterSkin} />
              </View>
              <Text style={styles.featureText}>Voice-powered food logging</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialIcons name="insights" size={20} color={colors.brandOuterSkin} />
              </View>
              <Text style={styles.featureText}>Smart nutrition insights</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <MaterialIcons name="track-changes" size={20} color={colors.brandOuterSkin} />
              </View>
              <Text style={styles.featureText}>Personalized goal tracking</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Action */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandFlesh, // Fallback color to prevent white flashes
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeContainer: {
    flex: 1,
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: colors.brandWaveHigh,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: colors.brandWaveMid,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: colors.brandOuterSkin,
    top: height * 0.3,
    left: width * 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  welcomeTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.medium,
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  appName: {
    fontSize: fonts['3xl'],
    fontWeight: fonts.bold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 1,
    maxWidth: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 250,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: fonts.medium,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    zIndex: 1,
  },
  continueButton: {
    width: '100%',
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.white,
  },
  termsText: {
    fontSize: fonts.xs,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 16,
    maxWidth: 280,
  },
});

export default WelcomeScreen;