import Seo from '../components/Seo';
import { PageHero, Section } from '../components/Section';
import { useLang } from '../i18n/LanguageContext';
import { SITE } from '../data/site';
import { legal } from '../i18n/ui';

// EDIT: change this date whenever you update the legal text.
const LAST_UPDATED = '2026-11-05';

export default function Legal({ kind }) {
  const { t, tr, lang } = useLang();
  const sections = legal[kind][lang] || legal[kind].en;
  const fill = (s) => s.replace('{email}', SITE.email).replace('{location}', tr(SITE.location));
  const title = t(`seo.${kind}.title`).split('|')[0].trim();

  return (
    <>
      <Seo page={kind} />
      <PageHero title={title} subtitle={`${t('legal.updated')}: ${LAST_UPDATED}`} />
      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('legal.editNote')}</p>
          <div className="space-y-8">
            {sections.map(([heading, body]) => (
              <section key={heading}>
                <h2 className="font-display text-xl font-bold text-navy-800">{heading}</h2>
                <p className="mt-2 leading-relaxed text-slate-700">{fill(body)}</p>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
