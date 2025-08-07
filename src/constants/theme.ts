export const colors = {
  // Brand palette (friendlier violet + mint)
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',

  // Secondary palette (kept for accents when needed)
  secondary: '#EC4899',
  secondaryLight: '#F472B6',
  secondaryDark: '#DB2777',

  // Accent colors (mint)
  accent: '#22C55E',
  accentLight: '#34D399',
  accentDark: '#16A34A',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1F2937',
  gray900: '#0F172A',

  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Component variants
  blue50: '#EFF6FF',
  blue200: '#BFDBFE',
  yellow50: '#FFFBEB',
  yellow200: '#FDE68A',
  red50: '#FEF2F2',
  green50: '#F0FDF4',

  // Backgrounds (softer, less corporate)
  background: '#FAFAFF',
  backgroundSecondary: '#F6F7FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4FA',

  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
};

export const fonts = {
  // Font families
  primary: 'System',
  secondary: 'System',

  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,

  // Font weights
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 64,
  '6xl': 72,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const components = {
  button: {
    height: { small: 32, medium: 40, large: 48 },
    paddingHorizontal: { small: 12, medium: 16, large: 20 },
    borderRadius: borderRadius.md,
  },
  card: {
    padding: { none: 0, small: spacing.sm, medium: spacing.md, large: spacing.lg },
    borderRadius: borderRadius.lg,
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
};

export const layout = {
  screenPadding: spacing.md,
  sectionSpacing: spacing.lg,
  containerMaxWidth: 400,
};

export default { colors, fonts, spacing, borderRadius, shadows, components, layout }; 