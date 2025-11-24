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
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { getSuggestedUnits, calculateNutrition, getEstimatedWeight, UnitConversion } from '../../utils/unitConversions';
import { useTranslation } from '../../hooks/useTranslation';

interface EditFoodModalProps {
  visible: boolean;
  food: ParsedFoodItem | null;
  onConfirm: (updatedFood: ParsedFoodItem) => void;
  onCancel: () => void;
}


const QUICK_QUANTITIES = [
  { label: '0.25', value: 0.25 },
  { label: '0.5', value: 0.5 },
  { label: '0.75', value: 0.75 },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
] as const;

const COOKING_METHODS = [
  { method: 'Grilled', icon: '🔥', description: 'Adds light smoky flavor', arabic: 'مشوي' },
  { method: 'Fried', icon: '🍳', description: 'Pan fried, moderate oil', arabic: 'مقلي' },
  { method: 'Baked', icon: '🥘', description: 'Oven cooked, minimal oil', arabic: 'في الفرن' },
  { method: 'Boiled', icon: '🫕', description: 'Water cooked, no added fat', arabic: 'مسلوق' },
];


// Enhanced cooking method suggestions for Arabic/Egyptian foods
const getSuggestedCookingMethods = (foodName: string): string[] => {
  const name = foodName.toLowerCase();
  
  // Meat-based foods
  if (name.includes('كفتة') || name.includes('لحم') || name.includes('دجاج') || name.includes('فراخ')) {
    return ['Grilled', 'Fried', 'Baked', 'Boiled'];
  }
  
  // Rice and grains
  if (name.includes('رز') || name.includes('كشري') || name.includes('برغل')) {
    return ['Boiled', 'Baked'];
  }
  
  // Bread and pastries
  if (name.includes('عيش') || name.includes('خبز') || name.includes('فطير')) {
    return ['Baked', 'Grilled'];
  }
  
  // Vegetables by default don't need cooking method
  if (name.includes('خضار') || name.includes('سلطة') || name.includes('طماطم') || name.includes('خيار')) {
    return [];
  }
  
  // Soups and stews
  if (name.includes('شوربة') || name.includes('حساء') || name.includes('ملوخية')) {
    return ['Boiled', 'Baked'];
  }
  
  // Fish and seafood
  if (name.includes('سمك') || name.includes('جمبري') || name.includes('كابوريا')) {
    return ['Grilled', 'Fried', 'Baked'];
  }
  
  // Default suggestions
  return ['Grilled', 'Fried', 'Baked', 'Boiled'];
};

const DEFAULT_FOOD: ParsedFoodItem = {
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  confidence: 0,
  needsQuantity: false,
  quantity: 1,
  unit: 'pieces',
};

type EditMode = 'quantity' | 'cooking';

