import { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

const EVENT = 'open-studio-promo';
export const openStudio = () => window.dispatchEvent(new Event(EVENT));

// Popup that shows the SpyWell Live Studio promo page inside the site.
export default function StudioModal() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  const src = `/studio/promo/?lang=${lang === 'hi' ? 'hi' : 'en'}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/70 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="SpyWell Live Studio" onClick={() => setOpen(false)}>
      <div className="flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[88vh] sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-navy-100 px-4 py-2.5">
          <b className="font-display text-navy-800">SpyWell Live Studio</b>
          <div className="flex items-center gap-2">
            <a href="/studio/promo/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
              <ExternalLink size={15} aria-hidden="true" /> {t('studio.newTab')}
            </a>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('studio.close')} className="rounded-md p-2 text-navy-800 hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500">
              <X size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
        <iframe title="SpyWell Live Studio" src={src} className="w-full flex-1 border-0" loading="lazy" />
        <div className="border-t border-navy-100 p-3 text-center">
          <a href="/studio/" className="inline-flex rounded-full bg-electric-500 px-7 py-2.5 font-bold text-white hover:bg-electric-600">{t('studio.create')}</a>
        </div>
      </div>
    </div>
  );
}
