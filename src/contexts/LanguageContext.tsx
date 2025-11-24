import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { initializeI18n, changeLanguage as changeLangInI18n, getCurrentLanguage, t, isRTL as getIsRTL } from '../localization';

// Try to import react-native-restart if available
let RNRestart: any = null;
try {
  RNRestart = require('react-native-restart');
} catch (e) {
  // react-native-restart not available, will use alternative method
  if (__DEV__) {
    console.log('ℹ️ react-native-restart not available, will prompt manual restart');
  }
}

type Language = 'en' | 'ar';

interface LanguageContextState {
  currentLanguage: Language;
  isRTL: boolean;
  isInitialized: boolean;
}

interface LanguageContextActions {
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: string, options?: any) => string;
}

interface LanguageContextValue {
  state: LanguageContextState;
  actions: LanguageContextActions;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load saved language preference from AsyncStorage
        const savedLanguage = await initializeI18n();
        const isArabic = savedLanguage === 'ar';

        setCurrentLanguage(savedLanguage as Language);
        setIsRTL(isArabic);

        // Ensure I18nManager is set correctly for the saved language
        I18nManager.forceRTL(isArabic);
        I18nManager.allowRTL(isArabic);

        setIsInitialized(true);

        if (__DEV__) {
          console.log('✅ Language initialized:', savedLanguage, 'RTL:', isArabic);
          console.log('📱 I18nManager.isRTL:', I18nManager.isRTL);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error initializing language:', error);
        }
        // Fallback to English
        setCurrentLanguage('en');
        setIsRTL(false);
        I18nManager.forceRTL(false);
        I18nManager.allowRTL(false);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // Change language function
  const changeLanguage = async (newLanguage: Language) => {
    if (newLanguage === currentLanguage) {
      return; // No change needed
    }

    try {
      // Update i18n locale and save to AsyncStorage
      await changeLangInI18n(newLanguage);

      // Check if RTL direction needs to change
      const newIsRTL = newLanguage === 'ar';
      const rtlChanged = isRTL !== newIsRTL;

      if (rtlChanged) {
        // RTL direction changed - need to reload app
        I18nManager.forceRTL(newIsRTL);
        I18nManager.allowRTL(newIsRTL);

        if (__DEV__) {
          console.log('🔄 RTL direction changed, reloading app...');
        }

        // Try to reload the app
        try {
          if (Updates.isEnabled) {
            // Production build with Expo Updates
            await Updates.reloadAsync();
          } else if (RNRestart && RNRestart.default) {
            // Development build - try RNRestart if available
            try {
              RNRestart.default.restart();
            } catch (restartError) {
              if (__DEV__) {
                console.log('⚠️ RNRestart failed, showing manual restart alert');
              }
              // RNRestart failed, show manual restart alert
              Alert.alert(
                t('settings.pleaseRestart'),
                t('settings.pleaseRestartMessage'),
                [{ text: t('common.ok') }]
              );
            }
          } else {
            // RNRestart not available, show manual restart alert
            if (__DEV__) {
              console.log('ℹ️ Automatic restart not available, prompting manual restart');
            }
            Alert.alert(
              t('settings.pleaseRestart'),
              t('settings.pleaseRestartMessage'),
              [{ text: t('common.ok') }]
            );
          }
        } catch (reloadError) {
          if (__DEV__) {
            console.error('❌ Error reloading app:', reloadError);
          }
          // Show manual restart alert as fallback
          Alert.alert(
            t('settings.pleaseRestart'),
            t('settings.pleaseRestartMessage'),
            [{ text: t('common.ok') }]
          );
        }
      } else {
        // Same direction - just update state (instant switch, no reload)
        setCurrentLanguage(newLanguage);
        setIsRTL(newIsRTL);

        if (__DEV__) {
          console.log('✅ Language changed to:', newLanguage, '(no reload needed)');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error changing language:', error);
      }
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.'
      );
    }
  };

  // Translation function
  const translate = (key: string, options?: any): string => {
    return t(key, options);
  };

  const contextValue: LanguageContextValue = {
    state: {
      currentLanguage,
      isRTL,
      isInitialized,
    },
    actions: {
      changeLanguage,
      t: translate,
    },
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use LanguageContext
export const useLanguageContext = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};
