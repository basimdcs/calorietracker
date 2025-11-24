/**
 * RTL (Right-to-Left) Utility Hooks
 *
 * Centralized utility for handling RTL layout and styling across the app.
 * This eliminates code duplication and ensures consistent RTL implementation.
 *
 * Based on RTL_ARABIC_CODING_RULES.md guidelines.
 */

import { useTranslation } from '../hooks/useTranslation';
import { ViewStyle, TextStyle } from 'react-native';

/**
 * Centralized RTL Styles Hook
 *
 * Provides reusable RTL style utilities to avoid duplication across components.
 *
 * @example
 * ```tsx
 * const { rtlText, rtlRow, rtlMarginRight, rtlIcon } = useRTLStyles();
 *
 * <Text style={[styles.text, rtlText]}>{t('key')}</Text>
 * <View style={[styles.container, rtlRow]}>...</View>
 * <View style={[styles.icon, rtlMarginRight(spacing.md)]}>...</View>
 * <MaterialIcons name={rtlIcon("chevron-left", "chevron-right")} />
 * ```
 */
export const useRTLStyles = () => {
  const { isRTL } = useTranslation();

  return {
    /**
     * Standard RTL text style
     *
     * IMPORTANT: Always use textAlign: 'left' for both LTR and RTL.
     * In RTL mode, CSS coordinates flip, so 'left' aligns to visual RIGHT.
     *
     * Apply this to ALL text elements.
     */
    rtlText: (isRTL
      ? { writingDirection: 'rtl' as const, textAlign: 'left' as const }
      : { writingDirection: 'ltr' as const, textAlign: 'left' as const }
    ) as TextStyle,

    /**
     * RTL-aware row flex direction
     *
     * Automatically reverses flex direction for RTL layouts.
     * Use this for all horizontal containers with icons + text.
     */
    rtlRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row'
    } as ViewStyle,

    /**
     * RTL-aware margin utility (for spacing to the right in LTR)
     *
     * Swaps marginRight/marginLeft based on direction.
     * Use when an element needs spacing on its right side in LTR.
     *
     * @param value - Margin value (e.g., spacing.md)
     * @example <View style={[styles.icon, rtlMarginRight(spacing.md)]}>
     */
    rtlMarginRight: (value: number): ViewStyle => ({
      marginRight: isRTL ? 0 : value,
      marginLeft: isRTL ? value : 0,
    }),

    /**
     * RTL-aware margin utility (for spacing to the left in LTR)
     *
     * Swaps marginLeft/marginRight based on direction.
     * Use when an element needs spacing on its left side in LTR.
     *
     * @param value - Margin value (e.g., spacing.md)
     * @example <View style={[styles.icon, rtlMarginLeft(spacing.md)]}>
     */
    rtlMarginLeft: (value: number): ViewStyle => ({
      marginLeft: isRTL ? 0 : value,
      marginRight: isRTL ? value : 0,
    }),

    /**
     * RTL-aware padding utility (for right padding in LTR)
     *
     * Swaps paddingRight/paddingLeft based on direction.
     */
    rtlPaddingRight: (value: number): ViewStyle => ({
      paddingRight: isRTL ? 0 : value,
      paddingLeft: isRTL ? value : 0,
    }),

    /**
     * RTL-aware padding utility (for left padding in LTR)
     *
     * Swaps paddingLeft/paddingRight based on direction.
     */
    rtlPaddingLeft: (value: number): ViewStyle => ({
      paddingLeft: isRTL ? 0 : value,
      paddingRight: isRTL ? value : 0,
    }),

    /**
     * RTL-aware icon name selector
     *
     * Automatically selects the appropriate icon based on direction.
     * Use for directional icons like arrows and chevrons.
     *
     * @param ltrIcon - Icon name for LTR (e.g., "arrow-forward")
     * @param rtlIcon - Icon name for RTL (e.g., "arrow-back")
     * @returns The appropriate icon name for current direction
     *
     * @example
     * <MaterialIcons name={rtlIcon("arrow-forward", "arrow-back")} />
     * <MaterialIcons name={rtlIcon("chevron-right", "chevron-left")} />
     */
    rtlIcon: (ltrIcon: string, rtlIcon: string): string =>
      isRTL ? rtlIcon : ltrIcon,

    /**
     * Current RTL state
     *
     * Direct access to isRTL boolean for custom logic.
     */
    isRTL,
  };
};

/**
 * Legacy helper functions for backwards compatibility
 *
 * DEPRECATED: Use useRTLStyles() hook instead for better performance.
 */

/**
 * @deprecated Use useRTLStyles().rtlText instead
 */
export const getRTLTextStyle = (isRTL: boolean): TextStyle =>
  isRTL
    ? { writingDirection: 'rtl' as const, textAlign: 'left' as const }
    : { writingDirection: 'ltr' as const, textAlign: 'left' as const };

/**
 * @deprecated Use useRTLStyles().rtlRow instead
 */
export const getRTLRowStyle = (isRTL: boolean): ViewStyle => ({
  flexDirection: isRTL ? 'row-reverse' : 'row'
});

/**
 * @deprecated Use useRTLStyles().rtlMarginRight() instead
 */
export const getRTLMargin = (isRTL: boolean, value: number): ViewStyle => ({
  marginRight: isRTL ? 0 : value,
  marginLeft: isRTL ? value : 0,
});
