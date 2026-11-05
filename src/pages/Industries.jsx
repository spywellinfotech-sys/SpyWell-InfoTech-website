import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { PageHero, Section } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';
import { industries } from '../data/content';

export default function Industries() {
  const { t, tr } = useLang();
  return (
    <>
      <Seo page="industries" />
      <PageHero title={t('industries.title')} subtitle={t('industries.sub')} />
      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.icon + i} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition hover:shadow-lg">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
                  <Icon name={ind.icon} size={24} />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-navy-800">{tr(ind.title)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{tr(ind.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
