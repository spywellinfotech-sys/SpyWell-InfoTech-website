import { useLang } from '../i18n/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useLang();
  const btn = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      aria-pressed={lang === code}
      aria-label={code === 'en' ? 'English' : 'हिन्दी'}
      className={`px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 ${
        lang === code ? 'bg-electric-500 text-white' : 'text-navy-700 hover:bg-navy-50'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t('nav.language')} className={`inline-flex overflow-hidden rounded-full border border-navy-100 bg-white ${className}`}>
      {btn('en', 'EN')}
      <span aria-hidden="true" className="w-px bg-navy-100" />
      {btn('hi', 'HI')}
    </div>
  );
}
