import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItemWithConfidence } from '../../types/aiTypes';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';

interface FoodDetailsModalProps {
  visible: boolean;
  food: ParsedFoodItemWithConfidence | null;
  onConfirm: (updatedFood: ParsedFoodItemWithConfidence) => void;
  onCancel: () => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const [grams, setGrams] = useState('100');
  const [selectedCookingMethod, setSelectedCookingMethod] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (visible && food) {
      setGrams(String(food.gramEquivalent || 100));
      setSelectedCookingMethod(food.cookingMethod || '');
    }
  }, [visible, food]);

  // Calculate live nutrition
  const liveNutrition = useMemo(() => {
    if (!food) return null;

    const gramsNum = parseFloat(grams) || 100;
    const multiplier = gramsNum / (food.gramEquivalent || 100);

    return {
      calories: Math.round((food.calories || 0) * multiplier),
      protein: Math.round((food.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((food.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((food.fat || 0) * multiplier * 10) / 10,
    };
  }, [food, grams]);

  const handleConfirm = useCallback(() => {
    if (!food || !liveNutrition) return;

    const gramsNum = parseFloat(grams) || 100;

    const updatedFood: ParsedFoodItemWithConfidence = {
      ...food,
      // Update quantity fields - all should reflect the same value
      gramEquivalent: gramsNum,
      quantity: gramsNum,
      unit: 'grams',
      // Update nutrition values
      calories: liveNutrition.calories,
      protein: liveNutrition.protein,
      carbs: liveNutrition.carbs,
      fat: liveNutrition.fat,
      cookingMethod: selectedCookingMethod || food.cookingMethod,
      needsQuantityModal: false,
      needsCookingModal: false,
      userModified: true,
    };

    onConfirm(updatedFood);
  }, [food, grams, selectedCookingMethod, liveNutrition, onConfirm]);

  if (!food) return null;

  const showCookingMethods = food.alternativeMethods && food.alternativeMethods.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Adjust Food Details</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Food Name */}
            <View style={styles.foodHeader}>
              <Text style={styles.foodName}>{food.name}</Text>
            </View>

            {/* Grams Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount (grams)</Text>
              <TextInput
                style={styles.gramsInput}
                value={grams}
                onChangeText={setGrams}
                placeholder="100"
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Cooking Method - Only if available */}
            {showCookingMethods && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cooking Method</Text>
                {food.alternativeMethods.map((method) => {
                  const isSelected = selectedCookingMethod === method.method;
                  return (
                    <TouchableOpacity
                      key={method.method}
                      style={[
                        styles.cookingButton,
                        isSelected && styles.cookingButtonActive
                      ]}
                      onPress={() => setSelectedCookingMethod(method.method)}
                    >
                      <Text style={styles.cookingIcon}>{method.icon}</Text>
                      <View style={styles.cookingContent}>
                        <Text style={[
                          styles.cookingText,
                          isSelected && styles.cookingTextActive
                        ]}>
                          {method.method}
                        </Text>
                        <Text style={[
                          styles.cookingArabic,
                          isSelected && styles.cookingArabicActive
                        ]}>
                          {method.arabic_name}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Live Nutrition Preview */}
            {liveNutrition && (
              <View style={styles.nutritionPreview}>
                <Text style={styles.previewTitle}>Nutrition</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{liveNutrition.calories}</Text>
                    <Text style={styles.nutritionLabel}>cal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{liveNutrition.protein}g</Text>
                    <Text style={styles.nutritionLabel}>protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{liveNutrition.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{liveNutrition.fat}g</Text>
                    <Text style={styles.nutritionLabel}>fat</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Save"
              onPress={handleConfirm}
              variant="primary"
              style={[styles.button, styles.saveButton]}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  spacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  foodHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.gray50,
  },
  foodName: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  gramsInput: {
    height: 56,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    fontSize: fonts['2xl'],
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: colors.white,
    color: colors.primary,
  },
  cookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  cookingButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  cookingIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  cookingContent: {
    flex: 1,
  },
  cookingText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cookingTextActive: {
    color: colors.primary,
  },
  cookingArabic: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  cookingArabicActive: {
    color: colors.primary,
  },
  nutritionPreview: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary + '10',
  },
  previewTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  button: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
