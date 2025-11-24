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
import { useTranslation } from '../../hooks/useTranslation';
import { getCurrentLanguage } from '../../localization';

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
  const { t, isRTL } = useTranslation();
  const activeLanguage = getCurrentLanguage();
  const [grams, setGrams] = useState('100');
  const [selectedCookingMethod, setSelectedCookingMethod] = useState('');

  // RTL text style following Arabic.md pattern - ALWAYS use textAlign: 'left'
  const rtlTextStyle = isRTL
    ? { writingDirection: 'rtl' as const, textAlign: 'left' as const }
    : { writingDirection: 'ltr' as const, textAlign: 'left' as const };
  const rtlRowStyle = isRTL ? { flexDirection: 'row-reverse' as const } : {};

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
      presentationStyle="formSheet"
      onRequestClose={onCancel}
      transparent={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Drag Indicator */}
        <View style={styles.dragIndicatorContainer}>
          <View style={styles.dragIndicator} />
        </View>

        {/* Header */}
        <View style={[styles.header, rtlRowStyle]}>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, rtlTextStyle]}>{t('foodModals.adjustDetails')}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            {/* Food Name */}
            <View style={styles.foodHeader}>
              <Text style={[styles.foodName, rtlTextStyle]}>{food.name}</Text>
            </View>

            {/* Grams Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, rtlTextStyle]}>{t('foodModals.amount')}</Text>
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
                <Text style={[styles.sectionTitle, rtlTextStyle]}>{t('foodModals.cookingMethod')}</Text>
                {food.alternativeMethods.map((method) => {
                  const isSelected = selectedCookingMethod === method.method;
                  const displayName = activeLanguage === 'ar' ? (method.arabic_name || method.method) : method.method;
                  return (
                    <TouchableOpacity
                      key={method.method}
                      style={[
                        styles.cookingButton,
                        isSelected && styles.cookingButtonActive,
                        rtlRowStyle
                      ]}
                      onPress={() => setSelectedCookingMethod(method.method)}
                    >
                      <Text style={styles.cookingIcon}>{method.icon}</Text>
                      <View style={styles.cookingContent}>
                        <Text style={[
                          styles.cookingText,
                          isSelected && styles.cookingTextActive,
                          rtlTextStyle
                        ]}>
                          {displayName}
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
                <Text style={[styles.previewTitle, rtlTextStyle]}>{t('foodModals.nutrition')}</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, rtlTextStyle]}>{liveNutrition.calories}</Text>
                    <Text style={[styles.nutritionLabel, rtlTextStyle]}>{t('foodModals.cal')}</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, rtlTextStyle]}>{liveNutrition.protein}g</Text>
                    <Text style={[styles.nutritionLabel, rtlTextStyle]}>{t('foodModals.protein')}</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, rtlTextStyle]}>{liveNutrition.carbs}g</Text>
                    <Text style={[styles.nutritionLabel, rtlTextStyle]}>{t('foodModals.carbs')}</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={[styles.nutritionValue, rtlTextStyle]}>{liveNutrition.fat}g</Text>
                    <Text style={[styles.nutritionLabel, rtlTextStyle]}>{t('foodModals.fat')}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Footer Buttons */}
            <View style={[styles.footer, rtlRowStyle]}>
              <Button
                title={t('common.cancel')}
                onPress={onCancel}
                variant="outline"
                style={styles.button}
              />
              <Button
                title={t('common.save')}
                onPress={handleConfirm}
                variant="primary"
                style={[styles.button, styles.saveButton]}
              />
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    width: '100%',
  },
  spacer: {
    width: 22,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  foodHeader: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
  },
  foodName: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  gramsInput: {
    height: 56,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fonts['2xl'],
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#F0F9FF',
    color: colors.primary,
  },
  cookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
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
    marginLeft: spacing.md,
  },
  cookingContent: {
    flex: 1,
  },
  cookingText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    width: '100%',
  },
  cookingTextActive: {
    color: colors.primary,
  },
  nutritionPreview: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  previewTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    width: '100%',
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    width: '100%',
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  button: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
