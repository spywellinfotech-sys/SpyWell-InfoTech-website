import { useLang } from '../i18n/LanguageContext';

export default function LanguageSwitcher({ className = '', onRed = false }) {
  const { lang, setLang, t } = useLang();
  const btn = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      aria-label={code === 'en' ? 'English' : 'हिन्दी'}
      className={`px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
        lang === code
          ? onRed ? 'bg-white text-electric-600' : 'bg-electric-500 text-white'
          : onRed ? 'text-white hover:bg-white/15' : 'text-navy-700 hover:bg-navy-50'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t('nav.language')} className={`inline-flex overflow-hidden rounded-full border ${onRed ? 'border-white/50' : 'border-navy-100 bg-white'} ${className}`}>
      {btn('en', 'EN')}
      <span aria-hidden="true" className={`w-px ${onRed ? 'bg-white/50' : 'bg-navy-100'}`} />
      {btn('hi', 'HI')}
    </div>
  );
}
