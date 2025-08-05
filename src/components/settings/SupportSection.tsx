import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';

interface SupportSectionProps {
  onOpenLink: (url: string, title: string) => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({ onOpenLink }) => {
  return (
    <>
      {/* Privacy & Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Legal</Text>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => onOpenLink('https://example.com/privacy', 'Privacy Policy')}
            >
              <MaterialIcons name="privacy-tip" size={20} color={colors.primary} />
              <Text style={styles.linkText}>Privacy Policy</Text>
              <MaterialIcons name="open-in-new" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => onOpenLink('https://example.com/terms', 'Terms of Service')}
            >
              <MaterialIcons name="article" size={20} color={colors.primary} />
              <Text style={styles.linkText}>Terms of Service</Text>
              <MaterialIcons name="open-in-new" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* Support & Help */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Help</Text>
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => onOpenLink('mailto:support@calorietracker.com', 'Contact Support')}
            >
              <MaterialIcons name="support" size={20} color={colors.primary} />
              <Text style={styles.linkText}>Contact Support</Text>
              <MaterialIcons name="email" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => onOpenLink('https://apps.apple.com/app/id123456789', 'Rate the App')}
            >
              <MaterialIcons name="star-rate" size={20} color={colors.primary} />
              <Text style={styles.linkText}>Rate the App</Text>
              <MaterialIcons name="open-in-new" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  linkText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    flex: 1,
  },
});

export default SupportSection; 