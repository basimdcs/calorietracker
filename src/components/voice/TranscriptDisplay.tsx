import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';
import { Card } from '../ui/Card';

interface TranscriptDisplayProps {
  transcript: string;
  isVisible: boolean;
  onEdit?: () => void;
  onClear?: () => void;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  isVisible,
  onEdit,
  onClear,
}) => {
  if (!isVisible || !transcript.trim()) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="volume-up" size={20} color={colors.secondary} />
          <Text style={styles.headerTitle}>What you said</Text>
        </View>
        <View style={styles.headerActions}>
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              accessibilityLabel="Edit transcript"
              accessibilityRole="button"
            >
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onClear && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onClear}
              accessibilityLabel="Clear transcript"
              accessibilityRole="button"
            >
              <MaterialIcons name="clear" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.transcriptContainer}>
        <Text 
          style={styles.transcriptText}
          accessibilityLabel={`Transcript: ${transcript}`}
          accessibilityRole="text"
        >
          {transcript}
        </Text>
      </View>

      {/* Quality indicator */}
      <View style={styles.qualityIndicator}>
        <View style={styles.qualityDot} />
        <Text style={styles.qualityText}>
          Transcription completed
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.gray50,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  transcriptText: {
    fontSize: fonts.base,
    color: colors.textPrimary,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qualityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  qualityText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});