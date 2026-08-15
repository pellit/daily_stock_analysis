import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { formatUiText, UI_TEXT, type UiLanguage, type UiTextKey, type UiTextParams } from '../i18n/uiText';

type UiLanguageContextValue = {
  /**
   * The UI is English-only. The `language` field still exists for backward
   * compatibility with consumers that destructure it; it always reads `'en'`.
   * Will be removed in Step B once all call sites are migrated.
   */
  language: UiLanguage;
  /**
   * @deprecated No-op kept for backward compatibility. The UI is English-only.
   */
  setLanguage: (language: UiLanguage) => void;
  t: (key: UiTextKey, params?: UiTextParams) => string;
};

const fallbackContext: UiLanguageContextValue = {
  language: 'en',
  setLanguage: () => undefined,
  t: (key, params) => formatUiText(UI_TEXT[key], params),
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export const UiLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pin language to English unconditionally. The legacy zh table is no longer
  // reachable at runtime; consumers always read English strings.
  const setLanguage = useCallback((_nextLanguage: UiLanguage) => undefined, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  }, []);

  const value = useMemo<UiLanguageContextValue>(() => ({
    language: 'en',
    setLanguage,
    t: (key, params) => formatUiText(UI_TEXT[key], params),
  }), [setLanguage]);

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- useUiLanguage is a hook, co-located for context access
export function useUiLanguage(): UiLanguageContextValue {
  return useContext(UiLanguageContext) ?? fallbackContext;
}
