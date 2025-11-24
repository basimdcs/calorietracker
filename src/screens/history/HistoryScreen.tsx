import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing, shadows, borderRadius } from '../../constants/theme';
import { useFoodStore } from '../../stores/foodStore';
import { DailyLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { DailyView, WeeklyView, MonthlyView } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';

type ViewMode = 'daily' | 'weekly' | 'monthly';

const HistoryScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const { dailyLogs, removeLoggedFood } = useFoodStore();
  const { t } = useTranslation();

  // Group food items by date
  const groupedByDate = dailyLogs.reduce((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {} as Record<string, DailyLog>);

  // Get data for selected date
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateLog = groupedByDate[selectedDateKey];

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
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
            {t('history.daily')}
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
            {t('history.weekly')}
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
            {t('history.monthly')}
          </Text>
        </TouchableOpacity>
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
            showDateHeader={false}
            showDateSelector={true}
            onDateChange={handleDateChange}
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
          <Text style={styles.headerTitle}>{t('history.screenTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('history.screenSubtitle')}</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {renderViewModeSelector()}
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
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontWeight: fonts.normal,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  viewModeCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
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
});

export default HistoryScreen;
