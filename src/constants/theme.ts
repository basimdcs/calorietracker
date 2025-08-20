import { Platform } from 'react-native';

export const colors = {
  // Brand Avocado Colors - Official brand palette (darkened for better contrast)
  primary: '#228F3A',        // Darker outer skin green
  primaryLight: '#89C555',   // Darker avocado flesh
  primaryDark: '#1A7A33',    // Darker leaf green
  primary50: '#F0F9ED',      // Very light avocado backgrounds
  primary100: '#DCF2D4',     // Light avocado backgrounds
  primary200: '#B8E5A8',     // Soft avocado accents
  primary300: '#4FCC75',     // Darker wave gradient high
  primary400: '#2AB852',     // Darker wave gradient mid
  primary500: '#228F3A',     // Primary base (Darker outer skin green)
  primary600: '#1A7A33',     // Leaf green (darker accent)
  primary700: '#156829',     // Primary dark
  primary800: '#0F5221',     // Deep avocado
  primary900: '#0A3D18',     // Darkest avocado
  
  // Brand specific colors (darkened)
  brandOuterSkin: '#228F3A',    // Darker outer skin green
  brandFlesh: '#89C555',        // Darker avocado flesh
  brandLeaf: '#1A7A33',         // Darker leaf green
  brandWaveHigh: '#4FCC75',     // Darker wave gradient high
  brandWaveMid: '#2AB852',      // Darker wave gradient mid

  // Zesty Orange secondary palette
  secondary: '#FFB347',      // Zesty Orange - main secondary color
  secondaryLight: '#FFCC80', // Lighter orange
  secondaryDark: '#FF8F00',  // Darker orange
  
  // Fresh Orange accent palette
  accent: '#FFB347',         // Zesty Orange for secondary actions
  accentLight: '#FFCC80',    // Lighter orange
  accentDark: '#FF8F00',     // Darker orange
  accent50: '#FFF8E1',       // Very light orange
  accent100: '#FFECB3',      // Light orange backgrounds
  accent200: '#FFE082',      // Soft orange
  accent300: '#FFD54F',      // Medium orange
  accent400: '#FFCC02',      // Orange medium-light
  accent500: '#FFB347',      // Accent base (Zesty Orange)
  accent600: '#FF8F00',      // Orange dark
  accent700: '#FF6F00',      // Deep orange
  accent800: '#E65100',      // Darker orange
  accent900: '#BF360C',      // Darkest orange

  // Comprehensive Neutral Gray palette
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',         // Lightest gray
  gray100: '#F5F5F5',        // Very light gray
  gray200: '#EEEEEE',        // Light gray borders
  gray300: '#E0E0E0',        // Medium light gray
  gray400: '#BDBDBD',        // Medium gray
  gray500: '#9E9E9E',        // Base gray
  gray600: '#757575',        // Secondary text gray
  gray700: '#616161',        // Dark gray
  gray800: '#424242',        // Primary text gray
  gray900: '#212121',        // Darkest gray

  // Health-aligned Status colors
  success: '#228F3A',        // Use darker brand outer skin green for success
  successLight: '#2AB852',   // Darker wave gradient mid for light success
  successDark: '#1A7A33',    // Darker leaf green for dark success
  warning: '#FF9800',        // Amber for moderation/warnings
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  error: '#F44336',          // Red for critical actions
  errorLight: '#E57373',
  errorDark: '#D32F2F',
  info: '#2196F3',           // Blue for informational
  infoLight: '#64B5F6',
  infoDark: '#1976D2',

  // Health-themed surface colors
  background: '#FAFAFA',           // Very light gray background
  backgroundSecondary: '#F5F5F5',  // Light gray secondary background
  surface: '#FFFFFF',              // White surface for cards
  surfaceSecondary: '#F9F9F9',     // Off-white secondary surface
  surfaceElevated: '#FFFFFF',      // Elevated surface (same as surface)

  // Optimized text colors for health theme
  textPrimary: '#000000',          // Pure black for better contrast
  textSecondary: '#424242',        // Darker gray for secondary text
  textTertiary: '#757575',         // Medium gray for tertiary text
  textOnPrimary: '#FFFFFF',        // White text on primary green
  textOnSecondary: '#FFFFFF',      // White text on orange secondary
  textOnAccent: '#FFFFFF',         // White text on orange accent
  textOnSurface: '#000000',        // Pure black text on white surfaces

  // Health-specific semantic colors
  nutritionProtein: '#FF8A65',     // Salmon for protein
  nutritionCarbs: '#FFB74D',       // Golden for carbohydrates  
  nutritionFat: '#89C555',         // Darker brand flesh color for healthy fats
  nutritionFiber: '#2AB852',       // Darker wave gradient mid for fiber
  caloriesBurn: '#FF7043',         // Orange-red for calories burned
  caloriesConsumed: '#228F3A',     // Darker brand outer skin for consumed

  // Meal category colors (avocado green-orange theme)
  mealBreakfast: '#FFF8E1',        // Light yellow for breakfast
  mealLunch: '#F0F9ED',            // Light avocado for lunch  
  mealDinner: '#FFF3E0',           // Light orange for dinner
  mealSnacks: '#F0F9ED',           // Very light avocado for snacks

  // Gradient definitions - Brand color gradients (darkened)
  gradients: {
    primary: ['#89C555', '#228F3A'],           // Darker brand flesh to outer skin
    secondary: ['#FFCC80', '#FFB347'],         // Orange gradient
    accent: ['#FFCC80', '#FFB347'],            // Orange gradient  
    success: ['#2AB852', '#228F3A'],           // Darker wave gradient to outer skin
    calorie: ['#89C555', '#228F3A'],           // Darker brand flesh to outer skin
    energetic: ['#FFB347', '#FF8F00'],         // Vibrant orange gradient
    fresh: ['#4FCC75', '#2AB852'],             // Darker wave gradient high to mid
    background: ['#F5F5F5', '#F0F0F0'],        // Subtle background gradient
    brandWave: ['#2AB852', '#4FCC75'],         // Darker wave gradient progression
    brandFull: ['#89C555', '#2AB852', '#228F3A'], // Darker full brand spectrum
    onboarding: ['#89C555', '#4FCC75'],        // Darker onboarding specific gradient
  },
};

