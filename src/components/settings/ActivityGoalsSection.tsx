import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { UserProfile, ActivityLevel, Goal } from '../../types';

interface ActivityGoalsSectionProps {
  profile: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onFieldChange: (field: keyof UserProfile, value: any) => void;
}

const ActivityGoalsSection: React.FC<ActivityGoalsSectionProps> = ({
  profile,
  isEditing,
  onEdit,
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
        <Text style={styles.sectionTitle}>Activity & Goals</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Activity Level</Text>
            {isEditing ? (
              <View style={styles.activityOptions}>
                {(['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active'] as ActivityLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.activityOption,
                      profile.activityLevel === level && styles.activityOptionActive,
                    ]}
                    onPress={() => onFieldChange('activityLevel', level)}
                  >
                    <Text style={[
                      styles.activityOptionText,
                      profile.activityLevel === level && styles.activityOptionTextActive,
                    ]}>
                      {getActivityLevelLabel(level)}
                    </Text>
                    {profile.activityLevel === level && (
                      <MaterialIcons name="check" size={16} color={colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{getActivityLevelLabel(profile.activityLevel) || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.profileField}>
            <Text style={styles.fieldLabel}>Fitness Goal</Text>
            {isEditing ? (
              <View style={styles.goalOptions}>
                {(['lose', 'maintain', 'gain'] as Goal[]).map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalOption,
                      profile.goal === goal && styles.goalOptionActive,
                    ]}
                    onPress={() => onFieldChange('goal', goal)}
                  >
                    <Text style={[
                      styles.goalOptionText,
                      profile.goal === goal && styles.goalOptionTextActive,
                    ]}>
                      {getGoalLabel(goal)}
                    </Text>
                    {profile.goal === goal && (
                      <MaterialIcons name="check" size={16} color={colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{getGoalLabel(profile.goal) || 'Not set'}</Text>
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
  profileField: {
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
  activityOptions: {
    gap: spacing.xs,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  activityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityOptionText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  activityOptionTextActive: {
    color: colors.white,
  },
  goalOptions: {
    gap: spacing.xs,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  goalOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalOptionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    flex: 1,
  },
  goalOptionTextActive: {
    color: colors.white,
  },
});

export default ActivityGoalsSection; 