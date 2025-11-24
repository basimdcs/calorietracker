import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { DailyLog } from '../../types';
import { Card } from './Card';
import { useUserCalorieGoal } from '../../utils/calorieGoal';
import { useRTLStyles } from '../../utils/rtl';
import { useTranslation } from '../../hooks/useTranslation';
import Svg, { Polyline, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (spacing.md * 4); // Account for margins and padding

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
  const { rtlIcon } = useRTLStyles();
  const { t, currentLanguage } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous week, etc.

  // Generate week data based on offset
  const weekData = useMemo((): DayData[] => {
    const today = new Date();
    // Calculate the start of the week based on offset
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7)); // Start on Sunday

    const logsByDate = dailyLogs.reduce((acc, log) => {
      acc[log.date] = log;
      return acc;
    }, {} as Record<string, DailyLog>);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const log = logsByDate[dateKey];
      const todayKey = today.toISOString().split('T')[0];

      const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
      return {
        date,
        dateKey,
        dayShort: date.toLocaleDateString(locale, { weekday: 'short' }),
        calories: Math.round(log?.totalNutrition.calories || 0),
        protein: Math.round(log?.totalNutrition.protein || 0),
        carbs: Math.round(log?.totalNutrition.carbs || 0),
        fat: Math.round(log?.totalNutrition.fat || 0),
        goal: userCalorieGoal,
        isToday: dateKey === todayKey,
      };
    });
  }, [dailyLogs, userCalorieGoal, weekOffset, currentLanguage]);

  // Calculate weekly stats
  const stats = useMemo(() => {
    const totalCalories = weekData.reduce((sum, day) => sum + day.calories, 0);
    const totalProtein = weekData.reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = weekData.reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = weekData.reduce((sum, day) => sum + day.fat, 0);
    const daysLogged = weekData.filter(day => day.calories > 0).length;
    const avgCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;

    // Calculate macro percentages
    const totalMacros = totalProtein + totalCarbs + totalFat;
    const proteinPercent = totalMacros > 0 ? Math.round((totalProtein / totalMacros) * 100) : 0;
    const carbsPercent = totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 0;
    const fatPercent = totalMacros > 0 ? Math.round((totalFat / totalMacros) * 100) : 0;

    // Calculate days under goal
    const daysUnderGoal = weekData.filter(day => day.calories > 0 && day.calories <= day.goal).length;

    return {
      totalCalories,
      avgCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      daysLogged,
      proteinPercent,
      carbsPercent,
      fatPercent,
      daysUnderGoal,
    };
  }, [weekData]);

  // Get week date range
  const getWeekRange = () => {
    const firstDay = weekData[0].date;
    const lastDay = weekData[6].date;
    const locale = currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    const monthStart = firstDay.toLocaleDateString(locale, { month: 'short' });
    const monthEnd = lastDay.toLocaleDateString(locale, { month: 'short' });
    const dayStart = firstDay.getDate();
    const dayEnd = lastDay.getDate();

    if (monthStart === monthEnd) {
      return `${monthStart} ${dayStart} - ${dayEnd}`;
    }
    return `${monthStart} ${dayStart} - ${monthEnd} ${dayEnd}`;
  };

  // Handle week navigation
  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => {
    if (weekOffset < 0) {
      setWeekOffset(weekOffset + 1);
    }
  };

  // Render line chart for calories
  const renderLineChart = () => {
    const CHART_HEIGHT = 150;
    const CHART_PADDING_TOP = 20;
    const CHART_PADDING_BOTTOM = 10;
    const maxCalories = Math.max(...weekData.map(d => d.calories), stats.avgCalories, 100);

    // Use full width minus card padding
    const chartWidth = SCREEN_WIDTH - (spacing.lg * 4); // Account for card padding on both sides

    // Calculate points for the line
    const points = weekData.map((day, index) => {
      const x = (index / 6) * chartWidth;
      const availableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
      const y = CHART_PADDING_TOP + (availableHeight - ((day.calories / maxCalories) * availableHeight));
      return { x, y, calories: day.calories };
    });

    // Create polyline points string
    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    // Average line (dotted horizontal line)
    const availableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
    const avgY = CHART_PADDING_TOP + (availableHeight - ((stats.avgCalories / maxCalories) * availableHeight));

    return (
      <View style={styles.lineChartContainer}>
        <Svg width={chartWidth} height={CHART_HEIGHT} style={{ alignSelf: 'center' }}>
          {/* Average line (dotted) */}
          {stats.avgCalories > 0 && (
            <Polyline
              points={`0,${avgY} ${chartWidth},${avgY}`}
              stroke={colors.gray400}
              strokeWidth="1.5"
              strokeDasharray="5,5"
              fill="none"
            />
          )}

          {/* Calorie line */}
          <Polyline
            points={pointsString}
            stroke={colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            point.calories > 0 && (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="5"
                fill={colors.primary}
              />
            )
          ))}
        </Svg>

        {/* Day labels */}
        <View style={styles.dayLabelsRow}>
          {weekData.map((day, index) => (
            <View key={day.dateKey} style={styles.dayLabelContainer}>
              <Text style={[
                styles.dayLabel,
                day.isToday && styles.todayLabel
              ]}>
                {day.dayShort}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render macro bar chart
  const renderMacroBar = () => {
    return (
      <View style={styles.macroBarContainer}>
        <View style={styles.macroBar}>
          <View style={[styles.macroSegment, {
            flex: stats.proteinPercent,
            backgroundColor: colors.nutritionProtein
          }]} />
          <View style={[styles.macroSegment, {
            flex: stats.carbsPercent,
            backgroundColor: colors.nutritionCarbs
          }]} />
          <View style={[styles.macroSegment, {
            flex: stats.fatPercent,
            backgroundColor: colors.nutritionFat
          }]} />
        </View>

        <View style={styles.macroLegend}>
          <View style={styles.macroLegendItem}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.macroDot, { backgroundColor: colors.nutritionProtein }]} />
              <Text style={styles.macroLabel}>{t('nutrition.protein')}</Text>
            </View>
            <Text style={styles.macroPercent}>{stats.proteinPercent}%</Text>
          </View>

          <View style={styles.macroLegendItem}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.macroDot, { backgroundColor: colors.nutritionCarbs }]} />
              <Text style={styles.macroLabel}>{t('nutrition.carbs')}</Text>
            </View>
            <Text style={styles.macroPercent}>{stats.carbsPercent}%</Text>
          </View>

          <View style={styles.macroLegendItem}>
            <View style={styles.macroLabelRow}>
              <View style={[styles.macroDot, { backgroundColor: colors.nutritionFat }]} />
              <Text style={styles.macroLabel}>{t('nutrition.fat')}</Text>
            </View>
            <Text style={styles.macroPercent}>{stats.fatPercent}%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <Card style={styles.weekNavigation}>
        <View style={styles.weekNavigationRow}>
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
            <MaterialIcons name={rtlIcon("chevron-left", "chevron-right")} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.weekRange}>{getWeekRange()}</Text>
          <TouchableOpacity
            onPress={goToNextWeek}
            style={styles.navButton}
            disabled={weekOffset >= 0}
          >
            <MaterialIcons
              name={rtlIcon("chevron-right", "chevron-left")}
              size={28}
              color={weekOffset >= 0 ? colors.gray300 : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Calorie Intake Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('stats.calorieIntake')}</Text>
          <Text style={styles.avgText}>{t('stats.avg')}: {stats.avgCalories} {t('nutrition.kcal')} / {t('stats.perDay')}</Text>
        </View>
        {renderLineChart()}
      </Card>

      {/* Average Macros Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t('stats.averageMacros')}</Text>
        {renderMacroBar()}
      </Card>

      {/* This Week's Insights Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{t('stats.weekInsights')}</Text>

        <View style={styles.insightsContainer}>
          {/* Calorie Goal Insight */}
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: colors.primary50 }]}>
              <MaterialIcons name="local-fire-department" size={24} color={colors.primary} />
            </View>
            <Text style={styles.insightText}>
              You stayed under your calorie goal on {stats.daysUnderGoal} out of {stats.daysLogged} days. Great job!
            </Text>
          </View>

          {/* Protein Insight */}
          <View style={styles.insightRow}>
            <View style={[styles.insightIcon, { backgroundColor: colors.primary50 }]}>
              <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
            </View>
            <Text style={styles.insightText}>
              Your average protein intake was {stats.proteinPercent}% of your macros. {stats.proteinPercent >= 25 ? 'Keep it up!' : 'Try to increase it!'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  weekNavigation: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  weekNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: spacing.xs,
  },
  weekRange: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.base,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  avgText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },

  // Line Chart Styles
  lineChartContainer: {
    paddingTop: spacing.sm,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  dayLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: fonts.sm,
    fontWeight: fonts.medium,
    color: colors.textSecondary,
  },
  todayLabel: {
    color: colors.primary,
    fontWeight: fonts.bold,
  },

  // Macro Bar Styles
  macroBarContainer: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  macroBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  macroSegment: {
    height: '100%',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  macroLegendItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  macroPercent: {
    fontSize: fonts.lg,
    color: colors.textPrimary,
    fontWeight: fonts.bold,
  },

  // Insights Styles
  insightsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.textPrimary,
    lineHeight: fonts.sm * 1.6,
    paddingTop: spacing.xs,
  },
});