export const fonts = {
  // Font families - Inter fonts from @expo-google-fonts
  primary: 'Inter_400Regular',      // Inter Regular
  heading: 'Inter_500Medium',       // Inter Medium for headings
  body: 'Inter_400Regular',         // Inter Regular for body text
  
  // Font size scale
  xs: 12,        // Caption text, small labels
  sm: 14,        // Secondary text, form labels
  base: 16,      // Body text, default size
  lg: 18,        // Large body text, subtitles
  xl: 20,        // Small headings, important text
  '2xl': 24,     // Medium headings
  '3xl': 30,     // Large headings
  '4xl': 36,     // Display headings
  '5xl': 48,     // Hero text
  '6xl': 60,     // Extra large display

  // Font weights - Google Sans optimized
  light: '300' as const,       // Light for subtle text
  normal: '400' as const,      // Regular for body text (Google Sans Regular)
  medium: '500' as const,      // Medium for emphasis (Google Sans Medium)
  semibold: '600' as const,    // Semibold for strong emphasis
  bold: '700' as const,        // Bold for headings
  extrabold: '800' as const,   // Extra bold for display
  
  // Line heights for better readability
  lineHeights: {
    tight: 1.2,    // For headings
    normal: 1.5,   // For body text
    relaxed: 1.7,  // For longer content
  },
  
  // Font styles using Inter fonts from @expo-google-fonts
  styles: {
    h1: { fontSize: 30, fontFamily: 'Inter_500Medium', lineHeight: 36 },
    h2: { fontSize: 24, fontFamily: 'Inter_500Medium', lineHeight: 30 },
    h3: { fontSize: 20, fontFamily: 'Inter_500Medium', lineHeight: 26 },
    h4: { fontSize: 18, fontFamily: 'Inter_500Medium', lineHeight: 24 },
    body: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24 },
    bodySmall: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    caption: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
    button: { fontSize: 16, fontFamily: 'Inter_500Medium', lineHeight: 20 },
    label: { fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  },
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
  xs: 2,        // Very small radius for subtle rounding
  sm: 6,        // Small radius for buttons, inputs
  md: 12,       // Medium radius for cards (matches screenshot)
  lg: 16,       // Large radius for prominent cards
  xl: 20,       // Extra large for special containers
  '2xl': 24,    // Very large radius
  '3xl': 28,    // Calendar widget style
  '4xl': 32,    // Large feature cards
  full: 9999,   // Perfect circles
};

export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  // Subtle shadows matching the screenshot aesthetic
  subtle: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowColor: '#000000',
    elevation: 1,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowColor: '#000000',
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowColor: '#000000',
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowColor: '#000000',
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    shadowColor: '#000000',
    elevation: 12,
  },
  // Health-themed shadows with fresh green and orange tints
  primary: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowColor: '#58BA47',
    elevation: 6,
  },
  secondary: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowColor: '#FFB347',
    elevation: 6,
  },
  accent: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowColor: '#FFB347',
    elevation: 6,
  },
};

export const components = {
  button: {
    height: { small: 32, medium: 40, large: 48 },
    paddingHorizontal: { small: 12, medium: 16, large: 20 },
    borderRadius: borderRadius.sm,  // Slightly rounded buttons
  },
  card: {
    padding: { none: 0, small: spacing.sm, medium: spacing.md, large: spacing.lg },
    borderRadius: borderRadius.md,  // 12px radius matching screenshot
  },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,  // Consistent with buttons
    borderWidth: 1,
  },
  // New component styles inspired by screenshot
  widget: {
    borderRadius: borderRadius.lg,  // 16px for larger widgets
    padding: spacing.lg,
  },
  navigationTab: {
    borderRadius: borderRadius.sm,  // Subtle rounding for tabs
  },
  progressRing: {
    borderRadius: borderRadius.full,  // Perfect circles
  },
  foodItem: {
    borderRadius: borderRadius.md,  // 12px matching cards
    padding: spacing.md,
  },
};

export const layout = {
  screenPadding: spacing.md,
  sectionSpacing: spacing.lg,
  containerMaxWidth: 400,
};

export default { colors, fonts, spacing, borderRadius, shadows, components, layout }; 