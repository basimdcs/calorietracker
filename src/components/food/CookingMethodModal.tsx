import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';

interface CookingMethodModalProps {
  visible: boolean;
  food: ParsedFoodItem | null;
  onConfirm: (cookingMethod: string) => void;
  onCancel: () => void;
}

const COOKING_METHODS = [
  { method: 'Grilled', icon: '🔥', arabic: 'مشوي' },
  { method: 'Fried', icon: '🍳', arabic: 'مقلي' },
  { method: 'Baked', icon: '🥖', arabic: 'في الفرن' },
  { method: 'Boiled', icon: '💧', arabic: 'مسلوق' },
  { method: 'Steamed', icon: '♨️', arabic: 'مطهو بالبخار' },
  { method: 'Raw', icon: '🥗', arabic: 'نيء' },
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
    return ['Boiled', 'Steamed'];
  }
  
  // Bread and pastries
  if (name.includes('عيش') || name.includes('خبز') || name.includes('فطير')) {
    return ['Baked'];
  }
  
  // Vegetables and salads
  if (name.includes('خضار') || name.includes('سلطة') || name.includes('طماطم') || name.includes('خيار')) {
    return ['Raw', 'Grilled', 'Steamed'];
  }
  
  // Fruits (most fruits are eaten raw)
  if (name.includes('فاكهة') || name.includes('تفاح') || name.includes('موز') || name.includes('برتقال') || name.includes('مانجا') || name.includes('مانجو')) {
    return ['Raw'];
  }
  
  // Fish and seafood
  if (name.includes('سمك') || name.includes('جمبري') || name.includes('كابوريا')) {
    return ['Grilled', 'Fried', 'Baked'];
  }
  
  // Default suggestions
  return ['Grilled', 'Fried', 'Baked', 'Boiled'];
};

export const CookingMethodModal: React.FC<CookingMethodModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');

  const suggestedMethods = useMemo(() => 
    food ? getSuggestedCookingMethods(food.name) : []
  , [food]);

  const filteredMethods = useMemo(() => 
    COOKING_METHODS.filter(cm => 
      suggestedMethods.length === 0 || suggestedMethods.includes(cm.method)
    )
  , [suggestedMethods]);

  if (!food) return null;

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
    }
  };

  const handleSkip = () => {
    onConfirm(''); // Empty cooking method
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cooking Method</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Food Info Section */}
            <View style={styles.foodSection}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.subtitle}>How was this prepared?</Text>
            </View>

            {/* Cooking Methods List */}
            <View style={styles.section}>
              {filteredMethods.map((item, index) => (
                <TouchableOpacity
                  key={item.method}
                  style={[
                    styles.methodButton,
                    selectedMethod === item.method && styles.methodButtonActive,
                    index === filteredMethods.length - 1 && styles.methodButtonLast
                  ]}
                  onPress={() => handleMethodSelect(item.method)}
                >
                  <View style={styles.methodIconContainer}>
                    <Text style={styles.methodIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={[
                      styles.methodText,
                      selectedMethod === item.method && styles.methodTextActive
                    ]}>
                      {item.method}
                    </Text>
                    <Text style={[
                      styles.methodArabic,
                      selectedMethod === item.method && styles.methodArabicActive
                    ]}>
                      {item.arabic}
                    </Text>
                  </View>
                  {selectedMethod === item.method && (
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Nutrition impact preview */}
            {selectedMethod && (
              <View style={styles.section}>
                <View style={styles.impactCard}>
                  <Text style={styles.impactTitle}>Calorie Impact</Text>
                  {(() => {
                    const multiplier = {
                      'Raw': 1.0,
                      'Boiled': 1.0,
                      'Steamed': 1.0,
                      'Grilled': 1.1,
                      'Baked': 1.05,
                      'Fried': 1.4,
                    }[selectedMethod] || 1.0;
                    
                    const change = Math.round((multiplier - 1) * 100);
                    const newCalories = Math.round(food.calories * multiplier);
                    
                    return (
                      <View style={styles.impactContent}>
                        <Text style={styles.impactText}>
                          {change === 0 
                            ? 'No change to calories' 
                            : `${change > 0 ? '+' : ''}${change}% calories`
                          }
                        </Text>
                        <Text style={styles.impactCalories}>
                          {food.calories} → {newCalories} cal
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title="Confirm"
              onPress={handleConfirm}
              variant="primary"
              style={styles.footerButton}
              disabled={!selectedMethod}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  closeButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  foodSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray50,
  },
  foodName: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  methodButtonLast: {
    marginBottom: 0,
  },
  methodIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
  },
  methodContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  methodText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  methodTextActive: {
    color: colors.primary,
  },
  methodArabic: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  methodArabicActive: {
    color: colors.primary,
  },
  impactCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.lg,
  },
  impactTitle: {
    fontSize: fonts.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  impactContent: {
    alignItems: 'center',
  },
  impactText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  impactCalories: {
    fontSize: fonts.lg,
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  footerButton: {
    flex: 1,
  },
});