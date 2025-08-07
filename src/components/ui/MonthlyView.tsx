import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';

interface MonthlyViewProps {
  dailyLogs: DailyLog[];
}

interface MonthlyDayData {
  date: Date;
  calories: number;
  goal: number;
  items: number;
  intensity: number;
  hasData: boolean;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({ dailyLogs }) => {
  // Generate monthly data for the last 30 days
  const getMonthlyData = (): MonthlyDayData[] => {
    const monthData: MonthlyDayData[] = [];
    const today = new Date();

    // Group logs by date for quick lookup
    const logsByDate = dailyLogs.reduce((acc, log) => {
      acc[log.date] = log;
      return acc;
    }, {} as Record<string, DailyLog>);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayLog = logsByDate[dateKey];
      const calories = dayLog?.totalNutrition.calories || 0;
      const goal = dayLog?.calorieGoal || 2000;
      const itemCount = dayLog?.foods.length || 0;
      const hasData = calories > 0;

      monthData.push({
        date,
        calories: Math.round(calories),
        goal,
        items: itemCount,
        intensity: 0, // Will be calculated after
        hasData,
      });
    }

    // Calculate intensities based on goal achievement
    monthData.forEach(day => {
      if (!day.hasData) {
        day.intensity = 0;
      } else {
        const percentage = day.calories / day.goal;
        // Scale intensity: 0.2-1.0 based on goal achievement
        day.intensity = Math.min(Math.max(percentage * 0.8 + 0.2, 0.2), 1.0);
      }
    });

    return monthData;
  };

  const monthlyData = getMonthlyData();
  const totalCalories = monthlyData.reduce((sum, day) => sum + day.calories, 0);
  const monthlyAverage = Math.round(totalCalories / 30);
  const activeDays = monthlyData.filter(day => day.hasData).length;
  const totalItems = monthlyData.reduce((sum, day) => sum + day.items, 0);
  
