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
import { useTranslation } from '../../hooks/useTranslation';

const ActivityLevelEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { profile, updateProfile } = useUserStore();

  const [selectedLevel, setSelectedLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'sedentary'
  );

  // Translation mapping for activity levels
  const getActivityLevelLabel = (level: ActivityLevel): string => {
    const labelMap: Record<ActivityLevel, string> = {
      'sedentary': t('activityLevelEdit.sedentary'),
      'lightly-active': t('activityLevelEdit.lightlyActive'),
      'moderately-active': t('activityLevelEdit.moderatelyActive'),
      'very-active': t('activityLevelEdit.veryActive'),
      'extra-active': t('activityLevelEdit.extremelyActive'),
    };
    return labelMap[level] || level;
  };

  const getActivityLevelDescription = (level: ActivityLevel): string => {
    const descMap: Record<ActivityLevel, string> = {
      'sedentary': t('activityLevelEdit.sedentaryDesc'),
      'lightly-active': t('activityLevelEdit.lightlyActiveDesc'),
      'moderately-active': t('activityLevelEdit.moderatelyActiveDesc'),
      'very-active': t('activityLevelEdit.veryActiveDesc'),
      'extra-active': t('activityLevelEdit.extremelyActiveDesc'),
    };
    return descMap[level] || level;
  };

  const handleSave = () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      activityLevel: selectedLevel,
      updatedAt: new Date(),
    };

    updateProfile(updatedProfile);
    Alert.alert(t('common.success'), t('activityLevelEdit.activityLevelUpdated'), [
      { text: t('common.ok'), onPress: () => navigation.goBack() }
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          <Text style={styles.headerTitle}>{t('activityLevelEdit.title')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* Description */}
            <Card style={styles.descriptionCard}>
              <View style={styles.descriptionHeader}>
                <MaterialIcons name="info" size={24} color={colors.primary} />
                <Text style={styles.descriptionTitle}>{t('activityLevelEdit.subtitle')}</Text>
              </View>
              <Text style={styles.descriptionText}>
                {t('activityLevelEdit.estimatedCalories')}
              </Text>
            </Card>

            {/* Activity Level Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activityLevelEdit.title')}</Text>
              
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
                          {getActivityLevelLabel(level.value)}
                        </Text>
                        <Text style={[
                          styles.optionDescription,
                          selectedLevel === level.value && styles.selectedOptionDescription,
                        ]}>
                          {getActivityLevelDescription(level.value)}
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
                {getActivityLevelLabel(selectedLevel)}
              </Text>
              <Text style={styles.summaryDescription}>
                {getActivityLevelDescription(selectedLevel)}
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