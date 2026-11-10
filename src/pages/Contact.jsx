import { Mail, MapPin, MessageCircle } from 'lucide-react';
import Seo from '../components/Seo';
import { PageHero, Section } from '../components/Section';
import ContactForm from '../components/ContactForm';
import { useLang } from '../i18n/LanguageContext';
import { SITE, mailLink, whatsappLink } from '../data/site';

export default function Contact() {
  const { t, tr, lang } = useLang();
  const row = 'flex items-start gap-4 rounded-xl border border-navy-100 bg-white p-5 shadow-sm';
  const ico = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600';
  return (
    <>
      <Seo page="contact" />
      <PageHero title={t('contact.title')} subtitle={t('contact.sub')} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <h2 className="font-display text-2xl font-bold text-navy-800">{t('contact.detailsTitle')}</h2>
            <div className={row}>
              <span className={ico}><Mail size={22} aria-hidden="true" /></span>
              <div>
                <p className="text-sm text-slate-500">{t('contact.emailLabel')}</p>
                <a href={mailLink()} className="break-all font-semibold text-navy-800 hover:text-electric-600">{SITE.email}</a>
              </div>
            </div>
            <div className={row}>
              <span className={ico}><MessageCircle size={22} aria-hidden="true" /></span>
              <div>
                <p className="text-sm text-slate-500">{t('contact.whatsappLabel')}</p>
                <a href={whatsappLink(t('contact.waGreeting'))} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-800 hover:text-electric-600">
                  {SITE.whatsappDisplay}
                </a>
              </div>
            </div>
            <div className={row}>
              <span className={ico}><MapPin size={22} aria-hidden="true" /></span>
              <div>
                <p className="text-sm text-slate-500">{t('contact.locationLabel')}</p>
                <p className="font-semibold text-navy-800">{tr(SITE.location)}</p>
                <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-electric-600 hover:underline">{lang === 'hi' ? 'Google Maps पर देखें' : 'View on Google Maps'}</a>
              </div>
            </div>
            <a
              href={whatsappLink(t('contact.waGreeting'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:brightness-95"
            >
              <MessageCircle size={20} aria-hidden="true" /> {t('common.whatsapp')}
            </a>
          </div>
          <div className="lg:col-span-3"><ContactForm /></div>
        </div>
      </Section>
    </>
  );
}
