import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import { ActivityLevel, ACTIVITY_LEVELS } from '../../types';

const ActivityLevelEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, updateProfile } = useUserStore();
  
  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'sedentary'
  );

  const handleSave = () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      activityLevel: selectedLevel,
      updatedAt: new Date(),
    };

    updateProfile(updatedProfile);
    Alert.alert('Success', 'Your activity level has been updated!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Level</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Description */}
            <Card style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <MaterialIcons name="info" size={24} color={colors.primary} />
                <Text style={styles.descriptionTitle}>Choose Your Activity Level</Text>
              </View>
              <Text style={styles.descriptionText}>
                This affects your daily calorie needs calculation. Be honest about your typical activity level for the most accurate results.
              </Text>
            </Card>

            {/* Activity Level Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Levels</Text>
              
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.optionCard,
                    selectedLevel === level.value && styles.selectedOptionCard,
                  ]}
                  onPress={() => setSelectedLevel(level.value)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                      <View style={[
                        styles.radioButton,
                        selectedLevel === level.value && styles.selectedRadioButton,
                      ]}>
                        {selectedLevel === level.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[
                          styles.optionTitle,
                          selectedLevel === level.value && styles.selectedOptionTitle,
                        ]}>
                          {level.label}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          selectedLevel === level.value && styles.selectedOptionDescription,
                        ]}>
                          {level.description}
                        </Text>
                      </View>
                    </View>
                    {selectedLevel === level.value && (
                      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Selection Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="timeline" size={24} color={colors.brandOuterSkin} />
                <Text style={styles.summaryTitle}>Current Selection</Text>
              </View>
              <Text style={styles.summaryLevel}>
                {ACTIVITY_LEVELS.find(level => level.value === selectedLevel)?.label}
              </Text>
              <Text style={styles.summaryDescription}>
                {ACTIVITY_LEVELS.find(level => level.value === selectedLevel)?.description}
              </Text>
            </Card>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
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
    marginBottom: spacing.sm,
  },
  descriptionCard: {
    padding: spacing.lg,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  descriptionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  descriptionText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedOptionCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedOptionTitle: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  selectedOptionDescription: {
    color: colors.textPrimary,
  },
  summaryCard: {
    padding: spacing.lg,
    backgroundColor: colors.brandFlesh + '20',
    borderWidth: 1,
    borderColor: colors.brandOuterSkin + '30',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryLevel: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.brandOuterSkin,
    marginBottom: spacing.xs,
  },
  summaryDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default ActivityLevelEditScreen;