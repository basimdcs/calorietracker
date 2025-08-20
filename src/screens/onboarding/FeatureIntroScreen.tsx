import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface FeatureIntroProps {
  onContinue: () => void;
  onSkip: () => void;
}

const features = [
  {
    id: 1,
    icon: 'mic',
    title: 'Voice-Powered Logging',
    description: 'Simply speak what you ate and let AI handle the rest. No more manual searching or typing.',
    gradient: ['#A5D66A', '#32C85B'],
    color: '#2CA64B',
  },
  {
    id: 2,
    icon: 'psychology',
    title: 'Smart Food Recognition',
    description: 'Our AI understands Egyptian cuisine and cooking methods to provide accurate nutrition data.',
    gradient: ['#32C85B', '#66E08D'],
    color: '#1F8B3B',
  },
  {
    id: 3,
    icon: 'insights',
    title: 'Personalized Insights',
    description: 'Get tailored recommendations based on your goals, preferences, and progress.',
    gradient: ['#66E08D', '#32C85B'],
    color: '#2CA64B',
  },
  {
    id: 4,
    icon: 'track-changes',
    title: 'Goal Tracking',
    description: 'Set weight goals and track your progress with detailed nutrition analytics.',
    gradient: ['#A5D66A', '#2CA64B'],
    color: '#1F8B3B',
  },
];

const FeatureIntroScreen: React.FC<FeatureIntroProps> = ({ onContinue, onSkip }) => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      onContinue();
    }
  };

  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };

  const feature = features[currentFeature];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={feature.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Skip Button */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft} />
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentFeature && styles.progressDotActive,
                index < currentFeature && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Feature Content */}
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Feature Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <MaterialIcons 
                name={feature.icon as any} 
                size={80} 
                color={colors.white} 
              />
            </View>
          </View>

          {/* Feature Text */}
          <View style={styles.textContainer}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>

          {/* Feature Benefits */}
          <View style={styles.benefitsContainer}>
            {getBenefitsForFeature(currentFeature).map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <MaterialIcons name="check" size={16} color={feature.color} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.backButton]}
            onPress={handlePrevious}
            disabled={currentFeature === 0}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={24} 
              color={currentFeature === 0 ? colors.gray400 : colors.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.white, colors.gray100]}
              style={styles.nextButtonGradient}
            >
              <Text style={[styles.nextButtonText, { color: feature.color }]}>
                {currentFeature === features.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <MaterialIcons 
                name="arrow-forward" 
                size={20} 
                color={feature.color} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const getBenefitsForFeature = (index: number): string[] => {
  switch (index) {
    case 0:
      return [
        'Save time with voice commands',
        'No typing or searching required',
        'Works with Egyptian Arabic'
      ];
    case 1:
      return [
        'Recognizes local Egyptian dishes',
        'Understands cooking methods',
        'Accurate nutrition calculations'
      ];
    case 2:
      return [
        'Personalized meal suggestions',
        'Goal-based recommendations',
        'Progress tracking insights'
      ];
    case 3:
      return [
        'Set realistic weight goals',
        'Track daily progress',
        'Visual nutrition analytics'
      ];
    default:
      return [];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  topBarLeft: {
    flex: 1,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fonts.base,
    color: colors.white,
    fontWeight: fonts.medium,
    opacity: 0.8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: colors.white,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  featureTitle: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureDescription: {
    fontSize: fonts.base,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
    maxWidth: 300,
  },
  benefitsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: fonts.medium,
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    // Additional styling can be added here if needed
  },
  nextButton: {
    flex: 1,
    marginLeft: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
  },
});

export default FeatureIntroScreen;