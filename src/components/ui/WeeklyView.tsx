import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
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

const { width: screenWidth } = Dimensions.get('window');

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
  
  // Get the user's actual calorie goal (use the first non-zero goal or default to 2000)
  const userGoal = weeklyData.find(day => day.goal > 0)?.goal || 2000;
  
  // Calculate the maximum value for scaling (consider both calories and user goal)
  const maxCalories = Math.max(...weeklyData.map(day => day.calories), userGoal);
  
  // Set a reasonable maximum for scaling that includes the user's goal
  const maxScaleValue = Math.max(maxCalories, userGoal, 2500);
  
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

  const getBarColor = (status: 'under' | 'target' | 'over') => {
    switch (status) {
      case 'under':
        return '#34C759'; // Apple green
      case 'target':
        return '#007AFF'; // Apple blue
      case 'over':
        return '#FF9500'; // Apple orange
      default:
        return colors.gray300;
    }
  };

  const renderDay = (day: WeeklyDayData, index: number) => {
    const maxHeight = 80;
    
    // Scale bars based on maxScaleValue
    const barHeight = Math.max((day.calories / maxScaleValue) * maxHeight, 4);
    const goalHeight = (userGoal / maxScaleValue) * maxHeight;
    
    // Ensure bars and goal lines never exceed the container height
    const clampedBarHeight = Math.min(barHeight, maxHeight);
    const clampedGoalHeight = Math.min(goalHeight, maxHeight);
    
    const barColor = getBarColor(day.status);
    const isToday = day.date.toDateString() === new Date().toDateString();

    return (
      <View key={index} style={styles.dayContainer}>
        {/* Goal line - using user's actual goal */}
        <View style={[styles.goalLine, { bottom: clampedGoalHeight + 100 }]} />
        
        {/* Calorie bar - positioned from bottom */}
        <View style={styles.barWrapper}>
          <Animated.View
            style={[
              styles.barContainer,
              {
                height: barAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, clampedBarHeight],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[barColor, `${barColor}80`]}
              style={styles.bar}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
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
    <View style={styles.container}>
      {/* Separate Header Block */}
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <MaterialIcons name="bar-chart" size={20} color={colors.primary} />
          <Text style={styles.title}>Weekly Overview</Text>
        </View>
      </View>

      {/* Chart Card */}
      <Card style={styles.chartCard}>
        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => renderDay(day, index))}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyTotal.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weeklyAverage.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.textSecondary }]} />
            <Text style={styles.legendText}>Goal ({userGoal})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendText}>Under</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendText}>Target</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={styles.legendText}>Over</Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.sm,
  },
  headerBlock: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  chartCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  chartSection: {
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: spacing.xs,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 2,
    minHeight: 160,
  },
  barWrapper: {
    width: '85%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barContainer: {
    width: '100%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    minHeight: 4,
  },
  bar: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
  goalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.4,
  },
  dayInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  dayText: {
    fontSize: fonts.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '700',
  },
  caloriesText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  todayCalories: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.md,
  },
  statValue: {
    fontSize: fonts.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 12,
    height: 1,
    marginRight: spacing.xs,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});