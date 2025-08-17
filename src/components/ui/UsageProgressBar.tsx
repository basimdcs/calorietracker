import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { UsageStats } from '../../types';

interface UsageProgressBarProps {
  usageStats: UsageStats;
  showText?: boolean;
  height?: number;
  style?: any;
}

export const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  usageStats,
  showText = true,
  height = 8,
  style,
}) => {
  const getProgressColor = () => {
    const percentage = usageStats.usagePercentage;
    if (percentage >= 90) return colors.error;
    if (percentage >= 75) return colors.warning;
    return colors.primary;
  };

  const formatUsageText = () => {
    return `${usageStats.recordingsUsed} / ${usageStats.monthlyLimit} recordings used`;
  };

  const formatRemainingText = () => {
    if (usageStats.recordingsRemaining === 0) {
      return 'Limit reached';
    }
    
    return `${usageStats.recordingsRemaining} remaining`;
  };

  const getResetDateText = () => {
    const resetDate = new Date(usageStats.resetDate);
    const now = new Date();
    
    // Calculate days until next reset (next month)
    const nextReset = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, resetDate.getDate());
    const daysUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilReset <= 1) {
      return 'Resets tomorrow';
    } else if (daysUntilReset <= 7) {
      return `Resets in ${daysUntilReset} days`;
    } else {
      return `Resets on ${nextReset.toLocaleDateString()}`;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.usageText}>{formatUsageText()}</Text>
          <Text style={[
            styles.remainingText,
            usageStats.recordingsRemaining === 0 && styles.limitReachedText
          ]}>
            {formatRemainingText()}
          </Text>
        </View>
      )}
      
      <View style={[styles.progressBarContainer, { height }]}>
        <View style={[styles.progressBar, { height }]}>
          {usageStats.monthlyLimit !== null && (
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, usageStats.usagePercentage)}%`,
                  backgroundColor: getProgressColor(),
                  height
                }
              ]} 
            />
          )}
        </View>
      </View>

      {showText && (
        <View style={styles.resetContainer}>
          <Text style={styles.resetText}>{getResetDateText()}</Text>
          <Text style={styles.percentageText}>
            {usageStats.monthlyLimit === null ? '∞' : `${Math.round(usageStats.usagePercentage)}%`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  remainingText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.sm,
  },
  limitReachedText: {
    color: colors.error,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: borderRadius.sm,
    transition: 'width 0.3s ease-in-out',
  },
  resetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  percentageText: {
    fontSize: fonts.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});