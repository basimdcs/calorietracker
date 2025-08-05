import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../ui/Card';

interface InstructionStep {
  icon: string;
  title: string;
  description: string;
}

const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    icon: 'mic',
    title: 'Record',
    description: 'Tap and describe your meal (20 sec max)',
  },
  {
    icon: 'restaurant',
    title: 'Confirm',
    description: 'Review and save detected foods',
  },
];

interface VoiceInstructionsProps {
  showExamples?: boolean;
  compact?: boolean;
}

export const VoiceInstructions: React.FC<VoiceInstructionsProps> = ({
  showExamples = false,
  compact = false,
}) => {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="lightbulb" size={20} color={colors.warning} />
        <Text style={styles.headerTitle}>
          {compact ? 'Quick Guide' : 'How to Use Voice Logging'}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {INSTRUCTION_STEPS.map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <MaterialIcons 
                  name={step.icon as any} 
                  size={16} 
                  color={colors.primary} 
                  style={styles.stepIcon}
                />
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Examples section */}
      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>📝 Examples:</Text>
        <Text style={styles.exampleText}>
          "300 grams of rice and 200 grams of chicken breast"
        </Text>
        <Text style={styles.exampleText}>
          "150 grams of pasta with 100 grams of ground beef"
        </Text>
        <Text style={styles.exampleText}>
          "One large apple and 30 grams of almonds"
        </Text>
      </View>

      {/* Tips section - simplified */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips:</Text>
        <Text style={styles.tipText}>
          • Keep recordings under 20 seconds
        </Text>
        <Text style={styles.tipText}>
          • Include quantities in grams when possible
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue200,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: fonts.xs,
    fontWeight: 'bold',
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepIcon: {
    marginRight: spacing.xs,
  },
  stepTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },
  examplesSection: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  examplesTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exampleText: {
    fontSize: fonts.sm,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  tipsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  tipsTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
});