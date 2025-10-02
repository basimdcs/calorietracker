import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthlyView: React.FC<MonthlyViewProps> = ({ dailyLogs }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    const startDay = firstDay.getDay();
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
        goal: log?.calorieGoal || 2000,
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
  }, [currentMonth, logsByDate]);

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

  const selectedLog = selectedDate ? logsByDate[selectedDate] : null;

  const getCellColor = (calories: number, goal: number) => {
    if (calories === 0) return colors.gray100;
    const ratio = calories / goal;
    if (ratio < 0.5) return colors.blue100;
    if (ratio < 0.8) return colors.green100;
    if (ratio <= 1.1) return colors.success;
    if (ratio <= 1.3) return colors.yellow300;
    return colors.red300;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <MaterialIcons name="calendar-month" size={24} color={colors.primary} />
            <View style={styles.titleContent}>
              <Text style={styles.title}>Monthly Calendar</Text>
              <Text style={styles.subtitle}>{monthName}</Text>
            </View>
          </View>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navButton}
              accessibilityLabel="Previous month"
            >
              <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navButton}
              accessibilityLabel="Next month"
            >
              <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarSection}>
          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(day => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarCells.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((cell, cellIndex) => {
                  if (!cell) {
                    return <View key={`empty-${weekIndex}-${cellIndex}`} style={styles.dayCell} />;
                  }

                  const isSelected = selectedDate === cell.dateKey;
                  const cellColor = getCellColor(cell.calories, cell.goal);

                  return (
                    <Pressable
                      key={cell.dateKey}
                      style={[
                        styles.dayCell,
                        { backgroundColor: cellColor },
                        isSelected && styles.dayCellSelected,
                        cell.isToday && styles.dayCellToday,
                      ]}
                      onPress={() => setSelectedDate(isSelected ? null : cell.dateKey)}
                      accessibilityLabel={`${cell.date.toDateString()}, ${cell.calories} calories`}
                    >
                      <Text style={[
                        styles.dayNumber,
                        cell.isToday && styles.dayNumberToday,
                      ]}>
                        {cell.day}
                      </Text>
                      {cell.calories > 0 && (
                        <Text style={styles.calorieText} numberOfLines={1}>
                          {cell.calories > 999 ? `${Math.round(cell.calories / 1000)}k` : cell.calories}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>On target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.yellow300 }]} />
              <Text style={styles.legendText}>Over</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: colors.blue100 }]} />
              <Text style={styles.legendText}>Under</Text>
            </View>
          </View>
        </View>

        {/* Selected day details */}
        {selectedLog && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <MaterialIcons name="today" size={20} color={colors.primary} />
              <Text style={styles.detailsTitle}>
                {new Date(selectedDate!).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.detailsStats}>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>
                  {Math.round(selectedLog.totalNutrition.calories)}
                </Text>
                <Text style={styles.detailStatLabel}>Calories</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>{selectedLog.foods.length}</Text>
                <Text style={styles.detailStatLabel}>Items</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>
                  {Math.round(selectedLog.totalNutrition.protein)}g
                </Text>
                <Text style={styles.detailStatLabel}>Protein</Text>
              </View>
            </View>

            {selectedLog.foods.length > 0 && (
              <View style={styles.foodList}>
                <Text style={styles.foodListTitle}>Food items:</Text>
                {selectedLog.foods.slice(0, 3).map(food => (
                  <View key={food.id} style={styles.foodItem}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      • {food.foodItem.name}
                    </Text>
                    <Text style={styles.foodCalories}>
                      {Math.round(food.nutrition.calories)} cal
                    </Text>
                  </View>
                ))}
                {selectedLog.foods.length > 3 && (
                  <Text style={styles.moreItems}>
                    +{selectedLog.foods.length - 3} more items
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Monthly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Monthly Summary</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="local-fire-department" size={24} color={colors.error} />
              <Text style={styles.statValue}>{monthStats.totalCalories.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Calories</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{monthStats.avgCalories}</Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={styles.statValue}>{monthStats.daysLogged}</Text>
              <Text style={styles.statLabel}>Days Logged</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="track-changes" size={24} color={colors.blue600} />
              <Text style={styles.statValue}>{monthStats.onTargetDays}</Text>
              <Text style={styles.statLabel}>On Target</Text>
            </View>
          </View>

          {/* Macros summary */}
          <View style={styles.macrosCard}>
            <Text style={styles.macrosTitle}>Total Macros</Text>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <MaterialIcons name="fitness-center" size={18} color={colors.blue600} />
                <Text style={styles.macroValue}>{monthStats.totalProtein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <MaterialIcons name="breakfast-dining" size={18} color={colors.yellow600} />
                <Text style={styles.macroValue}>{monthStats.totalCarbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <MaterialIcons name="water-drop" size={18} color={colors.green600} />
                <Text style={styles.macroValue}>{monthStats.totalFat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {monthStats.bestDay && (
            <View style={styles.highlightCard}>
              <MaterialIcons name="emoji-events" size={20} color={colors.warning} />
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Best Day</Text>
                <Text style={styles.highlightValue}>
                  {new Date(monthStats.bestDay.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })} • {Math.round(monthStats.bestDay.totalNutrition.calories)} cal
                </Text>
              </View>
            </View>
          )}
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleSection: {
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
  monthNav: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarSection: {
    marginBottom: spacing.lg,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
  },
  calendarGrid: {
    gap: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayNumber: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dayNumberToday: {
    color: colors.accent,
    fontWeight: fonts.bold,
  },
  calorieText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailsTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
  detailsStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailStatLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  foodList: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
  },
  foodListTitle: {
    fontSize: fonts.xs,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  foodName: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.textPrimary,
  },
  foodCalories: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  moreItems: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  statsSection: {
    gap: spacing.md,
  },
  statsTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  macrosCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  macrosTitle: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroValue: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
  },
  macroLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  highlightCard: {
    backgroundColor: colors.yellow50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.yellow200,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textPrimary,
  },
});
