import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, shadows, borderRadius } from '../../constants/theme';
import { useFoodStore } from '../../stores/foodStore';
import { DailyLog, LoggedFood } from '../../types';
import { Card } from '../../components/ui/Card';
import { DailyView, WeeklyView, MonthlyView } from '../../components/ui';

type ViewMode = 'daily' | 'weekly' | 'monthly';


const HistoryScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const { dailyLogs, debugStoreState, removeLoggedFood } = useFoodStore();

  // Debug logs
  React.useEffect(() => {
    console.log('📊 History Screen - Daily Logs:', dailyLogs);
    console.log('📊 History Screen - Daily Logs Count:', dailyLogs.length);
  }, [dailyLogs]);

  // Group food items by date
  const groupedByDate = dailyLogs.reduce((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {} as Record<string, DailyLog>);

  // Get data for selected date
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateLog = groupedByDate[selectedDateKey];



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
      <Calendar
        onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textPrimary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.textOnPrimary,
          todayTextColor: colors.primary,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textTertiary,
          dotColor: colors.primary,
          selectedDotColor: colors.textOnPrimary,
          arrowColor: colors.primary,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.primary,
          textDayFontFamily: fonts.body,
          textMonthFontFamily: fonts.heading,
          textDayHeaderFontFamily: fonts.body,
          textDayFontWeight: fonts.light,
          textMonthFontWeight: fonts.bold,
          textDayHeaderFontWeight: fonts.medium,
          textDayFontSize: fonts.base,
          textMonthFontSize: fonts.lg,
          textDayHeaderFontSize: fonts.sm,
        }}
      />
    </Card>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'weekly':
        return <WeeklyView dailyLogs={dailyLogs} />;
      case 'monthly':
        return <MonthlyView dailyLogs={dailyLogs} />;
      case 'daily':
      default:
        return (
          <DailyView
            dailyLog={selectedDateLog}
            date={selectedDateKey}
            title="Calories Consumed"
            showDateHeader={true}
            onRemoveFood={removeLoggedFood}
          />
        );
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
            {renderContent()}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
    shadowColor: colors.black,
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
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.normal,
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
    ...shadows.md,
    shadowColor: colors.primary,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: colors.textOnPrimary,
  },
  calendarCard: {
    ...shadows.md,
    shadowColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default HistoryScreen;