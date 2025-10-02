import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';
import { useUserCalorieGoal } from '../../utils/calorieGoal';

interface WeeklyViewProps {
  dailyLogs: DailyLog[];
}

interface DayData {
  date: Date;
  dateKey: string;
  dayShort: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: number;
  isToday: boolean;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ dailyLogs }) => {
  const userCalorieGoal = useUserCalorieGoal();

  // Generate last 7 days data
  const weekData = useMemo((): DayData[] => {
    const today = new Date();
    const logsByDate = dailyLogs.reduce((acc, log) => {
      acc[log.date] = log;
      return acc;
    }, {} as Record<string, DailyLog>);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateKey = date.toISOString().split('T')[0];
      const log = logsByDate[dateKey];

      return {
        date,
        dateKey,
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(log?.totalNutrition.calories || 0),
        protein: Math.round(log?.totalNutrition.protein || 0),
        carbs: Math.round(log?.totalNutrition.carbs || 0),
        fat: Math.round(log?.totalNutrition.fat || 0),
        goal: userCalorieGoal, // Single source of truth
        isToday: dateKey === today.toISOString().split('T')[0],
      };
    });
  }, [dailyLogs, userCalorieGoal]);

  // Calculate weekly stats
  const stats = useMemo(() => {
    const totalCalories = weekData.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = weekData.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = weekData.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = weekData.reduce((sum, day) => sum + day.fat, 0);
    const daysLogged = weekData.filter(day => day.calories > 0).length;
    const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;

    return {
      totalCalories,
      avgCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      daysLogged,
    };
  }, [weekData]);

  const maxCalories = Math.max(...weekData.map(d => Math.max(d.calories, d.goal)), 100);

  const getProgressColor = (calories: number, goal: number) => {
    if (calories === 0) return colors.gray300;
    const ratio = calories / goal;
    if (ratio < 0.8) return colors.blue500;
    if (ratio <= 1.1) return colors.success;
    return colors.warning;
  };

  const renderDayBar = (day: DayData) => {
    const barHeight = Math.max((day.calories / maxCalories) * 100, 0);
    const goalHeight = (day.goal / maxCalories) * 100;
    const progressColor = getProgressColor(day.calories, day.goal);
    const percentage = day.goal > 0 ? Math.round((day.calories / day.goal) * 100) : 0;

    return (
      <View key={day.dateKey} style={styles.dayColumn}>
        {/* Bar container with fixed height */}
        <View style={styles.barContainer}>
          {/* Goal indicator line */}
          {day.goal > 0 && (
            <View style={[styles.goalLine, { bottom: `${goalHeight}%` }]} />
          )}

          {/* Calorie bar */}
          {day.calories > 0 && (
            <View
              style={[
                styles.bar,
                {
                  height: `${barHeight}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          )}
        </View>

        {/* Day label */}
        <View style={styles.dayInfo}>
          <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
            {day.dayShort}
          </Text>

          {day.calories > 0 && (
            <>
              <Text style={styles.calorieValue} numberOfLines={1}>
                {day.calories > 999 ? `${(day.calories / 1000).toFixed(1)}k` : day.calories}
              </Text>
              <Text style={[styles.percentageText, { color: progressColor }]}>
                {percentage}%
              </Text>
            </>
          )}
          {day.calories === 0 && (
            <Text style={styles.noData}>—</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <MaterialIcons name="insert-chart" size={20} color={colors.primary} />
            <Text style={styles.title}>Weekly Overview</Text>
          </View>
          <Text style={styles.subtitle}>Last 7 days performance</Text>
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgValue}>{stats.avgCalories}</Text>
          <Text style={styles.avgLabel}>avg</Text>
        </View>
      </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            {weekData.map(day => renderDayBar(day))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendDash} />
              <Text style={styles.legendText}>Goal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Over</Text>
            </View>
          </View>
        </View>

        {/* Stats Summary - 2x2 Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Weekly Totals</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.red50 }]}>
                <MaterialIcons name="local-fire-department" size={18} color={colors.error} />
              </View>
              <Text style={styles.statValue}>{(stats.totalCalories / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.blue50 }]}>
                <MaterialIcons name="fitness-center" size={18} color={colors.blue600} />
              </View>
              <Text style={styles.statValue}>{stats.totalProtein}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.yellow50 }]}>
                <MaterialIcons name="bakery-dining" size={18} color={colors.yellow600} />
              </View>
              <Text style={styles.statValue}>{stats.totalCarbs}g</Text>
              <Text style={styles.statLabel}>Carbs</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.green50 }]}>
                <MaterialIcons name="water-drop" size={18} color={colors.green600} />
              </View>
              <Text style={styles.statValue}>{stats.totalFat}g</Text>
              <Text style={styles.statLabel}>Fat</Text>
            </View>
          </View>
        </View>

      {/* Bottom Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.daysLogged}/7</Text>
          <Text style={styles.summaryLabel}>Days tracked</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.avgCalories}</Text>
          <Text style={styles.summaryLabel}>Daily average</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  avgBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  avgValue: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.primary,
    lineHeight: fonts.xl * 1.1,
  },
  avgLabel: {
    fontSize: 9,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: fonts.semibold,
  },
  chartSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  dayColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bar: {
    width: '85%',
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
    minHeight: 2,
  },
  goalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.4,
    left: 0,
  },
  dayInfo: {
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: fonts.bold,
  },
  calorieValue: {
    fontSize: 11,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  percentageText: {
    fontSize: 9,
    fontWeight: fonts.semibold,
  },
  noData: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDash: {
    width: 10,
    height: 1,
    backgroundColor: colors.textPrimary,
    opacity: 0.4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  statsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },
  summaryValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
