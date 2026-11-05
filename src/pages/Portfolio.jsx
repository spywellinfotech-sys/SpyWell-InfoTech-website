import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { PageHero, Section } from '../components/Section';
import { PortfolioCard } from '../components/Cards';
import { useLang } from '../i18n/LanguageContext';
import { portfolio } from '../data/content';

export default function Portfolio() {
  const { t } = useLang();
  return (
    <>
      <Seo page="portfolio" />
      <PageHero title={t('portfolio.title')} subtitle={t('portfolio.sub')} />
      <Section>
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('portfolio.demoNote')}</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}><PortfolioCard item={p} /></Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
