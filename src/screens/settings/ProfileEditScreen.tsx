import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../constants/theme';
import { Button, Card, Input } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';
import {
  UserProfile,
  Gender
} from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTLStyles } from '../../utils/rtl';

const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, updateProfile } = useUserStore();
  const { t } = useTranslation();
  const { rtlText } = useRTLStyles();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile?.name || '',
    age: profile?.age || 0,
    gender: profile?.gender || 'male',
    height: profile?.height || 0,
    weight: profile?.weight || 0,
  });

  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('profileEdit.nameRequired');
    }
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      newErrors.age = t('profileEdit.ageRange');
    }
    if (!formData.height || formData.height < 100 || formData.height > 250) {
      newErrors.height = t('profileEdit.heightRange');
    }
    if (!formData.weight || formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = t('profileEdit.weightRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert(t('profileEdit.validationError'), t('profileEdit.checkFormErrors'));
      return;
    }

    if (!profile) return;

    const updatedProfile: UserProfile = {
      ...profile,
      ...formData,
      name: formData.name!.trim(),
      age: formData.age!,
      gender: formData.gender!,
      height: formData.height!,
      weight: formData.weight!,
      updatedAt: new Date(),
    };

    updateProfile(updatedProfile);
    Alert.alert(t('common.success'), t('profileEdit.profileUpdated'), [
      { text: t('common.ok'), onPress: () => navigation.goBack() }
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderGenderPicker = () => (
    <Modal
      visible={showGenderPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGenderPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, rtlText]}>{t('profileEdit.gender')}</Text>
            <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {(['male', 'female'] as Gender[]).map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.pickerItem,
                formData.gender === gender && styles.selectedPickerItem,
              ]}
              onPress={() => {
                setFormData({ ...formData, gender });
                setShowGenderPicker(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                formData.gender === gender && styles.selectedPickerItemText,
                rtlText,
              ]}>
                {gender === 'male' ? t('profileEdit.male') : t('profileEdit.female')}
              </Text>
              {formData.gender === gender && (
                <MaterialIcons name="check" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );


  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, rtlText]}>{t('common.loading')}</Text>
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
          <Text style={[styles.headerTitle, rtlText]}>{t('profileEdit.title')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveButtonText, rtlText]}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, rtlText]}>{t('profileEdit.basicInformation')}</Text>
              <Card style={styles.card}>
                <Input
                  label={t('profileEdit.fullName')}
                  value={formData.name || ''}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder={t('profileEdit.namePlaceholder')}
                  error={errors.name}
                />

                <Input
                  label={t('profileEdit.age')}
                  value={formData.age?.toString() || ''}
                  onChangeText={(text) => setFormData({ ...formData, age: parseInt(text) || 0 })}
                  placeholder={t('profileEdit.agePlaceholder')}
                  keyboardType="numeric"
                  error={errors.age}
                  style={styles.inputSpacing}
                />

                <View style={styles.inputSpacing}>
                  <Text style={[styles.inputLabel, rtlText]}>{t('profileEdit.gender')}</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowGenderPicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, rtlText]}>
                      {formData.gender === 'male' ? t('profileEdit.male') : t('profileEdit.female')}
                    </Text>
                    <MaterialIcons name="expand-more" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </Card>
            </View>

            {/* Physical Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, rtlText]}>{t('profileEdit.physicalInformation')}</Text>
              <Card style={styles.card}>
                <Input
                  label={t('profileEdit.height')}
                  value={formData.height?.toString() || ''}
                  onChangeText={(text) => setFormData({ ...formData, height: parseFloat(text) || 0 })}
                  placeholder={t('profileEdit.heightPlaceholder')}
                  keyboardType="numeric"
                  error={errors.height}
                />

                <Input
                  label={t('profileEdit.weight')}
                  value={formData.weight?.toString() || ''}
                  onChangeText={(text) => setFormData({ ...formData, weight: parseFloat(text) || 0 })}
                  placeholder={t('profileEdit.weightPlaceholder')}
                  keyboardType="numeric"
                  error={errors.weight}
                  style={styles.inputSpacing}
                />
              </Card>
            </View>


          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={t('common.cancel')}
            onPress={handleCancel}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={t('profileEdit.saveChanges')}
            onPress={handleSave}
            variant="primary"
            style={styles.actionButton}
          />
        </View>

        {/* Modal Pickers */}
        {renderGenderPicker()}
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
  card: {
    padding: spacing.lg,
  },
  inputSpacing: {
    marginTop: spacing.lg,
  },
  inputLabel: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  pickerButtonContent: {
    flex: 1,
  },
  pickerButtonText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pickerButtonDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  actionButton: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  selectedPickerItem: {
    backgroundColor: colors.primary + '10',
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: colors.primary,
    fontWeight: '600',
  },
  pickerItemDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default ProfileEditScreen;