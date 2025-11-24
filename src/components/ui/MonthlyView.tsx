import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';
import { useUserCalorieGoal } from '../../utils/calorieGoal';
import { useRTLStyles } from '../../utils/rtl';
import { useTranslation } from '../../hooks/useTranslation';

interface MonthlyViewProps {
  dailyLogs: DailyLog[];
}

interface DayCell {
  date: Date;
  dateKey: string;
  day: number;
  calories: number;
  goal: number;
  itemCount: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ dailyLogs }) => {
  const userCalorieGoal = useUserCalorieGoal();
  const { rtlIcon } = useRTLStyles();
  const { t, currentLanguage } = useTranslation();

  // Get localized weekday names
  const WEEKDAYS = t('calendar.weekdaysShort') as string[];
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Index logs by date
  const logsByDate = useMemo(() => {
    return dailyLogs.reduce((acc, log) => {
      acc[log.date] = log;
      return acc;
    }, {} as Record<string, DailyLog>);
  }, [dailyLogs]);

  // Generate calendar cells
  const calendarCells = useMemo((): DayCell[][] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Adjust for Monday-start week: getDay() returns 0 for Sunday, we want 0 for Monday
    const startDay = (firstDay.getDay() + 6) % 7;
    const today = new Date().toISOString().split('T')[0];

    const cells: (DayCell | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      cells.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const log = logsByDate[dateKey];

      cells.push({
        date,
        dateKey,
        day,
        calories: Math.round(log?.totalNutrition.calories || 0),
        goal: userCalorieGoal, // Single source of truth
        itemCount: log?.foods.length || 0,
        isToday: dateKey === today,
        isCurrentMonth: true,
      });
    }

    // Group into weeks
    const weeks: (DayCell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
  }, [currentMonth, logsByDate, userCalorieGoal]);

  // Calculate monthly stats
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthLogs = dailyLogs.filter(log => log.date.startsWith(monthKey));
    const activeDays = monthLogs.filter(log => log.totalNutrition.calories > 0);

    const totalCalories = activeDays.reduce((sum, log) => sum + log.totalNutrition.calories, 0);
    const totalProtein = activeDays.reduce((sum, log) => sum + log.totalNutrition.protein, 0);
    const totalCarbs = activeDays.reduce((sum, log) => sum + log.totalNutrition.carbs, 0);
    const totalFat = activeDays.reduce((sum, log) => sum + log.totalNutrition.fat, 0);
    const avgCalories = activeDays.length > 0 ? Math.round(totalCalories / activeDays.length) : 0;
    const daysLogged = activeDays.length;

    const onTargetDays = activeDays.filter(log => {
      const ratio = log.totalNutrition.calories / log.calorieGoal;
      return ratio >= 0.9 && ratio <= 1.1;
    }).length;

    const bestDay = activeDays.reduce<DailyLog | null>((best, log) => {
      if (!best || log.totalNutrition.calories > best.totalNutrition.calories) return log;
      return best;
    }, null);

    return {
      totalCalories: Math.round(totalCalories),
      avgCalories,
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      daysLogged,
      onTargetDays,
      bestDay,
    };
  }, [currentMonth, dailyLogs]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
  const monthName = currentMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    calendar: 'gregory' // Force Gregorian calendar only
  });

  // Calculate the progress percentage for calorie bars
  const getProgressPercentage = (calories: number, goal: number) => {
    if (calories === 0 || goal === 0) return 0;
    return Math.min((calories / goal) * 100, 100);
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <Card style={styles.monthNavCard}>
        <View style={styles.monthNavRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
            <MaterialIcons name={rtlIcon("chevron-left", "chevron-right")} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
            <MaterialIcons name={rtlIcon("chevron-right", "chevron-left")} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Summary Stats Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          {/* Average Calories */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Avg.{'\n'}Calories</Text>
            <Text style={styles.summaryValue}>{monthStats.avgCalories}</Text>
            <Text style={styles.summaryUnit}>kcal</Text>
          </View>

          {/* Macros Pills */}
          <View style={styles.macrosPills}>
            <View style={[styles.macroPill, { backgroundColor: '#FFB3BA' }]}>
              <Text style={styles.macroPillLabel}>Protein</Text>
              <Text style={styles.macroPillValue}>{Math.round(monthStats.totalProtein / (monthStats.daysLogged || 1))}g</Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: '#FFDFBA' }]}>
              <Text style={styles.macroPillLabel}>Carbs</Text>
              <Text style={styles.macroPillValue}>{Math.round(monthStats.totalCarbs / (monthStats.daysLogged || 1))}g</Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: '#E0BBE4' }]}>
              <Text style={styles.macroPillLabel}>Fat</Text>
              <Text style={styles.macroPillValue}>{Math.round(monthStats.totalFat / (monthStats.daysLogged || 1))}g</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Calendar Grid */}
      <Card style={styles.calendarCard}>
        <Text style={styles.calendarTitle}>Daily Calorie Intake</Text>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map(day => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        {calendarCells.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((cell, cellIndex) => {
              if (!cell) {
                return <View key={`empty-${weekIndex}-${cellIndex}`} style={styles.dayCell} />;
              }

              const progressPercentage = getProgressPercentage(cell.calories, cell.goal);

              return (
                <View key={cell.dateKey} style={styles.dayCell}>
                  <Text style={styles.dayNumber}>{cell.day}</Text>
                  {/* Progress bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPercentage}%` }
                      ]}
                    />
                  </View>
                  {cell.calories > 0 && (
                    <Text style={styles.calorieValue}>{cell.calories}</Text>
                  )}
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
              );
            })}
          </View>
        ))}
      </Card>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  // Month Navigation Styles
  monthNavCard: {
    padding: spacing.sm,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthNavButton: {
    padding: spacing.xs,
  },
  monthTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },

  // Summary Card Styles
  summaryCard: {
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  summarySection: {
    alignItems: 'center',
    gap: 2,
  },
  summaryLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: fonts.bold,
    color: colors.success,
  },
  summaryUnit: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },

  // Macros Pills Styles
  macrosPills: {
    flex: 1,
    gap: spacing.xs,
  },
  macroPill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  macroPillValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },

  // Calendar Card Styles
  calendarCard: {
    padding: spacing.md,
  },
  calendarTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Weekday Header Styles
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
  },

  // Calendar Grid Styles
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dayCell: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.xs,
    alignItems: 'center',
    gap: 2,
    minHeight: 70,
  },
  dayNumber: {
    fontSize: fonts.sm,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  calorieValue: {
    fontSize: 11,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  calorieUnit: {
    fontSize: 9,
    color: colors.textSecondary,
  },
});
