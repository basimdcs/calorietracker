import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { useTranslation } from '../../hooks/useTranslation';
import { useRTLStyles } from '../../utils/rtl';

interface ProcessingStatusProps {
  state: 'transcribing' | 'parsing';
  progress?: number;
  transcriptionMethod?: 'whisper' | 'gpt4o';
  parsingMethod?: 'gpt4o' | 'gpt5';
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  state,
  progress = 0,
  transcriptionMethod = 'whisper',
  parsingMethod = 'gpt4o',
}) => {
  const { t } = useTranslation();
  const { rtlText } = useRTLStyles();

  const getStatusText = () => {
    switch (state) {
      case 'transcribing':
        return t('voice.transcribing');
      case 'parsing':
        return t('voice.parsingFood');
      default:
        return t('voice.processing');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, rtlText]}>{getStatusText()}</Text>
      </View>
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
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  statusText: {
    fontSize: fonts.base,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});