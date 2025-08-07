/**
 * Reusable DailyView Component
 * 
 * This component displays the complete daily view including:
 * - Calories consumed widget (purple gradient)
 * - Macronutrients breakdown
 * - Complete food items list with actions
 * 
 * Used in both Home screen and History screen for consistency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing } from '../../constants/theme';
import { FoodItem } from './FoodItem';
import { DailyLog } from '../../types';
import { useFoodData } from '../../hooks/useFoodData';
import { toDisplayFood } from '../../types/display';

interface DailyViewProps {
  dailyLog?: DailyLog;
  date: string;
  title?: string;
  showDateHeader?: boolean;
  onRemoveFood?: (date: string, foodId: string) => void;
  onEditFood?: (date: string, foodId: string, quantity: number) => void;
}

/**
 * Get food emoji based on index (for fallback)
 */
const getMealIcon = (index: number): string => {
  switch (index) {
    case 0: return '🥞';
    case 1: return '🥗';
    case 2: return '🍖';
    default: return '🍽️';
  }
};

export const DailyView: React.FC<DailyViewProps> = ({
  dailyLog,
  date,
  title = "Calories Consumed",
  showDateHeader = false,
  onRemoveFood,
  onEditFood,
}) => {
  const { removeFood } = useFoodData();
  
  // Calculate values
  const consumed = dailyLog?.totalNutrition.calories || 0;
  const goal = dailyLog?.calorieGoal || 2000;
  const progress = Math.min(consumed / goal, 1);
  const remaining = Math.max(0, goal - consumed);
  const foods = dailyLog?.foods || [];
  const displayFoods = foods.map(toDisplayFood);
  
  // Progress circle calculations
  const strokeDasharray = 402;
  const strokeDashoffset = strokeDasharray - (progress * strokeDasharray);
  
  const handleRemoveFood = (foodId: string) => {
    const food = foods.find(f => f.id === foodId);
    if (!food) return;
    
    Alert.alert(
      'Remove Food',
      `Remove ${food.foodItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => {
            if (onRemoveFood) {
              onRemoveFood(date, foodId);
            } else {
              removeFood(date, foodId);
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Header (optional) */}
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <MaterialIcons name="today" size={24} color={colors.primary} />
          <Text style={styles.dateTitle} numberOfLines={2}>
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* Calories Widget */}
      <LinearGradient
        colors={['#C084FC', '#A855F7', '#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.caloriesCard}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.caloriesTitle}>{title}</Text>
        </View>
        
        {/* Wheel Section */}
        <View style={styles.wheelSection}>
          <View style={styles.circularProgressContainer}>
            <Svg width={144} height={144} style={styles.svgProgress}>
              <Circle
                cx={72}
                cy={72}
                r={64}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={12}
                fill="none"
              />
              <Circle
                cx={72}
                cy={72}
                r={64}
                stroke="white"
                strokeWidth={12}
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 72 72)"
              />
            </Svg>
            <View style={styles.progressCenter}>
              <Text style={styles.caloriesNumber}>{Math.round(consumed)}</Text>
              <Text style={styles.caloriesUnit}>kcal</Text>
            </View>
          </View>
        </View>
        
        {/* Footer Section */}
        <View style={styles.footerSection}>
          <Text style={styles.remainingCalories}>
            Remaining: <Text style={styles.remainingNumber}>{Math.round(remaining)} kcal</Text>
          </Text>
        </View>
      </LinearGradient>

      {/* Macronutrients */}
      <View style={styles.macroSection}>
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <View style={styles.macroGrid}>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel} numberOfLines={1}>Protein</Text>
            <Text style={styles.macroValue} numberOfLines={1}>{Math.round(dailyLog?.totalNutrition.protein || 0)}g</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel} numberOfLines={1}>Carbs</Text>
            <Text style={styles.macroValue} numberOfLines={1}>{Math.round(dailyLog?.totalNutrition.carbs || 0)}g</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel} numberOfLines={1}>Fats</Text>
            <Text style={styles.macroValue} numberOfLines={1}>{Math.round(dailyLog?.totalNutrition.fat || 0)}g</Text>
          </View>
        </View>
      </View>

      {/* Food Items List */}
      <View style={styles.foodSection}>
        <Text style={styles.sectionTitle} numberOfLines={2}>
          {showDateHeader ? 'Food Items' : "Today's Meals"}
        </Text>
        
        {displayFoods.length > 0 ? (
          <View style={styles.foodList}>
            {displayFoods.map((food) => (
              <FoodItem
                key={food.id}
                food={food}
                onDelete={handleRemoveFood}
                showMacros={true}
                showTime={true}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText} numberOfLines={2}>
              {showDateHeader ? 'No food logged on this date' : 'No meals logged today'}
            </Text>
            <Text style={styles.emptySubtext} numberOfLines={2}>
              {!showDateHeader && 'Use the Record button to log your first meal!'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  dateTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  caloriesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerSection: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  caloriesTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  wheelSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgProgress: {
    position: 'absolute',
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  caloriesNumber: {
    fontSize: fonts['4xl'],
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: fonts['4xl'] * 1.1,
  },
  caloriesUnit: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: -4,
  },
  footerSection: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  remainingCalories: {
    fontSize: fonts.sm,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  remainingNumber: {
    fontWeight: '700',
    color: colors.white,
    opacity: 1,
  },
  macroSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  foodSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  foodList: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    opacity: 0.8,
  },
});