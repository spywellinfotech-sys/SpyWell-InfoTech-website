import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Building2, Contact, LayoutGrid, Landmark } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// Showcase slides for the home hero. Edit text here (en + hi).
const slides = [
  {
    id: 'padhai-pro',
    image: 'apps/padhai-pro.jpg',
    name: { en: 'Padhai Pro', hi: 'पढ़ाई प्रो' },
    text: { en: 'Learn, practice and grow: KG to Class 5 lessons and mock tests.', hi: 'सीखो, अभ्यास करो, आगे बढ़ो: KG से कक्षा 5 तक पाठ और मॉक टेस्ट।' },
    bg: 'from-navy-50 to-white',
  },
  {
    id: 'propdeal',
    Icon: Building2,
    name: { en: 'PropDeal', hi: 'प्रॉपडील' },
    text: { en: 'Property dealers manage listings and clients, and network with other dealers.', hi: 'प्रॉपर्टी डीलर लिस्टिंग और क्लाइंट संभालें और दूसरे डीलरों से जुड़ें।' },
    bg: 'from-electric-500 to-electric-600',
  },
  {
    id: 'followup',
    Icon: Contact,
    name: { en: 'FollowUp', hi: 'फॉलोअप' },
    text: { en: 'Your contact list with groups, one-tap call and WhatsApp, and follow-up reminders.', hi: 'ग्रुप, एक टैप में कॉल और व्हाट्सऐप, और फॉलो-अप रिमाइंडर वाली कॉन्टैक्ट लिस्ट।' },
    bg: 'from-brand-teal to-navy-500',
  },
  {
    id: 'iui',
    Icon: LayoutGrid,
    name: { en: 'iUi Launcher', hi: 'iUi लॉन्चर' },
    text: { en: 'A clean iOS-style home screen for Android with icon grid, dock and search.', hi: 'एंड्रॉइड के लिए साफ़ iOS जैसा होम स्क्रीन: आइकन ग्रिड, डॉक और सर्च।' },
    bg: 'from-navy-700 to-navy-900',
  },
  {
    id: 'smart-village',
    Icon: Landmark,
    name: { en: 'Smart Village', hi: 'मेरा गाँव' },
    text: { en: 'Villagers file complaints and read notices, while the panchayat stays connected.', hi: 'ग्रामवासी शिकायत दर्ज करें और सूचनाएँ पढ़ें, पंचायत जुड़ी रहे।' },
    bg: 'from-emerald-500 to-emerald-700',
  },
];

export default function HeroSlideshow() {
  const { tr, lang } = useLang();
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
      aria-label={lang === 'hi' ? 'हमारे ऐप' : 'Our apps'}
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
              <div className="flex flex-1 items-center justify-center p-8">
                {s.image ? (
                  <img src={`${import.meta.env.BASE_URL}${s.image}`} alt={tr(s.name)} width="256" height="256" className="h-48 w-48 rounded-[2rem] shadow-xl" />
                ) : (
                  <span className="inline-flex h-40 w-40 items-center justify-center rounded-[2rem] bg-white/15 text-white ring-1 ring-white/30">
                    <s.Icon size={76} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className={`px-6 pb-14 ${s.image ? 'text-navy-800' : 'text-white'}`}>
                <h2 className="font-display text-2xl font-extrabold">{tr(s.name)}</h2>
                <p className={`mt-2 text-sm leading-relaxed ${s.image ? 'text-navy-500' : 'text-white/90'}`}>{tr(s.text)}</p>
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
              aria-label={`${tr(s.name)} (${n + 1}/${slides.length})`}
              aria-current={n === i}
              className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${n === i ? 'w-7 bg-electric-500' : 'w-2.5 bg-navy-800/30'}`}
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
