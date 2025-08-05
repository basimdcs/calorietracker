import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../../components/ui';

interface NotificationSettings {
  mealReminders: boolean;
  dailyGoalNotifications: boolean;
  weeklyProgress: boolean;
  waterReminders: boolean;
  achievementNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // Initialize with some default values - in a real app, these would come from user preferences
  const [notifications, setNotifications] = useState<NotificationSettings>({
    mealReminders: true,
    dailyGoalNotifications: true,
    weeklyProgress: true,
    waterReminders: false,
    achievementNotifications: true,
    marketingEmails: false,
    productUpdates: true,
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, you would save these to AsyncStorage or send to server
    Alert.alert('Settings Saved', 'Your notification preferences have been updated.');
  };

  const NotificationItem = ({ 
    title, 
    description, 
    icon, 
    value, 
    onToggle 
  }: {
    title: string;
    description: string;
    icon: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray300, true: colors.primary + '30' }}
        thumbColor={value ? colors.primary : colors.gray400}
        ios_backgroundColor={colors.gray300}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity 
            onPress={handleSaveSettings} 
            style={styles.headerButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* App Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Notifications</Text>
              <Text style={styles.sectionDescription}>
                Control which notifications you receive from the CalorieTracker app
              </Text>
              
              <Card style={styles.card}>
                <NotificationItem
                  title="Meal Reminders"
                  description="Get reminded to log your meals throughout the day"
                  icon="restaurant"
                  value={notifications.mealReminders}
                  onToggle={() => handleToggle('mealReminders')}
                />
                
                <NotificationItem
                  title="Daily Goal Notifications"
                  description="Receive updates when you reach your daily calorie goals"
                  icon="flag"
                  value={notifications.dailyGoalNotifications}
                  onToggle={() => handleToggle('dailyGoalNotifications')}
                />
                
                <NotificationItem
                  title="Weekly Progress"
                  description="Get a weekly summary of your progress and achievements"
                  icon="trending-up"
                  value={notifications.weeklyProgress}
                  onToggle={() => handleToggle('weeklyProgress')}
                />
                
                <NotificationItem
                  title="Water Reminders"
                  description="Stay hydrated with regular water intake reminders"
                  icon="water-drop"
                  value={notifications.waterReminders}
                  onToggle={() => handleToggle('waterReminders')}
                />
                
                <NotificationItem
                  title="Achievement Notifications"
                  description="Celebrate your milestones and achievements"
                  icon="emoji-events"
                  value={notifications.achievementNotifications}
                  onToggle={() => handleToggle('achievementNotifications')}
                />
              </Card>
            </View>

            {/* Email Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email Notifications</Text>
              <Text style={styles.sectionDescription}>
                Manage email communications from CalorieTracker
              </Text>
              
              <Card style={styles.card}>
                <NotificationItem
                  title="Marketing Emails"
                  description="Receive tips, recipes, and promotional content"
                  icon="mail"
                  value={notifications.marketingEmails}
                  onToggle={() => handleToggle('marketingEmails')}
                />
                
                <NotificationItem
                  title="Product Updates"
                  description="Get notified about new features and app updates"
                  icon="new-releases"
                  value={notifications.productUpdates}
                  onToggle={() => handleToggle('productUpdates')}
                />
              </Card>
            </View>

            {/* Notification Schedule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Schedule</Text>
              <Text style={styles.sectionDescription}>
                Customize when you receive notifications
              </Text>
              
              <Card style={styles.card}>
                <TouchableOpacity style={styles.scheduleItem}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="schedule" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>Quiet Hours</Text>
                      <Text style={styles.itemDescription}>No notifications from 10:00 PM to 7:00 AM</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.scheduleItem}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="today" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>Meal Reminder Times</Text>
                      <Text style={styles.itemDescription}>Customize when to receive meal reminders</Text>
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </Card>
            </View>

            {/* Notification Permissions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Settings</Text>
              <Text style={styles.sectionDescription}>
                Manage notification permissions at the system level
              </Text>
              
              <Card style={styles.card}>
                <TouchableOpacity 
                  style={styles.scheduleItem}
                  onPress={() => Alert.alert(
                    'System Settings', 
                    'This will open your device settings to manage notification permissions for CalorieTracker.'
                  )}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons name="settings" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>App Notification Settings</Text>
                      <Text style={styles.itemDescription}>Manage permissions in device settings</Text>
                    </View>
                  </View>
                  <MaterialIcons name="open-in-new" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </Card>
            </View>

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
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  saveButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default NotificationsScreen;