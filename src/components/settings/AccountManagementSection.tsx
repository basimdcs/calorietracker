import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';

interface AccountManagementSectionProps {
  onResetProfile: () => void;
}

const AccountManagementSection: React.FC<AccountManagementSectionProps> = ({ onResetProfile }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Management</Text>
      <Card style={[styles.card, styles.dangerCard]}>
        <View style={styles.cardContent}>
          <Text style={styles.dangerDescription}>
            Resetting your profile will permanently delete all data.
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={onResetProfile}>
            <MaterialIcons name="warning" size={20} color={colors.error} />
            <Text style={styles.resetButtonText}>Reset Profile</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
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
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  dangerDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  resetButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.error,
  },
});

export default AccountManagementSection; 