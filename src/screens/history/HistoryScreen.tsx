import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { useFoodStore } from '../../stores/foodStore';
import { DailyLog, LoggedFood } from '../../types';
import { Card } from '../../components/ui/Card';

type ViewMode = 'daily' | 'weekly' | 'monthly';

interface DayData {
  date: Date;
  day: string;
  calories: number;
  items: number;
}

interface MonthData {
  date: Date;
  calories: number;
  items: number;
}

const HistoryScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const { dailyLogs } = useFoodStore();

  // Group food items by date
  const groupedByDate = dailyLogs.reduce((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {} as Record<string, DailyLog>);

  // Get data for selected date
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateLog = groupedByDate[selectedDateKey];
  const selectedDateCalories = selectedDateLog?.totalNutrition.calories || 0;
  const selectedDateItems = selectedDateLog?.foods.length || 0;

  // Generate weekly data
  const getWeeklyData = (): DayData[] => {
    const weekData: DayData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayLog = groupedByDate[dateKey];
      const calories = dayLog?.totalNutrition.calories || 0;
      const items = dayLog?.foods.length || 0;

      weekData.push({
        date: date,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: calories,
        items: items,
      });
    }

    return weekData;
  };

  // Generate monthly data
  const getMonthlyData = (): MonthData[] => {
    const monthData: MonthData[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayLog = groupedByDate[dateKey];
      const calories = dayLog?.totalNutrition.calories || 0;
      const items = dayLog?.foods.length || 0;

      monthData.push({
        date: date,
        calories: calories,
        items: items,
      });
    }

    return monthData;
  };

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const weeklyAverage = Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7);
  const monthlyAverage = Math.round(monthlyData.reduce((sum, day) => sum + day.calories, 0) / 30);

  const getMealIcon = (index: number): string => {
    switch (index) {
      case 0: return '🥞';
      case 1: return '🥗';
      case 2: return '🍖';
      default: return '🍽️';
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    dailyLogs.forEach(log => {
      marked[log.date] = {
        marked: true,
        dotColor: colors.primary,
      };
    });
    return marked;
  };

  const renderViewModeSelector = () => (
    <Card style={styles.viewModeCard}>
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'daily' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('daily')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'daily' && styles.viewModeTextActive,
          ]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'weekly' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'weekly' && styles.viewModeTextActive,
          ]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'monthly' && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'monthly' && styles.viewModeTextActive,
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderCalendar = () => (
    <Card style={styles.calendarCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
        <Text style={styles.cardTitle}>Calendar View</Text>
      </View>
      <View style={styles.cardContent}>
        <Calendar
          onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: colors.white,
            calendarBackground: colors.white,
            textSectionTitleColor: colors.textPrimary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textSecondary,
            dotColor: colors.primary,
            selectedDotColor: colors.white,
            arrowColor: colors.primary,
            monthTextColor: colors.textPrimary,
            indicatorColor: colors.primary,
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: fonts.base,
            textMonthFontSize: fonts.lg,
            textDayHeaderFontSize: fonts.sm,
          }}
        />
      </View>
    </Card>
  );

  const renderDailyView = () => (
    <Card style={styles.dailyCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="today" size={24} color={colors.secondary} />
        <Text style={styles.cardTitle}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.dailySummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(selectedDateCalories)}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{selectedDateItems}</Text>
            <Text style={styles.summaryLabel}>Food Items</Text>
          </View>
        </View>

        {selectedDateLog && selectedDateLog.foods.length > 0 ? (
          <View style={styles.foodList}>
            <Text style={styles.sectionTitle}>Food Items</Text>
            {selectedDateLog.foods.map((food, index) => (
              <View key={food.id} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodIcon}>{getMealIcon(index)}</Text>
                  <View style={styles.foodDetails}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      {food.foodItem.name}
                    </Text>
                    <Text style={styles.foodQuantity}>
                      {food.quantity} servings
                    </Text>
                  </View>
                </View>
                <Text style={styles.foodCalories}>
                  {Math.round(food.nutrition.calories)} cal
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No food logged on this date</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderWeeklyView = () => (
    <Card style={styles.weeklyCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="view-week" size={24} color={colors.accent} />
        <Text style={styles.cardTitle}>Weekly Overview</Text>
        <Text style={styles.averageText}>Avg: {weeklyAverage} cal/day</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.weekChart}>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{day.day}</Text>
              <View style={styles.dayBar}>
                <View
                  style={[
                    styles.dayBarFill,
                    {
                      height: `${Math.min((day.calories / 2000) * 100, 100)}%`,
                      backgroundColor: day.calories > 0 ? colors.primary : colors.gray300,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayCalories}>{Math.round(day.calories)}</Text>
              <Text style={styles.dayItems}>{day.items} items</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );

  const renderMonthlyView = () => (
    <Card style={styles.monthlyCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="calendar-view-month" size={24} color={colors.warning} />
        <Text style={styles.cardTitle}>Monthly Overview</Text>
        <Text style={styles.averageText}>Avg: {monthlyAverage} cal/day</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.monthGrid}>
          {monthlyData.map((day, index) => (
            <View key={index} style={styles.monthDay}>
              <View
                style={[
                  styles.monthDayDot,
                  {
                    backgroundColor: day.calories > 0 ? colors.primary : colors.gray300,
                    opacity: day.calories > 0 ? Math.min(day.calories / 2000, 1) : 0.3,
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.monthLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.gray300 }]} />
            <Text style={styles.legendText}>No data</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Low calories</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary, opacity: 1 }]} />
            <Text style={styles.legendText}>High calories</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const getDayIcon = (day: string): string => {
    switch (day.toLowerCase()) {
      case 'mon': return '🌅';
      case 'tue': return '🌤️';
      case 'wed': return '☀️';
      case 'thu': return '🌤️';
      case 'fri': return '🌅';
      case 'sat': return '🎉';
      case 'sun': return '😴';
      default: return '📅';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                📊 History & Reports
              </Text>
              <Text style={styles.headerSubtitle}>
                Track your nutrition journey
              </Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {renderViewModeSelector()}
            
            {viewMode === 'daily' && renderCalendar()}
            {viewMode === 'daily' && renderDailyView()}
            {viewMode === 'weekly' && renderWeeklyView()}
            {viewMode === 'monthly' && renderMonthlyView()}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  viewModeCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: colors.white,
  },
  calendarCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dailyCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weeklyCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  averageText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardContent: {
    padding: spacing.lg,
  },
  dailySummary: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
  },
  summaryValue: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  foodList: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  foodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  foodQuantity: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  foodCalories: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: spacing.sm,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dayBar: {
    width: 20,
    height: 120,
    backgroundColor: colors.gray200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  dayBarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 10,
  },
  dayCalories: {
    fontSize: fonts.xs,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dayItems: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthDay: {
    width: 16,
    height: 16,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
});

export default HistoryScreen;