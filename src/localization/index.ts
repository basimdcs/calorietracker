import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import ar from './locales/ar';

const LANGUAGE_KEY = '@app_language';

// Create i18n instance
const i18n = new I18n({
  en,
  ar,
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Load saved language or detect from device
export const initializeI18n = async (): Promise<string> => {
  try {
    // Check for saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      i18n.locale = savedLanguage;
      return savedLanguage;
    }

    // No saved preference, detect from device
    const deviceLocale = Localization.locale;

    // Check if device language is Arabic
    if (deviceLocale.startsWith('ar')) {
      i18n.locale = 'ar';
      await AsyncStorage.setItem(LANGUAGE_KEY, 'ar');
      return 'ar';
    }

    // Default to English
    i18n.locale = 'en';
    await AsyncStorage.setItem(LANGUAGE_KEY, 'en');
    return 'en';
  } catch (error) {
    if (__DEV__) {
    console.error('Error initializing i18n:', error);
    }
    i18n.locale = 'en';
    return 'en';
  }
};

// Change language
// Note: This is a low-level utility. For app-wide language changes,
// use the LanguageContext which handles RTL updates and app reloads.
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  try {
    i18n.locale = language;
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    if (__DEV__) {
    console.error('Error changing language:', error);
    }
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

// Translation function
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return i18n.locale === 'ar';
};

// Get text alignment based on RTL
export const getTextAlign = (override?: 'left' | 'right' | 'center'): 'left' | 'right' | 'center' => {
  if (override === 'center') return 'center';
  if (override) return override;
  return isRTL() ? 'right' : 'left';
};

// RTL-aware style helper
export const rtlStyle = (ltrStyle: any, rtlStyle: any) => {
  return isRTL() ? rtlStyle : ltrStyle;
};

// Helper to add RTL text alignment to a style object
export const rtlText = (baseStyle?: any) => {
  return [baseStyle, { textAlign: isRTL() ? 'right' : 'left' }];
};

export default i18n;