export const EditFoodModal: React.FC<EditFoodModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const { t, activeLanguage, isRTL } = useTranslation();
  const [editMode, setEditMode] = useState<EditMode>('quantity');
  const [quantityInput, setQuantityInput] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('pieces');
  const [selectedCookingMethod, setSelectedCookingMethod] = useState('');

  // RTL text style following Arabic.md pattern
  const rtlTextStyle = isRTL
    ? { writingDirection: 'rtl' as const, textAlign: 'left' as const }
    : { writingDirection: 'ltr' as const, textAlign: 'left' as const };

  // Use food or default to prevent conditional hook calls
  const currentFood = food || DEFAULT_FOOD;
  
  const suggestedUnits = useMemo((): UnitConversion[] => {
    if (!food) return [];
    return getSuggestedUnits(food.name);
  }, [food]);

  const suggestedCookingMethods = useMemo(() => 
    food ? getSuggestedCookingMethods(food.name) : []
  , [food]);

  const filteredCookingMethods = useMemo(() => 
    COOKING_METHODS.filter(cm => 
      suggestedCookingMethods.length === 0 || suggestedCookingMethods.includes(cm.method)
    )
  , [suggestedCookingMethods]);

  // Reset values when modal opens with valid food
  useEffect(() => {
    if (visible && food) {
      const initialQuantity = food.quantity || 1;
      const initialUnit = food.unit || suggestedUnits[0]?.unit || 'grams';
      
      setQuantityInput(String(initialQuantity));
      setSelectedUnit(initialUnit);
      setSelectedCookingMethod(food.cookingMethod || '');
      
      // Set initial edit mode based on what the food needs
      if (food.needsQuantity) {
        setEditMode('quantity');
      } else if (food.needsCookingMethod) {
        setEditMode('cooking');
      } else {
        setEditMode('quantity'); // Default to quantity
      }
    }
  }, [visible, food, suggestedUnits]);

  const quantity = useMemo(() => {
    const parsed = parseFloat(quantityInput);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [quantityInput]);

  // Calculate updated nutrition with new quantity and cooking method
  const updatedNutrition = useMemo(() => {
    if (!food || quantity <= 0) return null;

    // First calculate based on quantity and unit change
    const quantityBasedNutrition = calculateNutrition(
      {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      },
      food.quantity || 1,
      food.unit || 'pieces',
      quantity,
      selectedUnit,
      food.name
    );

    // Then apply cooking method multiplier
    const cookingMultiplier = {
      'Raw': 1.0,
      'Boiled': 1.0,
      'Steamed': 1.0,
      'Grilled': 1.1,
      'Baked': 1.05,
      'Roasted': 1.1,
      'Sautéed': 1.2,
      'Stir-fried': 1.25,
      'Fried': 1.4,
      'Deep Fried': 1.8,
      'Braised': 1.15,
    }[selectedCookingMethod || ''] || 1.0;

    return {
      calories: Math.round(quantityBasedNutrition.calories * cookingMultiplier),
      protein: Math.round((quantityBasedNutrition.protein * cookingMultiplier) * 10) / 10,
      carbs: Math.round((quantityBasedNutrition.carbs * cookingMultiplier) * 10) / 10,
      fat: Math.round((quantityBasedNutrition.fat * cookingMultiplier) * 10) / 10,
    };
  }, [food, quantity, selectedUnit, selectedCookingMethod]);

  // Calculate estimated weight based on quantity and unit
  const estimatedWeight = useMemo(() => {
    if (!food || quantity <= 0) return '0g';
    
    // Get the unit conversion for the selected unit
    const suggestedUnit = suggestedUnits.find(u => u.unit === selectedUnit);
    if (suggestedUnit) {
      const weightInGrams = Math.round(quantity * suggestedUnit.gramsPerUnit);
      if (weightInGrams >= 1000) {
        return `${(weightInGrams / 1000).toFixed(1)}kg`;
      }
      return `${weightInGrams}g`;
    }
    
    return getEstimatedWeight(quantity, selectedUnit, food.name);
  }, [food, quantity, selectedUnit, suggestedUnits]);

  const handleConfirm = useCallback(() => {
    if (quantity > 0 && updatedNutrition && food) {

      const updatedFood: ParsedFoodItem = {
        ...food,
        quantity,
        unit: selectedUnit,
        cookingMethod: selectedCookingMethod,
        calories: updatedNutrition.calories,
        protein: updatedNutrition.protein,
        carbs: updatedNutrition.carbs,
        fat: updatedNutrition.fat,
        needsQuantity: false,
        needsCookingMethod: false,
      };

      onConfirm(updatedFood);
    }
  }, [quantity, selectedUnit, selectedCookingMethod, updatedNutrition, food, onConfirm]);

  const handleQuickQuantitySelect = useCallback((value: number) => {
    setQuantityInput(String(value));
  }, []);

  const handleUnitSelect = useCallback((unit: string) => {
    setSelectedUnit(unit);
  }, []);

  const handleCookingMethodSelect = useCallback((method: string) => {
    setSelectedCookingMethod(method);
  }, []);

  // Don't render modal content if no food is provided
  if (!food) {
    return null;
  }

  const isValidQuantity = quantity > 0;
  const needsCookingMethod = suggestedCookingMethods.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modal}>
            {/* Header with close button */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, rtlTextStyle]}>Edit Food Item</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Tab Headers */}
            <View style={[styles.tabContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.tab, editMode === 'quantity' && styles.tabActive]}
                onPress={() => setEditMode('quantity')}
              >
                <MaterialIcons
                  name="bar-chart"
                  size={20}
                  color={editMode === 'quantity' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.tabText, editMode === 'quantity' && styles.tabTextActive, rtlTextStyle]}>
                  Quantity
                </Text>
              </TouchableOpacity>

              {needsCookingMethod && (
                <TouchableOpacity
                  style={[styles.tab, editMode === 'cooking' && styles.tabActive]}
                  onPress={() => setEditMode('cooking')}
                >
                  <MaterialIcons
                    name="restaurant"
                    size={20}
                    color={editMode === 'cooking' ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.tabText, editMode === 'cooking' && styles.tabTextActive, rtlTextStyle]}>
                    Cooking
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

              {/* Food Name and Weight Focus */}
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, rtlTextStyle]}>{food.name}</Text>
                <Text style={[styles.estimatedWeight, rtlTextStyle]}>{estimatedWeight}</Text>
                {updatedNutrition && (
                  <Text style={[styles.nutritionSummary, rtlTextStyle]}>
                    {updatedNutrition.calories} cal, {updatedNutrition.protein}g protein, {updatedNutrition.carbs}g carbs, {updatedNutrition.fat}g fat
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              {editMode === 'quantity' ? (
                <>
                  {/* Quick Select */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, rtlTextStyle]}>Quick Select</Text>
                    <View style={styles.quickQuantitiesGrid}>
                      {QUICK_QUANTITIES.slice(0, 4).map((preset) => {
                        const isSelected = quantityInput === String(preset.value);
                        return (
                          <TouchableOpacity
                            key={preset.value}
                            style={[
                              styles.quantityButton,
                              isSelected && styles.quantityButtonActive
                            ]}
                            onPress={() => handleQuickQuantitySelect(preset.value)}
                          >
                            <Text style={[
                              styles.quantityButtonText,
                              isSelected && styles.quantityButtonTextActive
                            ]}>
                              {preset.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.quickQuantitiesGrid}>
                      {QUICK_QUANTITIES.slice(4).map((preset) => {
                        const isSelected = quantityInput === String(preset.value);
                        return (
                          <TouchableOpacity
                            key={preset.value}
                            style={[
                              styles.quantityButton,
                              isSelected && styles.quantityButtonActive
                            ]}
                            onPress={() => handleQuickQuantitySelect(preset.value)}
                          >
                            <Text style={[
                              styles.quantityButtonText,
                              isSelected && styles.quantityButtonTextActive
                            ]}>
                              {preset.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Custom Amount */}
                  <View style={styles.section}>
                    <Text style={[styles.inputLabel, rtlTextStyle]}>Custom Amount</Text>
                    <TextInput
                      style={[styles.quantityInput, rtlTextStyle]}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      placeholder="Enter amount"
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                    />
                  </View>

                  {/* Unit selection */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, rtlTextStyle]}>Unit</Text>
                    <View style={styles.unitGrid}>
                      {suggestedUnits.map((unitOption) => {
                        const isSelected = selectedUnit === unitOption.unit;
                        return (
                          <TouchableOpacity
                            key={unitOption.unit}
                            style={[
                              styles.unitButton,
                              isSelected && styles.unitButtonActive,
                              unitOption.isRecommended && styles.unitButtonRecommended,
                            ]}
                            onPress={() => handleUnitSelect(unitOption.unit)}
                          >
                            {unitOption.isRecommended && (
                              <MaterialIcons
                                name="star"
                                size={12}
                                color={colors.primary}
                                style={styles.unitStar}
                              />
                            )}
                            <Text style={[
                              styles.unitButtonText,
                              isSelected && styles.unitButtonTextActive,
                              rtlTextStyle
                            ]}>
                              {unitOption.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Cooking Methods Grid */}
                  <View style={styles.section}>
                    <View style={[styles.methodsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      {filteredCookingMethods.slice(0, 3).map((item) => {
                        const displayName = activeLanguage === 'ar' ? item.arabic : item.method;
                        return (
                          <TouchableOpacity
                            key={item.method}
                            style={[
                              styles.methodButton,
                              selectedCookingMethod === item.method && styles.methodButtonActive,
                              { flexDirection: isRTL ? 'row-reverse' : 'row' }
                            ]}
                            onPress={() => handleCookingMethodSelect(item.method)}
                          >
                            <Text style={[
                              styles.methodIcon,
                              { marginRight: isRTL ? 0 : spacing.sm, marginLeft: isRTL ? spacing.sm : 0 }
                            ]}>{item.icon}</Text>
                            <View style={styles.methodTextContainer}>
                              <Text style={[
                                styles.methodText,
                                selectedCookingMethod === item.method && styles.methodTextActive,
                                rtlTextStyle
                              ]}>
                                {displayName}
                              </Text>
                            <Text style={styles.methodArabic}>
                              {item.arabic}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Fourth method centered */}
                    {filteredCookingMethods.length >= 4 && (
                      <View style={styles.centerMethod}>
                        {(() => {
                          const item = filteredCookingMethods[3];
                          const displayName = activeLanguage === 'ar' ? item.arabic : item.method;
                          return (
                            <TouchableOpacity
                              style={[
                                styles.methodButton,
                                selectedCookingMethod === item.method && styles.methodButtonActive,
                                { flexDirection: isRTL ? 'row-reverse' : 'row' }
                              ]}
                              onPress={() => handleCookingMethodSelect(item.method)}
                            >
                              <Text style={[
                                styles.methodIcon,
                                { marginRight: isRTL ? 0 : spacing.sm, marginLeft: isRTL ? spacing.sm : 0 }
                              ]}>{item.icon}</Text>
                              <View style={styles.methodTextContainer}>
                                <Text style={[
                                  styles.methodText,
                                  selectedCookingMethod === item.method && styles.methodTextActive,
                                  rtlTextStyle
                                ]}>
                                  {displayName}
                                </Text>
                            <Text style={styles.methodArabic}>
                              {item.arabic}
                            </Text>
                          </View>
                        </TouchableOpacity>
                          );
                        })()}
                      </View>
                    )}
                  </View>


                  {/* Nutrition impact preview */}
                  {selectedCookingMethod && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, rtlTextStyle]}>Calorie Impact</Text>
                      <View style={styles.impactPreview}>
                        {(() => {
                          const multiplier = {
                            'Raw': 1.0,
                            'Boiled': 1.0,
                            'Steamed': 1.0,
                            'Grilled': 1.1,
                            'Baked': 1.05,
                            'Roasted': 1.1,
                            'Sautéed': 1.2,
                            'Stir-fried': 1.25,
                            'Fried': 1.4,
                            'Deep Fried': 1.8,
                            'Braised': 1.15,
                          }[selectedCookingMethod] || 1.0;

                          const change = Math.round((multiplier - 1) * 100);
                          const baseCalories = Math.round(food.calories * (quantity / (food.quantity || 1)));
                          const newCalories = Math.round(baseCalories * multiplier);

                          return (
                            <View style={styles.impactContent}>
                              <Text style={[styles.impactText, rtlTextStyle]}>
                                {change === 0
                                  ? 'No change to calories'
                                  : `${change > 0 ? '+' : ''}${change}% calories`
                                }
                              </Text>
                              <Text style={[styles.impactCalories, rtlTextStyle]}>
                                {baseCalories} → {newCalories} cal
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Updated Nutrition Preview */}
              {updatedNutrition && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, rtlTextStyle]}>Updated Nutrition</Text>
                  <View style={styles.nutritionPreview}>
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, rtlTextStyle]}>
                        {updatedNutrition.calories}
                      </Text>
                      <Text style={[styles.nutritionLabel, rtlTextStyle]}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, rtlTextStyle]}>
                        {updatedNutrition.protein}g
                      </Text>
                      <Text style={[styles.nutritionLabel, rtlTextStyle]}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, rtlTextStyle]}>
                        {updatedNutrition.carbs}g
                      </Text>
                      <Text style={[styles.nutritionLabel, rtlTextStyle]}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, rtlTextStyle]}>
                        {updatedNutrition.fat}g
                      </Text>
                      <Text style={[styles.nutritionLabel, rtlTextStyle]}>fat</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
                disabled={!isValidQuantity}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    width: '100%',
  },
  headerSpacer: {
    width: 48, // Same width as close button
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: '500',
    width: '100%',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  foodInfo: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  foodName: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  estimatedWeight: {
    fontSize: fonts['3xl'],
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
    width: '100%',
  },
  nutritionSummary: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing.lg,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    width: '100%',
  },
  quickQuantitiesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quantityButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  quantityButtonText: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  quantityButtonTextActive: {
    color: colors.white,
  },
  inputLabel: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    width: '100%',
  },
  quantityInput: {
    height: 48,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fonts.base,
    textAlign: 'center',
    fontWeight: '600',
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
  methodsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  centerMethod: {
    alignItems: 'center',
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  methodIcon: {
    fontSize: 20,
    // marginRight/Left set inline for RTL support
  },
  methodTextContainer: {
    flex: 1,
  },
  methodText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
    width: '100%',
  },
  methodTextActive: {
    color: colors.primary,
  },
  methodArabic: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  customMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
    minHeight: 48,
  },
  customMethodButtonActive: {
    backgroundColor: colors.primary,
    borderStyle: 'solid',
  },
  customMethodText: {
    fontSize: fonts.base,
    color: colors.primary,
    fontWeight: '600',
  },
  customMethodTextActive: {
    color: colors.white,
  },
  customInput: {
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    backgroundColor: colors.white,
  },
  impactPreview: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
  },
  impactContent: {
    alignItems: 'center',
  },
  impactText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    width: '100%',
  },
  impactCalories: {
    fontSize: fonts.xl,
    color: colors.primary,
    fontWeight: 'bold',
    width: '100%',
  },
  nutritionPreview: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    width: '100%',
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  footerButton: {
    flex: 1,
  },
});