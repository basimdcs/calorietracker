import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../../constants/theme';

interface MacroProgressProps {
  protein: {
    current: number;
    goal: number;
  };
  carbs: {
    current: number;
    goal: number;
  };
  fat: {
    current: number;
    goal: number;
  };
}

export const MacroProgress: React.FC<MacroProgressProps> = ({
  protein,
  carbs,
  fat,
}) => {
  const calculateProgress = (current: number, goal: number) => {
    return Math.min(current / goal, 1);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 0.9) return colors.success;
    if (progress >= 0.7) return colors.warning;
    return colors.primary;
  };

  const renderMacroBar = (
    label: string,
    current: number,
    goal: number,
    icon: string,
    color: string
  ) => {
    const progress = calculateProgress(current, goal);
    const progressColor = getProgressColor(progress);

    return (
      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <View style={styles.macroLabel}>
            <Text style={styles.macroIcon}>{icon}</Text>
            <Text style={styles.macroText}>{label}</Text>
          </View>
          <Text style={styles.macroValues}>
            {Math.round(current)}g / {Math.round(goal)}g
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Macronutrients</Text>
      
      {renderMacroBar('Protein', protein.current, protein.goal, '🥩', '#FEE2E2')}
      {renderMacroBar('Carbs', carbs.current, carbs.goal, '🍞', '#F3E8FF')}
      {renderMacroBar('Fat', fat.current, fat.goal, '🥑', '#D1FAE5')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  macroItem: {
    marginBottom: spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  macroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  macroText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  macroValues: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: fonts.xs,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
}); 