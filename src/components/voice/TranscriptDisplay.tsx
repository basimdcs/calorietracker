import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTLStyles } from '../../utils/rtl';

interface TranscriptDisplayProps {
  transcript: string;
  isVisible: boolean;
  onEdit?: () => void;
  onClear?: () => void;
  isProcessing?: boolean;
  processingProgress?: number;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  isVisible,
  onEdit,
  onClear,
  isProcessing = false,
  processingProgress = 0,
}) => {
  const { t } = useTranslation();
  const { rtlText, rtlRow } = useRTLStyles();

  if (!isVisible || !transcript.trim()) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Centered Transcript Text */}
      <Text style={[styles.transcriptText, rtlText]}>
        {transcript}
      </Text>

      {/* Processing State */}
      {isProcessing && (
        <>
          <Text style={[styles.processingText, rtlText]}>
            {t('voice.analyzingMeal')}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, processingProgress)}%` }]} />
          </View>
        </>
      )}

      {/* Action Buttons */}
      {!isProcessing && (
        <View style={[styles.buttonsRow, rtlRow]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClear}>
            <Text style={[styles.cancelButtonText, rtlText]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={[styles.editButtonText, rtlText]}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  transcriptText: {
    fontSize: fonts.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fonts.lg * 1.5,
  },
  processingText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.success,
  },
});
