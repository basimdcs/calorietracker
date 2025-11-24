import { useLanguageContext } from '../contexts/LanguageContext';

/**
 * Hook to access translation functionality
 *
 * Uses LanguageContext to ensure reactive updates across all components
 * when language changes.
 *
 * @returns {Object} Translation utilities
 * @returns {Function} t - Translation function: t(key, options)
 * @returns {string} currentLanguage - Current language code ('en' | 'ar')
 * @returns {Function} changeLanguage - Change language: changeLanguage('ar')
 * @returns {boolean} isRTL - Whether current language is RTL
 * @returns {string} activeLanguage - Alias for currentLanguage (backward compatibility)
 */
export const useTranslation = () => {
  const { state, actions } = useLanguageContext();

  return {
    t: actions.t,
    currentLanguage: state.currentLanguage,
    activeLanguage: state.currentLanguage, // Alias for backward compatibility
    changeLanguage: actions.changeLanguage,
    isRTL: state.isRTL,
  };
};
