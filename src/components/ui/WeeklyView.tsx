import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';

interface WeeklyViewProps {
  dailyLogs: DailyLog[];
}

interface WeeklyDayData {
  date: Date;
  day: string;
  calories: number;
  goal: number;
  status: 'under' | 'target' | 'over';
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ dailyLogs }) => {
  // Generate weekly data for the last 7 days
  const getWeeklyData = (): WeeklyDayData[] => {
    const weekData: WeeklyDayData[] = [];
    const today = new Date();

    // Group logs by date for quick lookup
    const logsByDate = dailyLogs.reduce((acc, log) => {
      acc[log.date] = log;
      return acc;
    }, {} as Record<string, DailyLog>);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayLog = logsByDate[dateKey];
      const calories = dayLog?.totalNutrition.calories || 0;
      const goal = dayLog?.calorieGoal || 2000;
      const percentage = goal > 0 ? calories / goal : 0;
      
      let status: 'under' | 'target' | 'over' = 'under';
      if (percentage >= 0.95 && percentage <= 1.05) status = 'target';
      else if (percentage > 1.05) status = 'over';

      weekData.push({
        date,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        calories: Math.round(calories),
        goal,
        status,
      });
    }

    return weekData;
  };

  const weeklyData = getWeeklyData();
  const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.calories, 0);
  const weeklyAverage = Math.round(weeklyTotal / 7);
  
  // Get the user's actual calorie goal
  const userGoal = weeklyData.find(day => day.goal > 0)?.goal || 2000;
  
  // Calculate scaling - use a sensible maximum that includes user goal
  const maxCalories = Math.max(...weeklyData.map(day => day.calories), userGoal);
  const maxScale = Math.max(maxCalories, userGoal * 1.2); // 20% above goal for scaling
  
  // Animation values for bars
  const barAnimations = React.useRef(weeklyData.map(() => new Animated.Value(0))).current;

  // Animate bars on mount
  React.useEffect(() => {
    const animations = barAnimations.map((anim: Animated.Value, index: number) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 80,
        useNativeDriver: false,
      })
    );

    Animated.stagger(80, animations).start();
  }, [weeklyData]);

  const getBarGradient = (status: 'under' | 'target' | 'over'): [string, string] => {
    switch (status) {
      case 'under':
        return [colors.accentLight, colors.success];
      case 'target':
        return [colors.primaryLight, colors.primary];
      case 'over':
        return [colors.yellow200, colors.warning];
      default:
        return [colors.gray300, colors.gray400];
    }
  };

  const renderDay = (day: WeeklyDayData, index: number) => {
    const barHeight = Math.max((day.calories / maxScale) * 60, 2); // Max 60px height
    const goalPosition = (userGoal / maxScale) * 60; // Goal line position
    const [startCol, endCol] = getBarGradient(day.status);
    const isToday = day.date.toDateString() === new Date().toDateString();

    return (
      <View key={index} style={styles.dayColumn}>
        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Goal line */}
          <View style={[styles.goalLine, { bottom: goalPosition }]} />
          
          {/* Bar */}
          <Animated.View
            style={[
              styles.bar,
              {
                height: barAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, barHeight],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[startCol, endCol]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        
        {/* Day info */}
        <View style={styles.dayInfo}>
          <Text style={[styles.dayText, isToday && styles.todayText]}>
            {day.day}
          </Text>
          <Text style={[styles.caloriesText, isToday && styles.todayCalories]} numberOfLines={1}>
            {day.calories.toLocaleString()}
          </Text>
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
            <MaterialIcons name="bar-chart" size={20} color={colors.primary} />
            <Text style={styles.title}>Weekly Overview</Text>
          </View>
          <Text style={styles.subtitle}>Daily calories vs goal</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeValue}>{weeklyAverage}</Text>
          <Text style={styles.badgeLabel}>avg/day</Text>
        </View>
      </View>

      {/* Chart Panel */}
      <View style={styles.chartPanel}>
        <View style={styles.chartContainer}>
          {weeklyData.map((day, index) => renderDay(day, index))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>{weeklyTotal.toLocaleString()}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue} numberOfLines={1}>{weeklyAverage.toLocaleString()}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>Average</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendLine} />
          <Text style={styles.legendText} numberOfLines={1}>Goal ({userGoal})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText} numberOfLines={1}>Under</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText} numberOfLines={1}>Target</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText} numberOfLines={1}>Over</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.sm,
    ...shadows.md,
    shadowColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerLeft: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  badge: {
    alignItems: 'flex-end',
  },
  badgeValue: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.primary,
    lineHeight: fonts['2xl'] * 1.1,
  },
  badgeLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartPanel: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.xl,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartArea: {
    width: '100%',
    height: 80,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bar: {
    width: '70%',
    borderRadius: borderRadius.md,
    minHeight: 2,
    ...shadows.sm,
  },
  goalLine: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  dayInfo: {
    alignItems: 'center',
    minHeight: 40,
  },
  dayText: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  todayText: {
    color: colors.primary,
    fontWeight: fonts.bold,
  },
  caloriesText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
    textAlign: 'center',
  },
  todayCalories: {
    color: colors.textPrimary,
    fontWeight: fonts.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.gray200, marginHorizontal: spacing.md },
  statValue: { fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.textPrimary, marginBottom: spacing.xs },
  statLabel: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: fonts.medium },
  legend: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray200 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendLine: { width: 12, height: 1, backgroundColor: colors.textSecondary, opacity: 0.6, marginRight: spacing.xs },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xs },
  legendText: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: fonts.medium },
});