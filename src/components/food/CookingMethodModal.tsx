import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ParsedFoodItem } from '../../types';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button } from '../ui/Button';
import { nutritionService } from '../../services/nutrition';

interface CookingMethodModalProps {
  visible: boolean;
  food: ParsedFoodItem | null;
  onConfirm: (cookingMethod: string) => void;
  onCancel: () => void;
}

const COOKING_METHODS = [
  { method: 'Raw', icon: '🥗', description: 'No cooking involved' },
  { method: 'Grilled', icon: '🔥', description: 'Adds light smoky flavor' },
  { method: 'Baked', icon: '🔄', description: 'Oven cooked, minimal oil' },
  { method: 'Boiled', icon: '💧', description: 'Water cooked, no added fat' },
  { method: 'Steamed', icon: '♨️', description: 'Steam cooked, retains nutrients' },
  { method: 'Sautéed', icon: '🍳', description: 'Pan cooked with some oil' },
  { method: 'Fried', icon: '🔥', description: 'Pan fried, moderate oil' },
  { method: 'Deep Fried', icon: '🛢️', description: 'Deep fried, high calorie' },
  { method: 'Roasted', icon: '🔥', description: 'Oven roasted with oil' },
];

export const CookingMethodModal: React.FC<CookingMethodModalProps> = ({
  visible,
  food,
  onConfirm,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [customMethod, setCustomMethod] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const suggestedMethods = useMemo(() => 
    food ? nutritionService.getSuggestedCookingMethods(food.name) : []
  , [food]);

  const filteredMethods = useMemo(() => 
    COOKING_METHODS.filter(cm => 
      suggestedMethods.length === 0 || suggestedMethods.includes(cm.method)
    )
  , [suggestedMethods]);

  if (!food) return null;

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setShowCustomInput(false);
    setCustomMethod('');
  };

  const handleCustomMethod = () => {
    setShowCustomInput(true);
    setSelectedMethod('');
  };

  const handleConfirm = () => {
    const finalMethod = showCustomInput ? customMethod.trim() : selectedMethod;
    if (finalMethod) {
      onConfirm(finalMethod);
    }
  };

  const handleSkip = () => {
    onConfirm(''); // Empty cooking method
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>Cooking Method</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  How was {food.name} prepared?
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
              {/* Impact info */}
              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Cooking method affects calorie content. Frying adds more calories than grilling.
                </Text>
              </View>

              {/* Cooking methods grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {suggestedMethods.length > 0 ? 'Recommended Methods' : 'Common Methods'}
                </Text>
                <View style={styles.methodsGrid}>
                  {filteredMethods.map((item) => (
                    <TouchableOpacity
                      key={item.method}
                      style={[
                        styles.methodButton,
                        selectedMethod === item.method && styles.methodButtonActive
                      ]}
                      onPress={() => handleMethodSelect(item.method)}
                    >
                      <Text style={styles.methodIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.methodText,
                        selectedMethod === item.method && styles.methodTextActive
                      ]}>
                        {item.method}
                      </Text>
                      <Text style={styles.methodDescription}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom method option */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={[
                    styles.customMethodButton,
                    showCustomInput && styles.customMethodButtonActive
                  ]}
                  onPress={handleCustomMethod}
                >
                  <MaterialIcons 
                    name="add" 
                    size={20} 
                    color={showCustomInput ? colors.white : colors.primary} 
                  />
                  <Text style={[
                    styles.customMethodText,
                    showCustomInput && styles.customMethodTextActive
                  ]}>
                    Other cooking method
                  </Text>
                </TouchableOpacity>

                {showCustomInput && (
                  <TextInput
                    style={styles.customInput}
                    value={customMethod}
                    onChangeText={setCustomMethod}
                    placeholder="e.g., Stir-fried, Braised, Smoked..."
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                )}
              </View>

              {/* Nutrition impact preview */}
              {selectedMethod && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Calorie Impact</Text>
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
                        'Fried': 1.4,
                        'Deep Fried': 1.8,
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
                title="Set Method"
                onPress={handleConfirm}
                variant="primary"
                style={styles.footerButton}
                disabled={!selectedMethod && !customMethod.trim()}
              />
            </View>
          </View>
        </View>
      </View>
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
    maxHeight: '80%',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.blue50,
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.primary,
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
  methodsGrid: {
    gap: spacing.sm,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  methodText: {
    fontSize: fonts.base,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  methodTextActive: {
    color: colors.primary,
  },
  methodDescription: {
    flex: 1,
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  customMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
  },
  customMethodButtonActive: {
    backgroundColor: colors.primary,
    borderStyle: 'solid',
  },
  customMethodText: {
    fontSize: fonts.base,
    color: colors.primary,
    fontWeight: '500',
  },
  customMethodTextActive: {
    color: colors.white,
  },
  customInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    backgroundColor: colors.white,
  },
  impactPreview: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.md,
  },
  impactContent: {
    alignItems: 'center',
  },
  impactText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  impactCalories: {
    fontSize: fonts.lg,
    color: colors.primary,
    fontWeight: 'bold',
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