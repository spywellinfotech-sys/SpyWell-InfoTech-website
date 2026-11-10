import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { PageHero, Section } from '../components/Section';
import { PortfolioCard } from '../components/Cards';
import { useLang } from '../i18n/LanguageContext';
import { portfolio } from '../data/content';

export default function Portfolio() {
  const { t, lang } = useLang();
  const apps = portfolio.filter((p) => p.status !== 'demo');
  const demos = portfolio.filter((p) => p.status === 'demo');
  return (
    <>
      <Seo page="portfolio" />
      <PageHero title={t('portfolio.title')} subtitle={t('portfolio.sub')} />
      <Section>
        <h2 className="mb-6 font-display text-2xl font-extrabold text-navy-800">{lang === 'hi' ? 'हमारे ऐप, डाउनलोड के लिए तैयार' : 'Our apps, ready to download'}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}><PortfolioCard item={p} /></Reveal>
          ))}
        </div>
        {demos.length > 0 && (
          <>
            <h2 className="mb-4 mt-14 font-display text-2xl font-extrabold text-navy-800">{lang === 'hi' ? 'नमूना कॉन्सेप्ट' : 'Sample concepts'}</h2>
            <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('portfolio.demoNote')}</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {demos.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 80}><PortfolioCard item={p} /></Reveal>
              ))}
            </div>
          </>
        )}
      </Section>
    </>
  );
}
