import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LoggedFood } from '../../../types';
import { colors, fonts, spacing, shadows } from '../../../constants/theme';
import { Card } from '../Card';
import { useFoodStore } from '../../../stores/foodStore';

interface MealItemProps {
  food: LoggedFood;
  onRemove: (foodId: string) => void;
  onUpdateQuantity: (foodId: string, quantity: number) => void;
}

export const MealItem: React.FC<MealItemProps> = ({
  food,
  onRemove,
  onUpdateQuantity,
}) => {
  const { getDisplayQuantity } = useFoodStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newQuantityInput, setNewQuantityInput] = useState('');
  const handleRemove = () => {
    Alert.alert(
      'Remove Food',
      `Remove ${food.foodItem.name} from your log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: () => onRemove(food.id) 
        },
      ]
    );
  };

  const handleEditQuantity = () => {
    const displayQty = getDisplayQuantity(food);
    setNewQuantityInput(displayQty.amount.toString());
    setEditModalVisible(true);
  };

  const handleSaveQuantity = () => {
    const newAmount = parseFloat(newQuantityInput);
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number.');
      return;
    }

    // Convert display quantity back to store quantity (serving multiplier)
    let newQuantityMultiplier;
    if (food.foodItem.servingSizeUnit === 'g' && food.foodItem.servingSize === 100) {
      // For gram-based foods, convert grams to quantity multiplier
      newQuantityMultiplier = newAmount / 100;
    } else {
      // For piece-based foods, use the amount directly
      newQuantityMultiplier = newAmount;
    }

    onUpdateQuantity(food.id, newQuantityMultiplier);
    setEditModalVisible(false);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snacks':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return colors.mealBreakfast;
      case 'lunch':
        return colors.mealLunch;
      case 'dinner':
        return colors.mealDinner;
      case 'snacks':
        return colors.mealSnacks;
      default:
        return colors.surfaceSecondary;
    }
  };

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.foodName} numberOfLines={1}>
              {food.foodItem.name}
            </Text>
            <View style={[
              styles.mealTypeBadge, 
              { backgroundColor: getMealTypeColor(food.mealType) }
            ]}>
              <Text style={styles.mealTypeIcon}>
                {getMealTypeIcon(food.mealType)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <TouchableOpacity onPress={handleEditQuantity}>
              <Text style={[styles.quantityText, styles.editableQuantity]}>
                {(() => {
                  const displayQty = getDisplayQuantity(food);
                  return `${displayQty.amount} ${displayQty.unit}`;
                })()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>
              {formatTime(food.loggedAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={handleRemove}
        >
          <MaterialIcons name="close" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.nutritionRow}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.calories)}
          </Text>
          <Text style={styles.nutritionLabel}>cal</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.protein * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>protein</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.carbs * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>carbs</Text>
        </View>
        
        <View style={styles.nutritionDivider} />
        
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionValue}>
            {Math.round(food.nutrition.fat * 10) / 10}
          </Text>
          <Text style={styles.nutritionLabel}>fat</Text>
        </View>
      </View>

      {/* Edit Quantity Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Quantity</Text>
            <Text style={styles.modalSubtitle}>{food.foodItem.name}</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.quantityInput}
                value={newQuantityInput}
                onChangeText={setNewQuantityInput}
                placeholder="Enter quantity"
                keyboardType="numeric"
                selectTextOnFocus={true}
                autoFocus={true}
              />
              <Text style={styles.unitLabel}>
                {getDisplayQuantity(food).unit}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveQuantity}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  mealCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  mealInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  foodName: {
    fontSize: fonts.base,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  mealTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mealTypeIcon: {
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editableQuantity: {
    backgroundColor: colors.primary50,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  timeText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: fonts.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  nutritionLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 300,
    ...shadows.xl,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: fonts.sm,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: fonts.sm,
    fontWeight: '500' as const,
    color: colors.textOnPrimary,
  },
}); 