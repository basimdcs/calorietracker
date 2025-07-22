import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useUserStore } from '../../stores/userStore';
import { useUser } from '../../hooks/useUser';
import { UserProfile, ActivityLevel, Goal } from '../../types';

const SettingsScreen: React.FC = () => {
  const { profile, updateProfile } = useUserStore();
  const { userStats } = useUser();
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    goalAchievements: true,
    weeklyReports: false,
  });

  const handleSave = () => {
    if (localProfile) {
      updateProfile(localProfile);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    if (localProfile) {
      setLocalProfile({
        ...localProfile,
        [field]: value,
      });
    }
  };

  const getActivityLevelLabel = (level: ActivityLevel) => {
    switch (level) {
      case 'sedentary': return 'Sedentary (little or no exercise)';
      case 'lightly-active': return 'Lightly Active (light exercise 1-3 days/week)';
      case 'moderately-active': return 'Moderately Active (moderate exercise 3-5 days/week)';
      case 'very-active': return 'Very Active (hard exercise 6-7 days/week)';
      case 'extra-active': return 'Extra Active (very hard exercise, physical job)';
      default: return level;
    }
  };

  const getGoalLabel = (goal: Goal) => {
    switch (goal) {
      case 'lose': return 'Lose Weight';
      case 'maintain': return 'Maintain Weight';
      case 'gain': return 'Gain Weight';
      default: return goal;
    }
  };

  if (!localProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                ⚙️ Settings
              </Text>
              <Text style={styles.headerSubtitle}>
                Manage your profile and preferences
              </Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Profile Information */}
            <Card style={styles.profileCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
                <Text style={styles.cardTitle}>Profile Information</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <MaterialIcons name="person" size={16} color={colors.primary} />
                    {' '}Name
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={localProfile.name}
                    onChangeText={(text) => updateProfileField('name', text)}
                    placeholder="Enter your name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <MaterialIcons name="cake" size={16} color={colors.primary} />
                    {' '}Age
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={String(localProfile.age)}
                    onChangeText={(text) => updateProfileField('age', parseInt(text) || 0)}
                    placeholder="Enter your age"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <MaterialIcons name="height" size={16} color={colors.primary} />
                    {' '}Height (cm)
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={String(localProfile.height)}
                    onChangeText={(text) => updateProfileField('height', parseFloat(text) || 0)}
                    placeholder="Enter your height in cm"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <MaterialIcons name="monitor-weight" size={16} color={colors.primary} />
                    {' '}Weight (kg)
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={String(localProfile.weight)}
                    onChangeText={(text) => updateProfileField('weight', parseFloat(text) || 0)}
                    placeholder="Enter your weight in kg"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    <MaterialIcons name="wc" size={16} color={colors.primary} />
                    {' '}Gender
                  </Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        localProfile.gender === 'male' && styles.radioButtonActive,
                      ]}
                      onPress={() => updateProfileField('gender', 'male')}
                    >
                      <Text style={[
                        styles.radioText,
                        localProfile.gender === 'male' && styles.radioTextActive,
                      ]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        localProfile.gender === 'female' && styles.radioButtonActive,
                      ]}
                      onPress={() => updateProfileField('gender', 'female')}
                    >
                      <Text style={[
                        styles.radioText,
                        localProfile.gender === 'female' && styles.radioTextActive,
                      ]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Card>

            {/* Activity Level */}
            <Card style={styles.activityCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="fitness-center" size={24} color={colors.secondary} />
                <Text style={styles.cardTitle}>Activity Level</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.sectionDescription}>
                  Select your typical activity level to calculate your daily calorie needs.
                </Text>
                <View style={styles.activityOptions}>
                  {(['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active'] as ActivityLevel[]).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.activityOption,
                        localProfile.activityLevel === level && styles.activityOptionActive,
                      ]}
                      onPress={() => updateProfileField('activityLevel', level)}
                    >
                      <View style={styles.activityOptionContent}>
                        <Text style={[
                          styles.activityOptionText,
                          localProfile.activityLevel === level && styles.activityOptionTextActive,
                        ]}>
                          {getActivityLevelLabel(level)}
                        </Text>
                        {localProfile.activityLevel === level && (
                          <MaterialIcons name="check" size={20} color={colors.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>

            {/* Goal */}
            <Card style={styles.goalCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="flag" size={24} color={colors.accent} />
                <Text style={styles.cardTitle}>Fitness Goal</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.sectionDescription}>
                  Choose your primary fitness goal to set appropriate calorie targets.
                </Text>
                <View style={styles.goalOptions}>
                  {(['lose', 'maintain', 'gain'] as Goal[]).map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.goalOption,
                        localProfile.goal === goal && styles.goalOptionActive,
                      ]}
                      onPress={() => updateProfileField('goal', goal)}
                    >
                      <View style={styles.goalOptionContent}>
                        <Text style={[
                          styles.goalOptionText,
                          localProfile.goal === goal && styles.goalOptionTextActive,
                        ]}>
                          {getGoalLabel(goal)}
                        </Text>
                        {localProfile.goal === goal && (
                          <MaterialIcons name="check" size={20} color={colors.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Card>

            {/* Current Stats */}
            <Card style={styles.statsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="analytics" size={24} color={colors.warning} />
                <Text style={styles.cardTitle}>Current Stats</Text>
              </View>
              <View style={styles.cardContent}>
                                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{Math.round(userStats?.bmr || 0)}</Text>
                      <Text style={styles.statLabel}>BMR (cal/day)</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{Math.round(userStats?.tdee || 0)}</Text>
                      <Text style={styles.statLabel}>TDEE (cal/day)</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{Math.round(userStats?.calorieGoal || 0)}</Text>
                      <Text style={styles.statLabel}>Daily Goal</Text>
                    </View>
                  </View>
              </View>
            </Card>

            {/* Notifications */}
            <Card style={styles.notificationsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="notifications" size={24} color={colors.error} />
                <Text style={styles.cardTitle}>Notifications</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Meal Reminders</Text>
                    <Text style={styles.notificationDescription}>
                      Get reminded to log your meals
                    </Text>
                  </View>
                  <Switch
                    value={notifications.mealReminders}
                    onValueChange={(value) => setNotifications({
                      ...notifications,
                      mealReminders: value,
                    })}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Goal Achievements</Text>
                    <Text style={styles.notificationDescription}>
                      Celebrate when you reach your goals
                    </Text>
                  </View>
                  <Switch
                    value={notifications.goalAchievements}
                    onValueChange={(value) => setNotifications({
                      ...notifications,
                      goalAchievements: value,
                    })}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>Weekly Reports</Text>
                    <Text style={styles.notificationDescription}>
                      Get a summary of your weekly progress
                    </Text>
                  </View>
                  <Switch
                    value={notifications.weeklyReports}
                    onValueChange={(value) => setNotifications({
                      ...notifications,
                      weeklyReports: value,
                    })}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>
            </Card>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="save" size={24} color={colors.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  profileCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationsCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  cardContent: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
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
  sectionDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  activityOptions: {
    gap: spacing.sm,
  },
  activityOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  activityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityOptionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    flex: 1,
  },
  activityOptionTextActive: {
    color: colors.white,
  },
  goalOptions: {
    gap: spacing.sm,
  },
  goalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  goalOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalOptionText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    flex: 1,
  },
  goalOptionTextActive: {
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 12,
  },
  statValue: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  notificationDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: spacing.sm,
  },
});

export default SettingsScreen; 