import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { UserProfile } from '../../types';

const { width, height } = Dimensions.get('window');

interface OnboardingCompleteProps {
  userProfile: UserProfile;
  onContinue: () => void;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteProps> = ({ 
  userProfile, 
  onContinue 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start celebration animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getCelebrationMessage = () => {
    const timeOfDay = new Date().getHours();
    if (timeOfDay < 12) return "Good morning";
    if (timeOfDay < 17) return "Good afternoon";
    return "Good evening";
  };

  const getPersonalizedGoalMessage = () => {
    switch (userProfile.goal) {
      case 'lose':
        return `Ready to achieve your weight loss goals with ${userProfile.dailyCalorieGoal} calories per day`;
      case 'gain':
        return `Ready to build muscle and gain weight with ${userProfile.dailyCalorieGoal} calories per day`;
      case 'maintain':
        return `Ready to maintain your current weight with ${userProfile.dailyCalorieGoal} calories per day`;
      default:
        return `Ready to start your nutrition journey`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.onboarding}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Celebration Confetti Elements */}
        <View style={styles.confettiContainer}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confetti,
                {
                  backgroundColor: i % 2 === 0 ? colors.secondary : colors.brandWaveHigh,
                  top: Math.random() * height * 0.3,
                  left: Math.random() * width,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                  opacity: 0.8,
                }
              ]}
            />
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <Animated.View 
            style={[
              styles.successIconContainer,
              { 
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              style={styles.successIcon}
            >
              <MaterialIcons name="check" size={64} color={colors.white} />
            </LinearGradient>
            
            {/* Pulse rings */}
            <Animated.View style={[styles.pulseRing, styles.pulseRing1]} />
            <Animated.View style={[styles.pulseRing, styles.pulseRing2]} />
          </Animated.View>

          {/* Success Message */}
          <Animated.View 
            style={[
              styles.messageContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={styles.celebrationText}>
              {getCelebrationMessage()}, {userProfile.name}! 🎉
            </Text>
            <Text style={styles.successTitle}>
              You're All Set!
            </Text>
            <Text style={styles.successSubtitle}>
              {getPersonalizedGoalMessage()}
            </Text>
          </Animated.View>

          {/* Profile Summary */}
          <Animated.View 
            style={[
              styles.summaryContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Health Profile</Text>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <MaterialIcons name="person" size={20} color={colors.brandOuterSkin} />
                  <Text style={styles.summaryLabel}>Age</Text>
                  <Text style={styles.summaryValue}>{userProfile.age} years</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialIcons name="fitness-center" size={20} color={colors.brandOuterSkin} />
                  <Text style={styles.summaryLabel}>Activity</Text>
                  <Text style={styles.summaryValue}>
                    {userProfile.activityLevel?.replace('-', ' ') || 'Moderate'}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialIcons name="local-fire-department" size={20} color={colors.brandOuterSkin} />
                  <Text style={styles.summaryLabel}>Daily Goal</Text>
                  <Text style={styles.summaryValue}>{userProfile.dailyCalorieGoal} cal</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <MaterialIcons name="track-changes" size={20} color={colors.brandOuterSkin} />
                  <Text style={styles.summaryLabel}>Target</Text>
                  <Text style={styles.summaryValue}>
                    {userProfile.goal === 'lose' ? 'Lose Weight' :
                     userProfile.goal === 'gain' ? 'Gain Weight' : 'Maintain'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Next Steps */}
          <Animated.View 
            style={[
              styles.nextStepsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
            <View style={styles.nextStepsList}>
              <View style={styles.nextStepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Try voice logging your first meal</Text>
              </View>
              
              <View style={styles.nextStepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Explore your personalized dashboard</Text>
              </View>
              
              <View style={styles.nextStepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Track your daily progress</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Action */}
        <Animated.View 
          style={[
            styles.bottomContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.brandOuterSkin, colors.brandLeaf]}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Start My Journey</Text>
              <MaterialIcons name="rocket-launch" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 2,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
    zIndex: 3,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.white,
    opacity: 0.6,
  },
  pulseRing1: {
    width: 140,
    height: 140,
  },
  pulseRing2: {
    width: 160,
    height: 160,
    opacity: 0.3,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  celebrationText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  successTitle: {
    fontSize: fonts['3xl'],
    fontWeight: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  successSubtitle: {
    fontSize: fonts.base,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    maxWidth: 320,
  },
  summaryContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  summaryTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    width: '45%',
  },
  summaryLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: fonts.medium,
  },
  summaryValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  nextStepsTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  nextStepsList: {
    gap: spacing.sm,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: fonts.sm,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
  },
  stepText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: fonts.medium,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    zIndex: 2,
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.white,
  },
});

export default OnboardingCompleteScreen;