import React, { useState, useEffect, useMemo } from 'react';
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
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { nutritionService } from '../../services/nutrition';

interface QuantityModalProps {
  visible: boolean;
  food: ParsedFoodItem | null;
  onConfirm: (quantity: number, unit: string) => void;
  onCancel: () => void;
}

const QUICK_QUANTITIES = [
  { label: '1/2', value: '0.5' },
  { label: '1', value: '1' },
  { label: '1.5', value: '1.5' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '5', value: '5' },
];

export const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('pieces');

  const suggestedUnits = useMemo(() => 
    food ? nutritionService.getSuggestedUnits(food.name) : []
  , [food]);

  // Reset values when modal opens
  useEffect(() => {
    if (visible && food) {
      setQuantityInput(String(food.quantity || 1));
      setSelectedUnit(food.unit || 'pieces');
    }
  }, [visible, food]);

  if (!food) return null;

  const quantity = parseFloat(quantityInput) || 0;

  // Calculate preview nutrition with new quantity
  const previewNutrition = useMemo(() => {
    if (!food || quantity <= 0) return null;

    return nutritionService.calculateNutrition({
      foodName: food.name,
      baseNutrition: {
        calories: food.calories / (food.quantity || 1), // Get per-unit values
        protein: food.protein / (food.quantity || 1),
        carbs: food.carbs / (food.quantity || 1),
        fat: food.fat / (food.quantity || 1),
      },
      quantity,
      unit: selectedUnit,
      cookingMethod: food.cookingMethod,
    });
  }, [food, quantity, selectedUnit]);

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity, selectedUnit);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>Set Quantity</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  For {food.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Quick quantity selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Select</Text>
                <View style={styles.quickQuantities}>
                  {QUICK_QUANTITIES.map((preset) => (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.quantityButton,
                        quantityInput === preset.value && styles.quantityButtonActive
                      ]}
                      onPress={() => setQuantityInput(preset.value)}
                    >
                      <Text style={[
                        styles.quantityButtonText,
                        quantityInput === preset.value && styles.quantityButtonTextActive
                      ]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom quantity input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Custom Amount</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    placeholder="Enter amount"
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <View style={styles.unitSelector}>
                    <Text style={styles.unitText}>{selectedUnit}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.textSecondary} />
                  </View>
                </View>
              </View>

              {/* Unit selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Unit</Text>
                <View style={styles.unitGrid}>
                  {suggestedUnits.map((unit) => (
                    <TouchableOpacity
                      key={unit.value}
                      style={[
                        styles.unitButton,
                        selectedUnit === unit.value && styles.unitButtonActive,
                        unit.isRecommended && styles.unitButtonRecommended,
                      ]}
                      onPress={() => setSelectedUnit(unit.value)}
                    >
                      {unit.isRecommended && (
                        <MaterialIcons name="star" size={12} color={colors.primary} style={styles.unitStar} />
                      )}
                      <Text style={[
                        styles.unitButtonText,
                        selectedUnit === unit.value && styles.unitButtonTextActive
                      ]}>
                        {unit.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Nutrition preview */}
              {previewNutrition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Updated Nutrition</Text>
                  <View style={styles.nutritionPreview}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {Math.round(previewNutrition.calories)}
                      </Text>
                      <Text style={styles.nutritionLabel}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {Math.round(previewNutrition.protein * 10) / 10}g
                      </Text>
                      <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {Math.round(previewNutrition.carbs * 10) / 10}g
                      </Text>
                      <Text style={styles.nutritionLabel}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>
                        {Math.round(previewNutrition.fat * 10) / 10}g
                      </Text>
                      <Text style={styles.nutritionLabel}>fat</Text>
                    </View>
                  </View>

                  {/* Confidence warning */}
                  {previewNutrition.confidence < 0.7 && (
                    <View style={styles.warningContainer}>
                      <MaterialIcons name="warning" size={16} color={colors.warning} />
                      <Text style={styles.warningText}>
                        Nutrition estimates may be less accurate for this unit type
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="secondary"
                style={styles.footerButton}
              />
              <Button
                title="Update"
                onPress={handleConfirm}
                variant="primary"
                style={styles.footerButton}
                disabled={quantity <= 0}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  quickQuantities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quantityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    minWidth: 60,
    alignItems: 'center',
  },
  quantityButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  quantityButtonText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  quantityButtonTextActive: {
    color: colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    backgroundColor: colors.white,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    backgroundColor: colors.gray50,
  },
  unitText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  unitButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  unitButtonRecommended: {
    borderColor: colors.success,
  },
  unitButtonText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  unitStar: {
    marginRight: spacing.xs,
  },
  nutritionPreview: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.yellow50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.yellow200,
  },
  warningText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.warning,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  footerButton: {
    flex: 1,
  },
});