  // Calculate streak (consecutive days with data)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  monthlyData.reverse().forEach((day, index) => {
    if (day.hasData) {
      tempStreak++;
      if (index === 0) currentStreak = tempStreak; // Current streak from today
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  });
  longestStreak = Math.max(longestStreak, tempStreak);
  monthlyData.reverse(); // Restore original order

  // Calculate consistency percentage
  const consistencyPercentage = Math.round((activeDays / 30) * 100);
  
  // Goal achievement percentage
  const goalsAchieved = monthlyData.filter(day => 
    day.hasData && day.calories >= day.goal * 0.95 && day.calories <= day.goal * 1.05
  ).length;
  const goalAchievementPercentage = activeDays > 0 ? Math.round((goalsAchieved / activeDays) * 100) : 0;

  const getIntensityColor = (intensity: number): string => {
    if (intensity === 0) return colors.gray200;
    
    // Use theme accent color with varying opacity for consistency
    const baseColor = colors.accent; // Theme accent color (emerald)
    const alpha = Math.max(intensity * 0.8 + 0.2, 0.2); // Ensure minimum visibility
    return `${baseColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  };

  const getTextColor = (intensity: number): string => {
    return intensity > 0.6 ? colors.white : colors.textPrimary;
  };

  // Group data into weeks for calendar display
  const getWeekRows = () => {
    const weeks: MonthlyDayData[][] = [];
    const startDate = new Date(monthlyData[0].date);
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Add empty cells for days before the start of our data
    const firstWeek: (MonthlyDayData | null)[] = new Array(startDayOfWeek).fill(null);
    let dataIndex = 0;
    
    // Fill the first week
    while (firstWeek.length < 7 && dataIndex < monthlyData.length) {
      firstWeek.push(monthlyData[dataIndex++]);
    }
    weeks.push(firstWeek.filter(Boolean) as MonthlyDayData[]);
    
    // Fill remaining weeks
    while (dataIndex < monthlyData.length) {
      const week = monthlyData.slice(dataIndex, dataIndex + 7);
      weeks.push(week);
      dataIndex += 7;
    }
    
    return weeks;
  };

  const weekRows = getWeekRows();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📈 This Month</Text>
          <Text style={styles.subtitle}>Consistency & progress tracking</Text>
        </View>
        <View style={styles.averageContainer}>
          <Text style={styles.averageNumber}>{monthlyAverage}</Text>
          <Text style={styles.averageLabel}>avg/day</Text>
        </View>
      </View>

      {/* Calendar Heatmap */}
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Daily Activity</Text>
        
        {/* Week day headers */}
        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {weekRows.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {/* Fill empty cells for incomplete weeks */}
              {week.length < 7 && weekIndex === 0 && 
                Array.from({ length: 7 - week.length }, (_, i) => (
                  <View key={`empty-${i}`} style={styles.emptyCell} />
                ))
              }
              {week.map((day, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    { backgroundColor: getIntensityColor(day.intensity) }
                  ]}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.dayCellText,
                      { color: getTextColor(day.intensity) }
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Fill empty cells at the end */}
              {week.length < 7 && weekIndex === weekRows.length - 1 &&
                Array.from({ length: 7 - week.length }, (_, i) => (
                  <View key={`empty-end-${i}`} style={styles.emptyCell} />
                ))
              }
            </View>
          ))}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendText} numberOfLines={1}>Less</Text>
          <View style={styles.legendDots}>
            {[0, 0.3, 0.5, 0.7, 1.0].map((intensity, index) => (
              <View
                key={index}
                style={[
                  styles.legendDot,
                  { backgroundColor: getIntensityColor(intensity) }
                ]}
              />
            ))}
          </View>
          <Text style={styles.legendText} numberOfLines={1}>More</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <LinearGradient
            colors={[colors.accent, colors.accentDark]}
            style={styles.metricCard}
          >
            <MaterialIcons name="local-fire-department" size={18} color={colors.textOnPrimary} />
            <Text style={[styles.metricValue, { color: colors.textOnPrimary }]}>{currentStreak}</Text>
            <Text style={[styles.metricLabel, { color: colors.textOnPrimary }]} numberOfLines={2}>Streak</Text>
          </LinearGradient>
          
          <View style={styles.metricCard}>
            <MaterialIcons name="event-available" size={18} color={colors.primary} />
            <Text style={styles.metricValue}>{activeDays}</Text>
            <Text style={styles.metricLabel} numberOfLines={2}>Days</Text>
          </View>
          
          <View style={styles.metricCard}>
            <MaterialIcons name="track-changes" size={18} color={colors.secondary} />
            <Text style={styles.metricValue}>{consistencyPercentage}%</Text>
            <Text style={styles.metricLabel} numberOfLines={2}>Consistency</Text>
          </View>
        </View>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <LinearGradient
          colors={[colors.primary + '15', colors.primary + '25']}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <MaterialIcons name="emoji-events" size={24} color={colors.primary} />
            <Text style={styles.progressTitle}>Monthly Progress</Text>
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{totalCalories.toLocaleString()}</Text>
              <Text style={styles.progressStatLabel}>Total Calories</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{goalAchievementPercentage}%</Text>
              <Text style={styles.progressStatLabel}>Goals Achieved</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{totalItems}</Text>
              <Text style={styles.progressStatLabel}>Food Items</Text>
            </View>
          </View>
          
          {consistencyPercentage >= 80 && (
            <View style={styles.celebrationBadge}>
              <MaterialIcons name="stars" size={16} color={colors.white} />
              <Text style={styles.celebrationText}>Excellent consistency! 🎉</Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: fonts.normal,
  },
  averageContainer: {
    alignItems: 'flex-end',
  },
  averageNumber: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    color: colors.primary,
  },
  averageLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  calendarContainer: {
    marginBottom: spacing.xl,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  weekDayText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.semibold,
    textAlign: 'center',
    width: 32,
  },
  calendarGrid: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  emptyCell: {
    width: 32,
    height: 32,
  },
  dayCellText: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  legendText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  legendDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  metricsContainer: {
    marginBottom: spacing.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  metricValue: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: fonts.medium,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  progressStatLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: fonts.medium,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  celebrationText: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
});