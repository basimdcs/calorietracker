import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../constants/theme';
import { useUserStore } from '../../stores/userStore';
import { UserProfile } from '../../types';

interface InlineCalorieEditorProps {
  profile: UserProfile;
}

const InlineCalorieEditor: React.FC<InlineCalorieEditorProps> = ({ profile }) => {
  const { updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempCalories, setTempCalories] = useState(
    profile.customCalorieGoal || profile.dailyCalorieGoal || 2000
  );

  const currentCalories = profile.customCalorieGoal || profile.dailyCalorieGoal || 2000;

  const handleSave = () => {
    // Gentle validation - only prevent extreme values
    const validatedCalories = Math.min(6000, Math.max(800, tempCalories));
    
    updateProfile({
      ...profile,
      customCalorieGoal: validatedCalories,
      dailyCalorieGoal: validatedCalories,
    });
    
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setTempCalories(currentCalories);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleReset = () => {
    // Reset to calculated value based on BMR/TDEE
    const calculatedCalories = profile.dailyCalorieGoal || 2000;
    
    updateProfile({
      ...profile,
      customCalorieGoal: undefined, // Remove custom override
      dailyCalorieGoal: calculatedCalories,
    });
    
    setTempCalories(calculatedCalories);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.editorContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.calorieInput}
            value={tempCalories.toString()}
            onChangeText={(text) => {
              const numValue = parseInt(text) || 0;
              setTempCalories(numValue);
            }}
            onBlur={() => {
              // Gentle validation on blur
              if (tempCalories < 800) setTempCalories(800);
              else if (tempCalories > 6000) setTempCalories(6000);
            }}
            keyboardType="numeric"
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            autoFocus
            placeholder="e.g., 2000"
          />
          <Text style={styles.caloriesUnit}>cal</Text>
        </View>
        
        <Text style={styles.rangeHint}>Range: 800 - 6,000 calories</Text>
        
        <View style={styles.actionButtonsContainer}>
          {profile.customCalorieGoal && (
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <MaterialIcons name="refresh" size={16} color={colors.brandOuterSkin} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="check" size={16} color={colors.white} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.displayContainer} onPress={() => setIsEditing(true)}>
      <View style={styles.calorieDisplay}>
        <Text style={styles.calorieValue}>{currentCalories.toLocaleString()}</Text>
        <Text style={styles.calorieUnit}>cal</Text>
      </View>
      <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  calorieDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  calorieValue: {
    fontSize: fonts.lg,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
  },
  calorieUnit: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  editorContainer: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '40',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  calorieInput: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.brandOuterSkin,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.brandOuterSkin + '40',
    minWidth: 100,
    textAlign: 'center',
    ...shadows.sm,
  },
  caloriesUnit: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  rangeHint: {
    fontSize: fonts.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    gap: spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignSelf: 'center',
  },
  resetButtonText: {
    fontSize: fonts.sm,
    color: colors.brandOuterSkin,
    fontWeight: fonts.medium,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: fonts.medium,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandOuterSkin,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadows.sm,
  },
  saveButtonText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: fonts.semibold,
  },
});

export default InlineCalorieEditor;