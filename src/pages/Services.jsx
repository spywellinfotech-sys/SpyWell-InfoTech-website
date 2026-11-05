import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { PageHero, Section } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';
import { mailLink } from '../data/site';
import { services } from '../data/content';

export default function Services() {
  const { t, tr, lang } = useLang();
  return (
    <>
      <Seo page="services" />
      <PageHero title={t('services.title')} subtitle={t('services.sub')} />
      <Section>
        <div className="space-y-8">
          {services.map((s, i) => (
            <Reveal key={s.slug}>
              <article id={s.slug} className="scroll-mt-24 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-electric-300">
                        <Icon name={s.icon} size={28} />
                      </span>
                      <h2 className="font-display text-2xl font-bold text-navy-800">{tr(s.title)}</h2>
                    </div>
                    <p className="mt-4 leading-relaxed text-slate-700">{tr(s.description)}</p>
                    <Link
                      to="/contact"
                      className="mt-5 inline-flex rounded-full bg-electric-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-electric-600"
                    >
                      {t('common.talk')}
                    </Link>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-5">
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-navy-700">{t('services.features')}</h3>
                    <ul className="mt-3 space-y-2">
                      {(s.points[lang] || s.points.en).map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check size={16} className="mt-0.5 shrink-0 text-electric-600" aria-hidden="true" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          <a className="font-medium text-electric-600 hover:underline" href={mailLink()}>{t('common.email')}</a>
        </p>
      </Section>
    </>
  );
}
