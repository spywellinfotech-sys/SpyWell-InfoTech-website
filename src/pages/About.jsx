import { User } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { PageHero, Section, SectionHeading } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';
import { team, values } from '../data/content';

function Avatar({ photo, alt }) {
  if (photo) return <img src={photo} alt={alt} loading="lazy" width="160" height="160" className="h-24 w-24 rounded-full object-cover" />;
  return (
    <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-navy-100 text-navy-500">
      <User size={40} aria-hidden="true" />
    </span>
  );
}

export default function About() {
  const { t, tr } = useLang();
  const founder = team.find((m) => m.id === 'founder');
  const others = team.filter((m) => m.id !== 'founder');

  return (
    <>
      <Seo page="about" />
      <PageHero title={t('about.title')} subtitle={t('brand.tagline')} />

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-navy-800">{t('about.introTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700">{t('about.intro')}</p>
            <p className="mt-4 leading-relaxed text-slate-600">{t('about.introMore')}</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="rounded-2xl border border-navy-100 bg-slate-50 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-navy-800">{t('about.founderTitle')}</h2>
              {founder && (
                <div className="mt-5 flex items-center gap-5">
                  <Avatar photo={founder.photo} alt={tr(founder.name)} />
                  <div>
                    <p className="font-display text-lg font-semibold text-navy-800">{tr(founder.name)}</p>
                    <p className="text-sm font-medium text-electric-600">{tr(founder.role)}</p>
                    <p className="mt-2 text-sm text-slate-600">{tr(founder.bio)}</p>
                  </div>
                </div>
              )}
              <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t('about.founderNote')}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="bg-navy-900 text-white">
        <div className="grid gap-8 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="font-display text-2xl font-bold text-electric-300">{t('about.missionTitle')}</h2>
              <p className="mt-3 leading-relaxed text-navy-100">{t('about.mission')}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="font-display text-2xl font-bold text-electric-300">{t('about.visionTitle')}</h2>
              <p className="mt-3 leading-relaxed text-navy-100">{t('about.vision')}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading title={t('about.valuesTitle')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.icon} delay={i * 80}>
              <div className="h-full rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-sm">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
                  <Icon name={v.icon} size={24} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-navy-800">{tr(v.title)}</h3>
                <p className="mt-2 text-sm text-slate-600">{tr(v.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionHeading title={t('about.teamTitle')} subtitle={t('about.teamSub')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((m, i) => (
            <Reveal key={m.id} delay={i * 80}>
              <div className="flex h-full flex-col items-center rounded-2xl border border-navy-100 bg-white p-6 text-center shadow-sm">
                <Avatar photo={m.photo} alt={tr(m.name)} />
                <h3 className="mt-4 font-display font-semibold text-navy-800">{tr(m.name)}</h3>
                <p className="text-sm font-medium text-electric-600">{tr(m.role)}</p>
                <p className="mt-2 text-sm text-slate-600">{tr(m.bio)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
