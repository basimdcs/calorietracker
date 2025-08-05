import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';

interface StatsSectionProps {
  userStats: {
    bmr?: number;
    tdee?: number;
    calorieGoal?: number;
  };
}

const StatsSection: React.FC<StatsSectionProps> = ({ userStats }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Current Stats</Text>
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(userStats?.bmr || 0)}</Text>
              <Text style={styles.statLabel}>BMR</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(userStats?.tdee || 0)}</Text>
              <Text style={styles.statLabel}>TDEE</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(userStats?.calorieGoal || 0)}</Text>
              <Text style={styles.statLabel}>Daily Goal</Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default StatsSection; 