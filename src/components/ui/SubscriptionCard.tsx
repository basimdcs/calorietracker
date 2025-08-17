import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { Card } from './Card';
import { SubscriptionTier } from '../../types';
import { SubscriptionStatus, UsageInfo } from '../../hooks/useRevenueCat';

interface SubscriptionCardProps {
  subscriptionStatus: SubscriptionStatus;
  usageInfo: UsageInfo;
  isLoading?: boolean;
  onUpgrade?: () => void;
  onManage?: () => void;
  onRestore?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscriptionStatus,
  usageInfo,
  isLoading = false,
  onUpgrade,
  onManage,
  onRestore,
}) => {
  
  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return colors.gray500;
      case 'PRO':
        return colors.primary;
      default:
        return colors.gray500;
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return 'free-cancellation';
      case 'PRO':
        return 'star';
      default:
        return 'free-cancellation';
    }
  };

  const getTierDisplayName = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'FREE':
        return 'Free Plan';
      case 'PRO':
        return 'Pro Plan';
      case 'ELITE':
        return 'Elite Plan';
      default:
        return 'Unknown Plan';
    }
  };

  const getStatusColor = (isActive: boolean, isInGracePeriod: boolean) => {
    if (isActive) return colors.success;
    if (isInGracePeriod) return colors.warning;
    return colors.error;
  };

  const getStatusText = (status: SubscriptionStatus) => {
    if (status.isActive) return 'ACTIVE';
    if (status.isInGracePeriod) return 'GRACE PERIOD';
    return 'INACTIVE';
  };

  const formatUsageText = () => {
    if (!usageInfo) {
      return 'No usage data available';
    }
    
    return `${usageInfo.recordingsUsed} / ${usageInfo.recordingsLimit} recordings used`;
  };

  const getUsagePercentage = () => {
    if (!usageInfo || !usageInfo.recordingsLimit) return 0;
    return Math.min(100, (usageInfo.recordingsUsed / usageInfo.recordingsLimit) * 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return colors.error;
    if (percentage >= 75) return colors.warning;
    return colors.primary;
  };

  const canUpgrade = subscriptionStatus.tier === 'FREE' || subscriptionStatus.tier === 'PRO';

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tierInfo}>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(subscriptionStatus.tier) }]}>
            <MaterialIcons 
              name={getTierIcon(subscriptionStatus.tier)} 
              size={16} 
              color={colors.white} 
            />
            <Text style={styles.tierText}>{getTierDisplayName(subscriptionStatus.tier)}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(subscriptionStatus.isActive, subscriptionStatus.isInGracePeriod) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(subscriptionStatus)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.usageSection}>
          <Text style={styles.usageTitle}>Voice Recordings This Month</Text>
          <Text style={styles.usageText}>{formatUsageText()}</Text>
          
          {usageInfo && usageInfo.recordingsLimit !== null && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage()}%`,
                      backgroundColor: getUsageColor()
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {usageInfo.recordingsRemaining} remaining
              </Text>
            </View>
          )}
          
          {subscriptionStatus.expirationDate && (
            <Text style={styles.expirationText}>
              {subscriptionStatus.willRenew 
                ? `Renews on ${subscriptionStatus.expirationDate.toLocaleDateString()}`
                : `Expires on ${subscriptionStatus.expirationDate.toLocaleDateString()}`
              }
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {canUpgrade && onUpgrade && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.upgradeButton]}
              onPress={onUpgrade}
            >
              <MaterialIcons name="upgrade" size={16} color={colors.white} />
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
          
          {subscriptionStatus.isActive && onManage && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.manageButton]}
              onPress={onManage}
            >
              <MaterialIcons name="settings" size={16} color={colors.primary} />
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
          
          {onRestore && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.restoreButton]}
              onPress={onRestore}
            >
              <MaterialIcons name="restore" size={16} color={colors.textSecondary} />
              <Text style={styles.restoreButtonText}>Restore</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fonts.base,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  tierText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.white,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.xs,
    fontWeight: '600',
    color: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  usageSection: {
    marginBottom: spacing.lg,
  },
  usageTitle: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  usageText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    minWidth: 80,
    textAlign: 'right',
  },
  expirationText: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  upgradeButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.white,
  },
  manageButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
  },
  manageButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  restoreButton: {
    backgroundColor: colors.gray100,
    flex: 1,
  },
  restoreButtonText: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});