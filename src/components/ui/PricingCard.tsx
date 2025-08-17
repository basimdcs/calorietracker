import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '../../constants/theme';
import { Card } from './Card';
import { SubscriptionPlan, SubscriptionTier } from '../../types';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentTier: SubscriptionTier;
  onSelect: (tier: SubscriptionTier) => void;
  disabled?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  currentTier = 'FREE',
  onSelect,
  disabled = false,
}) => {
  const isCurrentPlan = plan.tier === currentTier;
  const isUpgrade = plan.tier !== 'FREE' && currentTier === 'FREE';
  const isDowngrade = plan.tier === 'FREE' && currentTier !== 'FREE';
  
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

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (isUpgrade) return 'Upgrade';
    if (isDowngrade) return 'Downgrade';
    return 'Switch Plan';
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) return [styles.actionButton, styles.currentButton];
    if (isUpgrade) return [styles.actionButton, styles.upgradeButton];
    return [styles.actionButton, styles.defaultButton];
  };

  const getButtonTextStyle = () => {
    if (isCurrentPlan) return styles.currentButtonText;
    if (isUpgrade) return styles.upgradeButtonText;
    return styles.defaultButtonText;
  };

  const formatRecordingLimit = () => {
    return `${plan.monthlyRecordingLimit} recordings per month`;
  };

  return (
    <Card style={[
      styles.card,
      plan.popular && styles.popularCard,
      isCurrentPlan && styles.currentCard
    ]}>
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.tierInfo}>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(plan.tier) }]}>
            <MaterialIcons 
              name={getTierIcon(plan.tier)} 
              size={20} 
              color={colors.white} 
            />
          </View>
          <Text style={styles.tierName}>{plan.name}</Text>
        </View>
        
        <View style={styles.priceInfo}>
          {plan.monthlyPrice === 0 ? (
            <Text style={styles.freePrice}>Free</Text>
          ) : (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{plan.monthlyPrice}</Text>
              <View style={styles.priceDetails}>
                <Text style={styles.currency}>{plan.currency}</Text>
                <Text style={styles.priceLabel}>per month</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.recordingLimit}>{formatRecordingLimit()}</Text>
        
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialIcons 
                name="check-circle" 
                size={16} 
                color={getTierColor(plan.tier)} 
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={getButtonStyle()}
          onPress={() => !isCurrentPlan && !disabled && onSelect(plan.tier)}
          disabled={isCurrentPlan || disabled}
        >
          {isCurrentPlan && (
            <MaterialIcons name="check" size={20} color={colors.textSecondary} />
          )}
          {isUpgrade && (
            <MaterialIcons name="upgrade" size={20} color={colors.white} />
          )}
          <Text style={getButtonTextStyle()}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currentCard: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.green50,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    alignItems: 'center',
  },
  popularText: {
    fontSize: fonts.xs,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  freePrice: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.success,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  price: {
    fontSize: fonts['2xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  priceDetails: {
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  priceLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  content: {
    gap: spacing.lg,
  },
  recordingLimit: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
  },
  upgradeButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.white,
  },
  currentButton: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  currentButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  defaultButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  defaultButtonText: {
    fontSize: fonts.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});