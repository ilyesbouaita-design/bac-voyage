import { useState, useCallback, useEffect } from "react";
import {
  type Locale,
  translations,
  type Translations,
  getDirection,
  getSavedLocale,
  saveLocale,
} from "./i18n";

/**
 * Hook that provides the current locale, translation strings, text direction,
 * and a function to switch languages.
 *
 * Updates <html lang> and <html dir> attributes on switch.
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale);

  const t: Translations = translations[locale];
  const dir = getDirection(locale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = getDirection(next);
  }, []);

  // Sync HTML attributes on mount
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return { locale, t, dir, setLocale } as const;
}
