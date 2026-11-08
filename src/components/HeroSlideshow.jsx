import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Icon from './Icon';
import SlideArt, { hasArt } from './SlideArt';
import { useLang } from '../i18n/LanguageContext';
import { services } from '../data/content';

// Hero slideshow: one slide per service (edit the services in src/data/content.js).
const palette = [
  'from-electric-500 to-electric-600',
  'from-navy-700 to-navy-900',
  'from-brand-teal to-navy-500',
  'from-electric-400 to-navy-700',
  'from-navy-500 to-electric-600',
  'from-brand-teal to-electric-600',
];
const slides = services.slice(0, 6).map((s, n) => ({ ...s, id: s.slug, bg: palette[n % palette.length] }));

export default function HeroSlideshow() {
  const { t, tr, lang } = useLang();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (paused || reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % slides.length), 4500);
    return () => clearInterval(id);
  }, [paused, reduce]);

  const go = (n) => setI((n + slides.length) % slides.length);

  return (
    <div
      className="relative mx-auto w-full max-w-sm"
      role="group"
      aria-roledescription="carousel"
      aria-label={lang === 'hi' ? 'हमारी सेवाएँ' : 'Our services'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl shadow-electric-500/20 ring-1 ring-navy-100">
        {slides.map((s, n) => {
          const active = n === i;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${n + 1} / ${slides.length}`}
              aria-hidden={!active}
              className={`absolute inset-0 flex flex-col bg-gradient-to-br ${s.bg} transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pt-6">
                <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
                <span className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10" />
                {hasArt(s.slug) ? (
                  <div className={`relative h-full max-h-60 w-full ${active ? 'animate-floaty' : ''}`}><SlideArt slug={s.slug} /></div>
                ) : (
                  <span className="relative inline-flex h-36 w-36 items-center justify-center rounded-[2rem] bg-white/15 text-white ring-1 ring-white/30">
                    <Icon name={s.icon} size={72} strokeWidth={1.5} />
                  </span>
                )}
              </div>
              <div className="px-6 pb-14 text-white">
                <h2 className="font-display text-2xl font-extrabold">{tr(s.title)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/90">{tr(s.short)}</p>
                <Link to={`/services#${s.slug}`} tabIndex={active ? 0 : -1} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-800 transition hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  {t('common.learnMore')} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}

        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
          {slides.map((s, n) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(n)}
              aria-label={`${tr(s.title)} (${n + 1}/${slides.length})`}
              aria-current={n === i}
              className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${n === i ? 'w-7 bg-white' : 'w-2.5 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      <button type="button" onClick={() => go(i - 1)} aria-label={lang === 'hi' ? 'पिछला' : 'Previous'} className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-800 shadow-lg ring-1 ring-navy-100 hover:text-electric-600 sm:inline-flex">
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => go(i + 1)} aria-label={lang === 'hi' ? 'अगला' : 'Next'} className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-800 shadow-lg ring-1 ring-navy-100 hover:text-electric-600 sm:inline-flex">
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
