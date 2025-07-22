import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { CircularProgress } from '../../components/ui/Progress/CircularProgress';
import { MacroProgress } from '../../components/ui/Progress/MacroProgress';
import { MealsList } from '../../components/ui/MealsList';
import { useNutrition } from '../../hooks/useNutrition';
import { useUser } from '../../hooks/useUser';

const HomeScreen: React.FC = () => {
  const { nutrition, progress, macroGoals, macroProgress, todayLog } = useNutrition();
  const { profile } = useUser();

  const todayItems = todayLog?.foods || [];

  const getMealIcon = (index: number): string => {
    switch (index) {
      case 0: return '🥞';
      case 1: return '🥗';
      case 2: return '🍖';
      default: return '🍽️';
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
                Hello, {profile?.name || 'User'}! 👋
              </Text>
              <Text style={styles.headerSubtitle}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Daily Progress */}
            <Card style={styles.progressCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="trending-up" size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Daily Progress 🎯</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.calorieDisplay}>
                  <Text style={styles.calorieNumber}>{Math.round(nutrition.calories)}</Text>
                  <Text style={styles.calorieLabel}>
                    of {progress.dailyGoal} calories
                  </Text>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress.calorieProgress}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    <MaterialIcons name="fitness-center" size={16} color={colors.textSecondary} />
                    {' '}{progress.isOverGoal 
                      ? `${Math.round(Math.abs(progress.remainingCalories))} calories over goal`
                      : `${Math.round(progress.remainingCalories)} calories remaining`
                    }
                  </Text>
                </View>
              </View>
            </Card>

            {/* Macronutrients */}
            <Card style={styles.macroCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="fitness-center" size={24} color={colors.secondary} />
                <Text style={styles.cardTitle}>Macronutrients 🥗</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(nutrition.protein)}g</Text>
                    <Text style={styles.macroLabel}>💪 Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(nutrition.carbs)}g</Text>
                    <Text style={styles.macroLabel}>🍞 Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(nutrition.fat)}g</Text>
                    <Text style={styles.macroLabel}>🥑 Fats</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Today's Meals */}
            <Card style={styles.mealsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="restaurant" size={24} color={colors.accent} />
                <Text style={styles.cardTitle}>Today's Meals 🍽️</Text>
              </View>
              <View style={styles.cardContent}>
                <MealsList
                  foods={todayItems}
                  onRemoveFood={(foodId) => {
                    // TODO: Implement remove food functionality
                    console.log('Remove food:', foodId);
                  }}
                  onUpdateQuantity={(foodId, quantity) => {
                    // TODO: Implement update quantity functionality
                    console.log('Update quantity:', foodId, quantity);
                  }}
                />
              </View>
            </Card>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="mic" size={24} color={colors.white} />
                <Text style={styles.actionText}>Voice Log</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="add" size={24} color={colors.white} />
                <Text style={styles.actionText}>Manual Add</Text>
              </TouchableOpacity>
            </View>
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
  progressCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  macroCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealsCard: {
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
  cardContent: {
    padding: spacing.lg,
  },
  calorieDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calorieNumber: {
    fontSize: fonts['4xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  calorieLabel: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  progressContainer: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  progressText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  macroValue: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  macroLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyMeals: {
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
    fontWeight: '500',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mealsList: {
    gap: spacing.sm,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mealQuantity: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  mealNutrition: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mealTime: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.white,
    marginLeft: spacing.sm,
  },
});

export default HomeScreen; 