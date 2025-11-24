/**
 * Reusable DailyView Component
 *
 * Layout order: Date selector → Calories bar → Macros bar → Food items
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { FoodItem } from './FoodItem';
import { DailyLog } from '../../types';
import { toDisplayFood } from '../../types/display';
import { useUserCalorieGoal } from '../../utils/calorieGoal';
import { Card } from './Card';
import { useRTLStyles } from '../../utils/rtl';
import { useTranslation } from '../../hooks/useTranslation';

interface DailyViewProps {
  dailyLog?: DailyLog;
  date: string;
  title?: string;
  showDateHeader?: boolean;
  showDateSelector?: boolean;
  onDateChange?: (date: Date) => void;
  onRemoveFood?: (date: string, foodId: string) => void;
  onEditFood?: (date: string, foodId: string, quantity: number) => void;
  onEmptyStatePress?: () => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  dailyLog,
  date,
  title = "Calories",
  showDateHeader = false,
  showDateSelector = false,
  onDateChange,
  onRemoveFood,
  onEditFood,
  onEmptyStatePress,
}) => {
  const userCalorieGoal = useUserCalorieGoal();
  const { rtlIcon } = useRTLStyles();
  const { t, isRTL, currentLanguage } = useTranslation();

  // RTL text style following Arabic.md pattern
  const rtlTextStyle = isRTL
    ? { writingDirection: 'rtl' as const, textAlign: 'left' as const }
    : { writingDirection: 'ltr' as const, textAlign: 'left' as const };

  // Calculate values
  const consumed = dailyLog?.totalNutrition.calories || 0;
  const goal = userCalorieGoal;
  const progress = Math.min(consumed / goal, 1);
  const foods = dailyLog?.foods || [];
  const displayFoods = foods.map(toDisplayFood);

  // Calculate macro goals based on calorie goal
  // Standard macro split: 30% protein, 45% carbs, 25% fat
  const proteinGoal = Math.round((goal * 0.30) / 4); // 4 cal per gram of protein
  const carbsGoal = Math.round((goal * 0.45) / 4); // 4 cal per gram of carbs
  const fatGoal = Math.round((goal * 0.25) / 9); // 9 cal per gram of fat

  // Date navigation
  const currentDate = new Date(date);
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange?.(newDate);
  };

  const goToNextDay = () => {
    const today = new Date();
    if (currentDate.toDateString() !== today.toDateString()) {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateChange?.(newDate);
    }
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const formatDateDisplay = () => {
    const today = new Date();
    const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    if (currentDate.toDateString() === today.toDateString()) {
      return `${t('calendar.today')}, ${currentDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Date Selector (optional) */}
      {showDateSelector && (
        <Card style={styles.dateSelector}>
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity onPress={goToPreviousDay} style={styles.dateNavButton}>
              <MaterialIcons name={rtlIcon("chevron-left", "chevron-right")} size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDateDisplay()}</Text>
            <TouchableOpacity
              onPress={goToNextDay}
              style={styles.dateNavButton}
              disabled={isToday()}
            >
              <MaterialIcons
                name={rtlIcon("chevron-right", "chevron-left")}
                size={28}
                color={isToday() ? colors.gray300 : colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Calories Bar */}
      <LinearGradient
        colors={[colors.primaryLight, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.caloriesCard}
      >
        <View style={styles.caloriesContent}>
          <Text style={[styles.caloriesTitle, rtlTextStyle]}>{t('nutrition.calories')}</Text>
          <Text style={[styles.caloriesValue, rtlTextStyle]}>
            {Math.round(consumed)} / {Math.round(goal)} {t('nutrition.kcal')}
          </Text>
          <View style={styles.caloriesProgressBar}>
            <View
              style={[
                styles.caloriesProgressFill,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                }
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Macros Bar - All 3 in Row */}
      <View style={styles.macroCardsContainer}>
        <View style={[styles.macroCard, { backgroundColor: '#FFB3BA' }]}>
          <Text style={[styles.macroCardLabel, rtlTextStyle]}>{t('nutrition.protein')}</Text>
          <Text style={[styles.macroCardValue, rtlTextStyle]}>
            {Math.round(dailyLog?.totalNutrition.protein || 0)} / {proteinGoal} {t('nutrition.g')}
          </Text>
          <View style={styles.macroCardProgressBar}>
            <View
              style={[
                styles.macroCardProgressFill,
                { width: `${Math.min(((dailyLog?.totalNutrition.protein || 0) / proteinGoal) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#FFDFBA' }]}>
          <Text style={[styles.macroCardLabel, rtlTextStyle]}>{t('nutrition.carbs')}</Text>
          <Text style={[styles.macroCardValue, rtlTextStyle]}>
            {Math.round(dailyLog?.totalNutrition.carbs || 0)} / {carbsGoal} {t('nutrition.g')}
          </Text>
          <View style={styles.macroCardProgressBar}>
            <View
              style={[
                styles.macroCardProgressFill,
                { width: `${Math.min(((dailyLog?.totalNutrition.carbs || 0) / carbsGoal) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#E0BBE4' }]}>
          <Text style={[styles.macroCardLabel, rtlTextStyle]}>{t('nutrition.fat')}</Text>
          <Text style={[styles.macroCardValue, rtlTextStyle]}>
            {Math.round(dailyLog?.totalNutrition.fat || 0)} / {fatGoal} {t('nutrition.g')}
          </Text>
          <View style={styles.macroCardProgressBar}>
            <View
              style={[
                styles.macroCardProgressFill,
                { width: `${Math.min(((dailyLog?.totalNutrition.fat || 0) / fatGoal) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Food Items List */}
      <View style={styles.foodSection}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {displayFoods.length > 0 ? (
          <View style={styles.foodList}>
            {displayFoods.map(food => (
              <FoodItem
                key={food.id}
                food={food}
                onDelete={onRemoveFood ? (id) => onRemoveFood(date, id) : undefined}
                showActions={true}
              />
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyState}
            onPress={onEmptyStatePress}
            activeOpacity={0.8}
            disabled={!onEmptyStatePress}
          >
            <View style={styles.microphoneButton}>
              <MaterialIcons name="mic" size={48} color={colors.white} />
            </View>
            <Text style={[styles.emptyStateText, rtlTextStyle]}>{t('home.noMealsYet')}</Text>
            <Text style={[styles.emptyStateSubtext, rtlTextStyle]}>
              {t('home.tapToStartRecording')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateSelector: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    padding: spacing.xs,
  },
  dateText: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  caloriesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  caloriesContent: {
    padding: spacing.lg,
  },
  caloriesTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  caloriesValue: {
    fontSize: fonts['2xl'],
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  caloriesProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  caloriesProgressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  macroCardsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  macroCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  macroCardLabel: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  macroCardValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  macroCardProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroCardProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: fonts.xl,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  foodSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  foodList: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#86EFAC', // light green
    backgroundColor: '#F0FDF4', // very light green
  },
  microphoneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4ADE80', // green
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  emptyStateText: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
