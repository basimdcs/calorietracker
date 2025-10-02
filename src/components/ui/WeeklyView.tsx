import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';

interface WeeklyViewProps {
  dailyLogs: DailyLog[];
}

interface DayData {
  date: Date;
  dateKey: string;
  dayName: string;
  dayShort: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: number;
  itemCount: number;
  isToday: boolean;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ dailyLogs }) => {
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
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayShort: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: Math.round(log?.totalNutrition.calories || 0),
        protein: Math.round(log?.totalNutrition.protein || 0),
        carbs: Math.round(log?.totalNutrition.carbs || 0),
        fat: Math.round(log?.totalNutrition.fat || 0),
        goal: log?.calorieGoal || 2000,
        itemCount: log?.foods.length || 0,
        isToday: dateKey === today.toISOString().split('T')[0],
      };
    });
  }, [dailyLogs]);

  // Calculate weekly stats
  const stats = useMemo(() => {
    const totalCalories = weekData.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = weekData.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = weekData.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = weekData.reduce((sum, day) => sum + day.fat, 0);
    const daysLogged = weekData.filter(day => day.calories > 0).length;
    const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;
    const avgGoal = weekData[0]?.goal || 2000;

    return {
      totalCalories,
      avgCalories,
      avgGoal,
      totalProtein,
      totalCarbs,
      totalFat,
      daysLogged,
    };
  }, [weekData]);

  const maxCalories = Math.max(...weekData.map(d => d.calories), stats.avgGoal);

  const getProgressColor = (calories: number, goal: number) => {
    if (calories === 0) return colors.gray300;
    const ratio = calories / goal;
    if (ratio < 0.8) return colors.accentLight;
    if (ratio <= 1.1) return colors.success;
    return colors.warning;
  };

  const renderDayBar = (day: DayData) => {
    const barHeight = Math.max((day.calories / maxCalories) * 120, 2);
    const goalHeight = (day.goal / maxCalories) * 120;
    const progressColor = getProgressColor(day.calories, day.goal);
    const percentage = day.goal > 0 ? Math.round((day.calories / day.goal) * 100) : 0;

    return (
      <View key={day.dateKey} style={styles.dayColumn}>
        {/* Bar Chart */}
        <View style={styles.barContainer}>
          {/* Goal line */}
          <View
            style={[
              styles.goalLine,
              { bottom: goalHeight }
            ]}
          />

          {/* Calorie bar */}
          <View
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: progressColor,
              }
            ]}
          >
            {day.calories > 0 && (
              <Text style={styles.barCalories} numberOfLines={1}>
                {day.calories}
              </Text>
            )}
          </View>
        </View>

        {/* Day info */}
        <View style={styles.dayInfo}>
          <Text style={[
            styles.dayLabel,
            day.isToday && styles.todayLabel
          ]}>
            {day.dayShort}
          </Text>
          <Text style={styles.dateLabel}>
            {day.date.getDate()}
          </Text>
          {day.calories > 0 && (
            <View style={[
              styles.percentageBadge,
              { backgroundColor: progressColor }
            ]}>
              <Text style={styles.percentageText}>
                {percentage}%
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialIcons name="insert-chart" size={24} color={colors.primary} />
            <View style={styles.titleContent}>
              <Text style={styles.title}>Weekly Overview</Text>
              <Text style={styles.subtitle}>Last 7 days</Text>
            </View>
          </View>
          <View style={styles.avgBadge}>
            <Text style={styles.avgValue}>{stats.avgCalories}</Text>
            <Text style={styles.avgLabel}>avg/day</Text>
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
              <View style={styles.legendLine} />
              <Text style={styles.legendText}>Goal line</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>On target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Over</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={20} color={colors.error} />
            <Text style={styles.statValue}>{stats.totalCalories.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="fitness-center" size={20} color={colors.blue600} />
            <Text style={styles.statValue}>{stats.totalProtein}g</Text>
            <Text style={styles.statLabel}>Total Protein</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="breakfast-dining" size={20} color={colors.yellow600} />
            <Text style={styles.statValue}>{stats.totalCarbs}g</Text>
            <Text style={styles.statLabel}>Total Carbs</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="water-drop" size={20} color={colors.green600} />
            <Text style={styles.statValue}>{stats.totalFat}g</Text>
            <Text style={styles.statLabel}>Total Fat</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Days Logged</Text>
            <Text style={styles.summaryValue}>{stats.daysLogged} / 7</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg vs Goal</Text>
            <Text style={styles.summaryValue}>
              {stats.avgCalories} / {stats.avgGoal}
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
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
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  avgBadge: {
    alignItems: 'flex-end',
  },
  avgValue: {
    fontSize: fonts['3xl'],
    fontWeight: fonts.bold,
    color: colors.primary,
    lineHeight: fonts['3xl'] * 1.1,
  },
  avgLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    justifyContent: 'space-around',
    height: 160,
    marginBottom: spacing.lg,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: spacing.xs,
    ...shadows.sm,
  },
  barCalories: {
    fontSize: fonts.xs,
    fontWeight: fonts.bold,
    color: colors.white,
  },
  goalLine: {
    position: 'absolute',
    width: '85%',
    height: 2,
    backgroundColor: colors.textPrimary,
    opacity: 0.3,
    borderRadius: 1,
  },
  dayInfo: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: fonts.bold,
  },
  dateLabel: {
    fontSize: fonts.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  percentageBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 32,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 9,
    fontWeight: fonts.bold,
    color: colors.white,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLine: {
    width: 12,
    height: 2,
    backgroundColor: colors.textPrimary,
    opacity: 0.3,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  summaryLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
});
