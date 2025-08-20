import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';

interface CalorieCalculatorProps {
  bmr: number;
  tdee: number;
  targetCalories: number;
  goalType: 'lose' | 'maintain' | 'gain';
  expectedWeeklyChange: number;
  style?: ViewStyle;
}

const CalorieCalculator: React.FC<CalorieCalculatorProps> = ({
  bmr,
  tdee,
  targetCalories,
  goalType,
  expectedWeeklyChange,
  style,
}) => {
  const deficit = tdee - targetCalories;
  
  const getGoalIcon = () => {
    switch (goalType) {
      case 'lose':
        return 'trending-down';
      case 'gain':
        return 'trending-up';
      case 'maintain':
      default:
        return 'trending-flat';
    }
  };

  const getGoalColor = () => {
    switch (goalType) {
      case 'lose':
        return colors.secondary;
      case 'gain':
        return colors.brandOuterSkin;
      case 'maintain':
      default:
        return colors.gray600;
    }
  };

  const formatWeeklyChange = () => {
    const change = Math.abs(expectedWeeklyChange);
    const direction = expectedWeeklyChange > 0 ? '+' : expectedWeeklyChange < 0 ? '-' : '';
    return `${direction}${change.toFixed(1)} lbs/week`;
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.white, colors.gray50]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="calculate" size={28} color={colors.brandOuterSkin} />
          <Text style={styles.title}>Calorie Breakdown</Text>
        </View>

        {/* Calculation Rows */}
        <View style={styles.calculations}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="local-fire-department" size={20} color={colors.gray600} />
              <Text style={styles.rowLabel}>Base Metabolic Rate (BMR)</Text>
            </View>
            <Text style={styles.rowValue}>{bmr.toLocaleString()} cal</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="fitness-center" size={20} color={colors.gray600} />
              <Text style={styles.rowLabel}>Total Daily Energy (TDEE)</Text>
            </View>
            <Text style={styles.rowValue}>{tdee.toLocaleString()} cal</Text>
          </View>

          <View style={[styles.row, styles.targetRow]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="flag" size={20} color={colors.brandOuterSkin} />
              <Text style={[styles.rowLabel, styles.targetLabel]}>Daily Target</Text>
            </View>
            <Text style={[styles.rowValue, styles.targetValue]}>
              {targetCalories.toLocaleString()} cal
            </Text>
          </View>

          {deficit !== 0 && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialIcons 
                  name={deficit > 0 ? "remove" : "add"} 
                  size={20} 
                  color={deficit > 0 ? colors.secondary : colors.brandOuterSkin} 
                />
                <Text style={styles.rowLabel}>
                  {deficit > 0 ? 'Daily Deficit' : 'Daily Surplus'}
                </Text>
              </View>
              <Text style={[
                styles.rowValue,
                { color: deficit > 0 ? colors.secondary : colors.brandOuterSkin }
              ]}>
                {Math.abs(deficit).toLocaleString()} cal
              </Text>
            </View>
          )}

          {/* Goal Summary */}
          <View style={styles.goalSummary}>
            <View style={styles.goalIcon}>
              <MaterialIcons 
                name={getGoalIcon() as any} 
                size={24} 
                color={getGoalColor()} 
              />
            </View>
            <View style={styles.goalText}>
              <Text style={styles.goalTitle}>Expected Progress</Text>
              <Text style={[styles.goalValue, { color: getGoalColor() }]}>
                {formatWeeklyChange()}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradient: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  calculations: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  targetRow: {
    backgroundColor: colors.brandFlesh + '20',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  targetLabel: {
    color: colors.brandLeaf,
    fontWeight: fonts.semibold,
  },
  rowValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  targetValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
  },
  goalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  goalValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
  },
});

export default CalorieCalculator;