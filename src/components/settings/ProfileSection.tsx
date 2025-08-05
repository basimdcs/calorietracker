import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { UserProfile, ActivityLevel, Goal } from '../../types';

interface ProfileSectionProps {
  profile: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof UserProfile, value: any) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onFieldChange,
}) => {
  const getActivityLevelLabel = (level: ActivityLevel) => {
    const labels = {
      'sedentary': 'Sedentary',
      'lightly-active': 'Lightly Active',
      'moderately-active': 'Moderately Active',
      'very-active': 'Very Active',
      'extra-active': 'Extra Active'
    };
    return labels[level] || level;
  };

  const getGoalLabel = (goal: Goal) => {
    const labels = {
      'lose': 'Lose Weight',
      'maintain': 'Maintain Weight',
      'gain': 'Gain Weight'
    };
    return labels[goal] || goal;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.profileGrid}>
            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={profile.name}
                  onChangeText={(text) => onFieldChange('name', text)}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.name || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Age</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.textInput, styles.numberInput]}
                  value={String(profile.age)}
                  onChangeText={(text) => onFieldChange('age', parseInt(text) || 0)}
                  placeholder="Age"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.age || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Height (cm)</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.textInput, styles.numberInput]}
                  value={String(profile.height)}
                  onChangeText={(text) => onFieldChange('height', parseFloat(text) || 0)}
                  placeholder="Height"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.height || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.profileField}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.textInput, styles.numberInput]}
                  value={String(profile.weight)}
                  onChangeText={(text) => onFieldChange('weight', parseFloat(text) || 0)}
                  placeholder="Weight"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.weight || 'Not set'}</Text>
              )}
            </View>
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Gender</Text>
            {isEditing ? (
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    profile.gender === 'male' && styles.radioButtonActive,
                  ]}
                  onPress={() => onFieldChange('gender', 'male')}
                >
                  <Text style={[
                    styles.radioText,
                    profile.gender === 'male' && styles.radioTextActive,
                  ]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    profile.gender === 'female' && styles.radioButtonActive,
                  ]}
                  onPress={() => onFieldChange('gender', 'female')}
                >
                  <Text style={[
                    styles.radioText,
                    profile.gender === 'female' && styles.radioTextActive,
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.fieldValue}>{profile.gender || 'Not set'}</Text>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cancelButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  saveButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  profileField: {
    flex: 1,
    minWidth: '45%',
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  numberInput: {
    flex: 0,
    minWidth: 80,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  radioButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  radioButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  radioTextActive: {
    color: colors.white,
  },
});

export default ProfileSection; 