import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../../types';
import { colors, spacing, fonts } from '../../../constants/theme';
import { Card } from '../Card';
import { Button } from '../Button';
import { styles } from './FoodReview.styles';
import { FoodReviewProps } from './FoodReview.types';

export const FoodReview: React.FC<FoodReviewProps> = ({
  foods,
  onUpdateFood,
  onRemoveFood,
  onAddFood,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ParsedFoodItem>>({});
  const [quantityDialogIndex, setQuantityDialogIndex] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('pieces');
  const [cookingMethodDialogIndex, setCookingMethodDialogIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalIndex, setEditModalIndex] = useState<number | null>(null);

  // Simplified units for better UX
  const commonUnits = [
    { value: 'pieces', label: 'Pieces', arabic: 'قطع' },
    { value: 'grams', label: 'Grams', arabic: 'جرام' },
    { value: 'cups', label: 'Cups', arabic: 'كوب' },
    { value: 'servings', label: 'Servings', arabic: 'حصة' },
  ];

  // Simple quantity presets
  const quantityPresets = [
    { value: '0.5', label: '½' },
    { value: '1', label: '1' },
    { value: '1.5', label: '1½' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ];

  // Check if any foods need clarification
  const foodsNeedingQuantity = foods.filter(food => food.needsQuantity);
  const foodsNeedingCookingMethod = foods.filter(food => food.needsCookingMethod);
  const hasUnspecifiedQuantities = foodsNeedingQuantity.length > 0;
  const hasUnspecifiedCookingMethods = foodsNeedingCookingMethod.length > 0;
  const hasAnyUnspecified = hasUnspecifiedQuantities || hasUnspecifiedCookingMethods;

  const handleEditStart = (index: number) => {
    setEditModalIndex(index);
    setEditForm({ ...foods[index] });
    setEditModalVisible(true);
  };

  const handleEditSave = () => {
    if (editModalIndex !== null && editForm) {
      const updatedFood: ParsedFoodItem = {
        name: editForm.name || foods[editModalIndex].name,
        calories: editForm.calories || foods[editModalIndex].calories,
        protein: editForm.protein || foods[editModalIndex].protein,
        carbs: editForm.carbs || foods[editModalIndex].carbs,
        fat: editForm.fat || foods[editModalIndex].fat,
        confidence: editForm.confidence || foods[editModalIndex].confidence,
        quantity: editForm.quantity || foods[editModalIndex].quantity,
        unit: editForm.unit || foods[editModalIndex].unit,
        cookingMethod: editForm.cookingMethod,
      };
      onUpdateFood(editModalIndex, updatedFood);
      setEditModalVisible(false);
      setEditModalIndex(null);
      setEditForm({});
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditModalIndex(null);
    setEditForm({});
  };

  const handleRemove = (index: number) => {
    Alert.alert(
      'Remove Food',
      'Are you sure you want to remove this food item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveFood(index) },
      ]
    );
  };

  const handleQuantitySpecification = (index: number) => {
    setQuantityDialogIndex(index);
    setQuantityInput(String(foods[index].quantity || ''));
    setSelectedUnit(foods[index].unit || 'pieces');
  };

  const handleCookingMethodSpecification = (index: number) => {
    setCookingMethodDialogIndex(index);
  };

  const handleCookingMethodSelect = (method: string) => {
    if (cookingMethodDialogIndex !== null) {
      const updatedFood: ParsedFoodItem = {
        ...foods[cookingMethodDialogIndex],
        cookingMethod: method,
        needsCookingMethod: false,
      };
      onUpdateFood(cookingMethodDialogIndex, updatedFood);
      setCookingMethodDialogIndex(null);
    }
  };

  const handleQuantitySubmit = () => {
    if (quantityDialogIndex !== null) {
      const quantity = parseFloat(quantityInput) || 0;
      const updatedFood: ParsedFoodItem = {
        ...foods[quantityDialogIndex],
        quantity,
        unit: selectedUnit,
        needsQuantity: false,
      };

      // Adjust nutrition values based on quantity and unit
      if (selectedUnit === 'grams') {
        const gramsPerServing = 100;
        const multiplier = quantity / gramsPerServing;
        updatedFood.calories = Math.round(foods[quantityDialogIndex].calories * multiplier);
        updatedFood.protein = Math.round(foods[quantityDialogIndex].protein * multiplier * 10) / 10;
        updatedFood.carbs = Math.round(foods[quantityDialogIndex].carbs * multiplier * 10) / 10;
        updatedFood.fat = Math.round(foods[quantityDialogIndex].fat * multiplier * 10) / 10;
      } else {
        updatedFood.calories = Math.round(foods[quantityDialogIndex].calories * quantity);
        updatedFood.protein = Math.round(foods[quantityDialogIndex].protein * quantity * 10) / 10;
        updatedFood.carbs = Math.round(foods[quantityDialogIndex].carbs * quantity * 10) / 10;
        updatedFood.fat = Math.round(foods[quantityDialogIndex].fat * quantity * 10) / 10;
      }

      onUpdateFood(quantityDialogIndex, updatedFood);
      setQuantityDialogIndex(null);
      setQuantityInput('');
      setSelectedUnit('pieces');
    }
  };

  const renderFoodItem = (food: ParsedFoodItem, index: number) => {
    const confidenceColor = food.confidence >= 0.8 ? colors.success : 
                           food.confidence >= 0.6 ? colors.warning : colors.error;
    
    const confidenceText = food.confidence >= 0.8 ? 'High' : 
                          food.confidence >= 0.6 ? 'Medium' : 'Low';

    return (
      <Card key={index} style={styles.foodCard}>
        <View style={styles.foodHeader}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={2}>
              {food.name}
            </Text>
            <Text style={styles.foodQuantity}>
              {food.quantity ? `${food.quantity} ${food.unit || 'pieces'}` : 'Quantity not specified'}
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
                {confidenceText}
              </Text>
            </Text>
          </View>
          
          <View style={styles.foodActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditStart(index)}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => handleRemove(index)}
            >
              <MaterialIcons name="delete" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nutritionBadges}>
          <View style={[styles.badge, { backgroundColor: colors.nutritionProtein }]}>
            <Text style={styles.badgeIcon}>🔥</Text>
            <Text style={styles.badgeText}>{Math.round(food.calories)} cal</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.nutritionProtein }]}>
            <Text style={styles.badgeIcon}>🥩</Text>
            <Text style={styles.badgeText}>{Math.round(food.protein * 10) / 10}g</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.nutritionCarbs }]}>
            <Text style={styles.badgeIcon}>🍞</Text>
            <Text style={styles.badgeText}>{Math.round(food.carbs * 10) / 10}g</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.nutritionFat }]}>
            <Text style={styles.badgeIcon}>🥑</Text>
            <Text style={styles.badgeText}>{Math.round(food.fat * 10) / 10}g</Text>
          </View>
        </View>

        {food.needsQuantity && (
          <TouchableOpacity 
            style={styles.clarifyButton}
            onPress={() => handleQuantitySpecification(index)}
          >
            <MaterialIcons name="restaurant" size={14} color={colors.primary} />
            <Text style={styles.clarifyButtonText}>Set Quantity</Text>
          </TouchableOpacity>
        )}

        {food.needsCookingMethod && (
          <TouchableOpacity 
            style={styles.clarifyButton}
            onPress={() => handleCookingMethodSpecification(index)}
          >
            <MaterialIcons name="restaurant" size={14} color={colors.primary} />
            <Text style={styles.clarifyButtonText}>Set Cooking Method</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                Confirm Meal 🍽️
              </Text>
              <Text style={styles.headerSubtitle}>
                Review and confirm your food items
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tabActive}>
            <Text style={styles.tabTextActive}>Items ({foods.length})</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Food Items */}
            {foods.map((food, index) => renderFoodItem(food, index))}

            {/* Add More Button */}
            <TouchableOpacity style={styles.addButton} onPress={onAddFood}>
              <MaterialIcons name="add" size={24} color={colors.white} />
              <Text style={styles.addButtonText}>Add More Food</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            style={styles.bottomCancelButton}
          />
          <Button
            title={hasAnyUnspecified ? "Complete Details" : "Log Meal"}
            onPress={onConfirm}
            variant="primary"
            loading={isLoading}
            disabled={hasAnyUnspecified}
            style={styles.bottomConfirmButton}
          />
        </View>

        {/* Edit Food Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={handleEditCancel}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Food Item</Text>
              
              {editModalIndex !== null && foods[editModalIndex] && (
                <>
                  <Text style={styles.modalSubtitle}>
                    {String(foods[editModalIndex].name)}
                  </Text>

                  {/* Name Input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Food Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.name || ''}
                      onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                      placeholder="Enter food name"
                    />
                  </View>

                  {/* Quantity Input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <View style={styles.quantityRow}>
                      <TextInput
                        style={[styles.textInput, { flex: 1, marginRight: spacing.sm }]}
                        value={String(editForm.quantity || '')}
                        onChangeText={(text) => setEditForm({ ...editForm, quantity: parseFloat(text) || 0 })}
                        placeholder="Amount"
                        keyboardType="numeric"
                      />
                      <View style={styles.unitDropdown}>
                        <Text style={styles.unitDropdownText}>{String(editForm.unit || 'pieces')}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
                      </View>
                    </View>
                  </View>

                  {/* Cooking Method Input */}
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Cooking Method (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.cookingMethod || ''}
                      onChangeText={(text) => setEditForm({ ...editForm, cookingMethod: text })}
                      placeholder="e.g., Grilled, Fried, Baked"
                    />
                  </View>

                  {/* Quick Cooking Method Buttons */}
                  {!editForm.cookingMethod && (
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>Quick Select</Text>
                      <View style={styles.cookingMethodButtons}>
                        {['Grilled', 'Fried', 'Baked', 'Boiled'].map((method) => (
                          <TouchableOpacity
                            key={method}
                            style={styles.cookingMethodButton}
                            onPress={() => {
                              setEditForm({ ...editForm, cookingMethod: method });
                              const updatedFood: ParsedFoodItem = {
                                ...foods[editModalIndex],
                                cookingMethod: method,
                                needsCookingMethod: false,
                              };
                              onUpdateFood(editModalIndex, updatedFood);
                              setEditModalVisible(false);
                            }}
                          >
                            <Text style={styles.cookingMethodButtonText}>{method}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={handleEditCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalUpdateButton}
                  onPress={handleEditSave}
                >
                  <Text style={styles.modalUpdateText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Quantity Input Modal */}
        {quantityDialogIndex !== null && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Specify Quantity</Text>
              <Text style={styles.modalSubtitle}>
                For {String(foods[quantityDialogIndex]?.name || '')}
              </Text>
              
              {/* Current Nutrition */}
              {foods[quantityDialogIndex] && (
                <View style={styles.currentNutrition}>
                  <Text style={styles.currentNutritionText}>
                    Current: {String(Math.round(foods[quantityDialogIndex].calories))} cal, {String(Math.round(foods[quantityDialogIndex].protein * 10) / 10)}g protein, {String(Math.round(foods[quantityDialogIndex].carbs * 10) / 10)}g carbs, {String(Math.round(foods[quantityDialogIndex].fat * 10) / 10)}g fat
                  </Text>
                </View>
              )}
              
              {/* Quick Select */}
              <Text style={styles.sectionTitle}>Quick Select</Text>
              <View style={styles.quantityPresets}>
                {quantityPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.quantityPresetButton,
                      quantityInput === preset.value && styles.quantityPresetButtonActive
                    ]}
                    onPress={() => setQuantityInput(preset.value)}
                  >
                    <Text style={[
                      styles.quantityPresetText,
                      quantityInput === preset.value && styles.quantityPresetTextActive
                    ]}>
                      {String(preset.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Custom Amount & Unit */}
              <View style={styles.customSection}>
                <View style={styles.customRow}>
                  <Text style={styles.sectionTitle}>Custom Amount</Text>
                  <Text style={styles.sectionTitle}>Unit</Text>
                </View>
                <View style={styles.customRow}>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                  />
                  <View style={styles.unitDropdown}>
                    <Text style={styles.unitDropdownText}>{String(selectedUnit)}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
                  </View>
                </View>
              </View>
              
              {/* Unit Selection */}
              <View style={styles.unitSelection}>
                {commonUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit.value}
                    style={[
                      styles.unitButton,
                      selectedUnit === unit.value && styles.unitButtonActive
                    ]}
                    onPress={() => setSelectedUnit(unit.value)}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      selectedUnit === unit.value && styles.unitButtonTextActive
                    ]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Updated Nutrition Preview */}
              {quantityInput && foods[quantityDialogIndex] && (
                <View style={styles.updatedNutrition}>
                  <Text style={styles.sectionTitle}>Updated Nutrition</Text>
                  <View style={styles.nutritionPreview}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValueText}>
                        {(() => {
                          const multiplier = parseFloat(quantityInput) || 1;
                          const food = foods[quantityDialogIndex];
                          if (!food) return '0';
                          
                          let finalCalories = food.calories;
                          if (selectedUnit === 'grams') {
                            const gramsPerServing = 100;
                            finalCalories = Math.round(food.calories * (multiplier / gramsPerServing));
                          } else {
                            finalCalories = Math.round(food.calories * multiplier);
                          }
                          return String(finalCalories);
                        })()}
                      </Text>
                      <Text style={styles.nutritionValueLabel}>calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValueText}>
                        {(() => {
                          const multiplier = parseFloat(quantityInput) || 1;
                          const food = foods[quantityDialogIndex];
                          if (!food) return '0';
                          
                          let finalProtein = food.protein;
                          if (selectedUnit === 'grams') {
                            const gramsPerServing = 100;
                            finalProtein = Math.round((food.protein / gramsPerServing) * multiplier * 10) / 10;
                          } else {
                            finalProtein = Math.round(food.protein * multiplier * 10) / 10;
                          }
                          return String(finalProtein);
                        })()}
                      </Text>
                      <Text style={styles.nutritionValueLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValueText}>
                        {(() => {
                          const multiplier = parseFloat(quantityInput) || 1;
                          const food = foods[quantityDialogIndex];
                          if (!food) return '0';
                          
                          let finalCarbs = food.carbs;
                          if (selectedUnit === 'grams') {
                            const gramsPerServing = 100;
                            finalCarbs = Math.round((food.carbs / gramsPerServing) * multiplier * 10) / 10;
                          } else {
                            finalCarbs = Math.round(food.carbs * multiplier * 10) / 10;
                          }
                          return String(finalCarbs);
                        })()}
                      </Text>
                      <Text style={styles.nutritionValueLabel}>carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValueText}>
                        {(() => {
                          const multiplier = parseFloat(quantityInput) || 1;
                          const food = foods[quantityDialogIndex];
                          if (!food) return '0';
                          
                          let finalFat = food.fat;
                          if (selectedUnit === 'grams') {
                            const gramsPerServing = 100;
                            finalFat = Math.round((food.fat / gramsPerServing) * multiplier * 10) / 10;
                          } else {
                            finalFat = Math.round(food.fat * multiplier * 10) / 10;
                          }
                          return String(finalFat);
                        })()}
                      </Text>
                      <Text style={styles.nutritionValueLabel}>fat</Text>
                    </View>
                  </View>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setQuantityDialogIndex(null);
                    setQuantityInput('');
                    setSelectedUnit('pieces');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalUpdateButton}
                  onPress={handleQuantitySubmit}
                >
                  <Text style={styles.modalUpdateText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Cooking Method Selection Modal */}
        {cookingMethodDialogIndex !== null && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Cooking Method</Text>
              <Text style={styles.modalSubtitle}>
                How was {String(foods[cookingMethodDialogIndex]?.name || '')} cooked?
              </Text>
              
              <View style={styles.cookingMethodButtons}>
                <TouchableOpacity 
                  style={styles.cookingMethodButton}
                  onPress={() => handleCookingMethodSelect('Grilled')}
                >
                  <Text style={styles.cookingMethodButtonText}>Grilled</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cookingMethodButton}
                  onPress={() => handleCookingMethodSelect('Fried')}
                >
                  <Text style={styles.cookingMethodButtonText}>Fried</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cookingMethodButton}
                  onPress={() => handleCookingMethodSelect('Baked')}
                >
                  <Text style={styles.cookingMethodButtonText}>Baked</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cookingMethodButton}
                  onPress={() => handleCookingMethodSelect('Boiled')}
                >
                  <Text style={styles.cookingMethodButtonText}>Boiled</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setCookingMethodDialogIndex(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalUpdateButton}
                  onPress={() => setCookingMethodDialogIndex(null)}
                >
                  <Text style={styles.modalUpdateText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}; 