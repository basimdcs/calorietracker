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
import { colors, fonts, spacing } from '../../constants/theme';
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
});

export default HistoryScreen;