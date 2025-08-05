import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';

interface PreferencesSectionProps {
  preferences: {
    darkMode: boolean;
    language: string;
  };
  notifications: {
    mealReminders: boolean;
    goalAchievements: boolean;
    weeklyReports: boolean;
  };
  onPreferenceChange: (key: string, value: boolean) => void;
  onNotificationChange: (key: string, value: boolean) => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  preferences,
  notifications,
  onPreferenceChange,
  onNotificationChange,
}) => {
  return (
    <>
      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
              <Switch
                value={preferences.darkMode}
                onValueChange={(value) => onPreferenceChange('darkMode', value)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingDescription}>English</Text>
              </View>
              <TouchableOpacity style={styles.settingAction}>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>Get reminded to log meals</Text>
              </View>
              <Switch
                value={notifications.mealReminders}
                onValueChange={(value) => onNotificationChange('mealReminders', value)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Goal Achievements</Text>
                <Text style={styles.settingDescription}>Celebrate milestones</Text>
              </View>
              <Switch
                value={notifications.goalAchievements}
                onValueChange={(value) => onNotificationChange('goalAchievements', value)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Weekly Reports</Text>
                <Text style={styles.settingDescription}>Weekly progress summary</Text>
              </View>
              <Switch
                value={notifications.weeklyReports}
                onValueChange={(value) => onNotificationChange('weeklyReports', value)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </Card>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  settingAction: {
    padding: spacing.sm,
  },
});

export default PreferencesSection; 