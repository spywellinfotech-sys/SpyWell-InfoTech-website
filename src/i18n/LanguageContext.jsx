import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ui } from './ui';

const STORAGE_KEY = 'spywell-lang';
const LanguageContext = createContext(null);

function readInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    /* storage unavailable */
  }
  return 'en'; // English is the default
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = useCallback((next) => {
    if (next !== 'en' && next !== 'hi') return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    // t('nav.home') -> UI string for current language (falls back to English)
    const t = (path) => {
      const get = (dict) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);
      const v = get(ui[lang]);
      return v === undefined ? get(ui.en) ?? path : v;
    };
    // tr({ en, hi }) -> picks the current language from a bilingual content object
    const tr = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : obj[lang] ?? obj.en ?? '');
    return { lang, setLang, t, tr };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
